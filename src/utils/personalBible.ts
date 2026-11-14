// Lector de la Biblia personal del usuario (módulos MyBible .SQLite3).
// Los archivos se leen y se guardan SOLO en este dispositivo (IndexedDB);
// nunca se suben a Internet ni pasan por ningún servidor.
import initSqlJs from 'sql.js';
import wasmUrl from 'sql.js/dist/sql-wasm.wasm?url';
import { normRef, passageFromData, BibleData } from './offlineBible';

export interface PersonalModuleMeta {
  id?: string;
  name: string;
  language: string;
  bookCount: number;
  verseCount: number;
  importedAt: string;
  fileName: string;
  parserVersion?: number;
  hasRaw?: boolean;
  active?: boolean;
}

// Versión del parseo: subir cuando cambia stripHtml o la lectura del módulo.
// Los módulos con archivo original guardado se re-procesan solos al abrir la app.
const PARSER_VERSION = 2;

const DB_NAME = 'personal-bible';
const BOOKS_STORE = 'books';
const META_STORE = 'meta';

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(BOOKS_STORE)) db.createObjectStore(BOOKS_STORE);
      if (!db.objectStoreNames.contains(META_STORE)) db.createObjectStore(META_STORE);
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

function idbPut(db: IDBDatabase, store: string, key: string, value: any): Promise<void> {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(store, 'readwrite');
    tx.objectStore(store).put(value, key);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

function idbGet(db: IDBDatabase, store: string, key: string): Promise<any> {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(store, 'readonly');
    const req = tx.objectStore(store).get(key);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

function idbDelete(db: IDBDatabase, store: string, key: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(store, 'readwrite');
    tx.objectStore(store).delete(key);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

function idbGetAllKeys(db: IDBDatabase, store: string): Promise<string[]> {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(store, 'readonly');
    const req = tx.objectStore(store).getAllKeys();
    req.onsuccess = () => resolve((req.result || []).map(String));
    req.onerror = () => reject(req.error);
  });
}

// Quita etiquetas del texto del módulo y devuelve texto plano seguro.
// Formato MyBible verificado (BibleMultiConverter, MyBibleZone.java):
//   <S>…</S>  números Strong: su contenido NO es texto bíblico -> se elimina entero.
//   <f>…</f>  marca de nota al pie ("[1]", "†"): tampoco es texto bíblico -> se elimina.
//   <m>…</m>  código de morfología (solo con Strong): se elimina.
//   <pb/> <br/> <t> </t>: saltos/títulos -> espacio para no pegar palabras.
//   <n> <i> <J> <e> <h> …: formato; el texto interno ES bíblico -> se conserva.
// Los números que forman parte del texto ("los 12 discípulos", "año 70") nunca
// están dentro de estas etiquetas, así que no se tocan.
function stripHtml(html: string): string {
  const pre = String(html)
    .replace(/<S>[\s\S]*?<\/S>/gi, '')
    .replace(/<f>[\s\S]*?<\/f>/gi, '')
    .replace(/<m>[\s\S]*?<\/m>/gi, '')
    .replace(/<(?:pb|br)\s*\/>/gi, ' ')
    .replace(/<\/?t\s*>/gi, ' ');
  const doc = new DOMParser().parseFromString(pre, 'text/html');
  return (doc.body.textContent || '').replace(/ /g, ' ').replace(/[ \t]+/g, ' ').trim();
}

// ---- Migración del formato viejo (un solo módulo, sin archivo original) ----
// El formato viejo guardaba meta en clave 'module' y libros con clave 'salmos'.
// El nuevo guarda meta 'mod:<id>', libros '<id>:salmos', raw 'raw:<id>' y 'active'.
async function migrateLegacy(db: IDBDatabase): Promise<void> {
  const legacyMeta = await idbGet(db, META_STORE, 'module');
  if (!legacyMeta) return;
  const id = 'mig' + Date.now().toString(36);
  for (const k of await idbGetAllKeys(db, BOOKS_STORE)) {
    if (k.includes(':')) continue;
    const chapters = await idbGet(db, BOOKS_STORE, k);
    await idbPut(db, BOOKS_STORE, `${id}:${k}`, chapters);
    await idbDelete(db, BOOKS_STORE, k);
  }
  const meta: PersonalModuleMeta = { ...legacyMeta, id, parserVersion: legacyMeta.parserVersion ?? 1 };
  await idbPut(db, META_STORE, `mod:${id}`, meta);
  await idbPut(db, META_STORE, 'active', id);
  await idbDelete(db, META_STORE, 'module');
}

async function getActiveId(db: IDBDatabase): Promise<string | null> {
  const active = await idbGet(db, META_STORE, 'active');
  if (active) return String(active);
  const keys = (await idbGetAllKeys(db, META_STORE)).filter(k => k.startsWith('mod:'));
  return keys.length === 1 ? keys[0].slice(4) : null;
}

// ---- Parseo de un módulo MyBible ----
async function parseModuleBuffer(buf: Uint8Array, fileName: string, importedAt: string)
  : Promise<{ meta: PersonalModuleMeta; byBook: BibleData }> {
  const SQL = await initSqlJs({ locateFile: () => wasmUrl });
  let db: any;
  try { db = new SQL.Database(buf); }
  catch { throw new ModuleFormatError('El archivo no se pudo abrir como base SQLite.'); }

  try {
    const tables = new Set<string>();
    for (const row of db.exec("SELECT name FROM sqlite_master WHERE type='table'")[0]?.values || []) tables.add(String(row[0]));
    if (!tables.has('verses') || !tables.has('books')) {
      throw new ModuleFormatError('El archivo no tiene la estructura de un módulo MyBible (faltan tablas books/verses).');
    }

    const info: Record<string, string> = {};
    if (tables.has('info')) {
      for (const row of db.exec('SELECT name, value FROM info')[0]?.values || []) info[String(row[0])] = String(row[1]);
    }

    // Mapa número de libro MyBible -> nombre del libro en el idioma del módulo.
    const bookNames = new Map<number, string>();
    for (const row of db.exec('SELECT book_number, long_name, short_name FROM books')[0]?.values || []) {
      const num = Number(row[0]);
      const longName = String(row[1] || '').trim();
      const shortName = String(row[2] || '').trim();
      bookNames.set(num, longName || shortName);
    }
    if (bookNames.size === 0) throw new ModuleFormatError('El módulo no lista libros (tabla books vacía).');

    // Versículos agrupados por libro normalizado -> capítulo -> versículo.
    const byBook: BibleData = {};
    let verseCount = 0;
    const stmt = db.prepare('SELECT book_number, chapter, verse, text FROM verses');
    while (stmt.step()) {
      const [bn, ch, vs, tx] = stmt.get() as [number, number, number, string];
      const name = bookNames.get(Number(bn));
      if (!name) continue;
      const key = normRef(name);
      const text = stripHtml(String(tx ?? ''));
      if (!text) continue;
      (byBook[key] ||= {});
      (byBook[key][String(ch)] ||= {});
      byBook[key][String(ch)][String(vs)] = text;
      verseCount++;
    }
    stmt.free();
    if (verseCount === 0) throw new ModuleFormatError('No se encontraron versículos legibles en el módulo.');

    const meta: PersonalModuleMeta = {
      name: (info.description || info.name || fileName.replace(/\.[^.]+$/, '')).trim(),
      language: (info.language || '').trim(),
      bookCount: Object.keys(byBook).length,
      verseCount,
      importedAt,
      fileName,
    };
    return { meta, byBook };
  } finally {
    db.close();
  }
}

// ---- Re-proceso automático desde el archivo original guardado ----
const reparsing = new Map<string, Promise<PersonalModuleMeta | null>>();

function reparseModule(id: string): Promise<PersonalModuleMeta | null> {
  const existing = reparsing.get(id);
  if (existing) return existing;
  const p = (async (): Promise<PersonalModuleMeta | null> => {
    const db = await openDb();
    const meta: PersonalModuleMeta | undefined = await idbGet(db, META_STORE, `mod:${id}`);
    const raw: Blob | undefined = await idbGet(db, META_STORE, `raw:${id}`);
    // Sin archivo original no hay re-proceso posible: se devuelve lo que hay, sin inventar.
    if (!meta || !raw) { db.close(); return meta || null; }
    try {
      const buf = new Uint8Array(await raw.arrayBuffer());
      const parsed = await parseModuleBuffer(buf, meta.fileName || 'modulo.SQLite3', meta.importedAt);
      for (const k of await idbGetAllKeys(db, BOOKS_STORE)) {
        if (k.startsWith(id + ':')) await idbDelete(db, BOOKS_STORE, k);
      }
      for (const [bk, chapters] of Object.entries(parsed.byBook)) await idbPut(db, BOOKS_STORE, `${id}:${bk}`, chapters);
      const newMeta: PersonalModuleMeta = { ...parsed.meta, id, parserVersion: PARSER_VERSION };
      await idbPut(db, META_STORE, `mod:${id}`, newMeta);
      db.close();
      return newMeta;
    } catch {
      db.close();
      return meta;
    }
  })().finally(() => { reparsing.delete(id); });
  reparsing.set(id, p);
  return p;
}

// ---- API pública ----

// Todos los módulos cargados, con marca del que está en uso.
export async function listPersonalModules(): Promise<PersonalModuleMeta[]> {
  try {
    const db = await openDb();
    await migrateLegacy(db);
    const activeId = await getActiveId(db);
    const keys = await idbGetAllKeys(db, META_STORE);
    const out: PersonalModuleMeta[] = [];
    for (const k of keys) {
      if (!k.startsWith('mod:')) continue;
      const meta: PersonalModuleMeta = await idbGet(db, META_STORE, k);
      if (!meta) continue;
      const raw = await idbGet(db, META_STORE, `raw:${meta.id}`);
      out.push({ ...meta, active: meta.id === activeId, hasRaw: !!raw });
    }
    db.close();
    return out;
  } catch { return []; }
}

// Meta del módulo en uso. Si el parseo quedó viejo y hay archivo original
// guardado, lo re-procesa antes de responder.
export async function getPersonalMeta(): Promise<PersonalModuleMeta | null> {
  try {
    const db = await openDb();
    await migrateLegacy(db);
    const activeId = await getActiveId(db);
    const meta: PersonalModuleMeta | undefined = activeId ? await idbGet(db, META_STORE, `mod:${activeId}`) : null;
    db.close();
    if (!meta) return null;
    if ((meta.parserVersion ?? 1) !== PARSER_VERSION && meta.id) return await reparseModule(meta.id);
    return meta;
  } catch { return null; }
}

export async function setActiveModule(id: string): Promise<void> {
  const db = await openDb();
  const meta = await idbGet(db, META_STORE, `mod:${id}`);
  if (meta) await idbPut(db, META_STORE, 'active', id);
  db.close();
  if (meta && (meta.parserVersion ?? 1) !== PARSER_VERSION) await reparseModule(id);
}

// Importa un módulo nuevo. Si ya había uno cargado desde el MISMO archivo,
// lo reemplaza en el mismo lugar (queda uno solo). El módulo importado queda en uso.
export async function importPersonalModule(file: File): Promise<PersonalModuleMeta> {
  const buf = new Uint8Array(await file.arrayBuffer());
  const parsed = await parseModuleBuffer(buf, file.name, new Date().toISOString());

  const idb = await openDb();
  await migrateLegacy(idb);
  const existing = await listPersonalModules();
  const same = existing.find(m => m.fileName === file.name);
  const id = same?.id || 'mod' + Date.now().toString(36);

  // Limpia solo los libros del módulo reemplazado (si había), no los de otros.
  for (const k of await idbGetAllKeys(idb, BOOKS_STORE)) {
    if (k.startsWith(id + ':')) await idbDelete(idb, BOOKS_STORE, k);
  }
  for (const [key, chapters] of Object.entries(parsed.byBook)) await idbPut(idb, BOOKS_STORE, `${id}:${key}`, chapters);
  const meta: PersonalModuleMeta = { ...parsed.meta, id, parserVersion: PARSER_VERSION };
  await idbPut(idb, META_STORE, `mod:${id}`, meta);
  await idbPut(idb, META_STORE, `raw:${id}`, file);
  await idbPut(idb, META_STORE, 'active', id);
  idb.close();
  return meta;
}

export async function removePersonalModule(id: string): Promise<void> {
  const db = await openDb();
  for (const k of await idbGetAllKeys(db, BOOKS_STORE)) {
    if (k.startsWith(id + ':')) await idbDelete(db, BOOKS_STORE, k);
  }
  await idbDelete(db, META_STORE, `mod:${id}`);
  await idbDelete(db, META_STORE, `raw:${id}`);
  const active = await idbGet(db, META_STORE, 'active');
  if (active === id) {
    const rest = (await idbGetAllKeys(db, META_STORE)).filter(k => k.startsWith('mod:'));
    if (rest.length) await idbPut(db, META_STORE, 'active', rest[0].slice(4));
    else await idbDelete(db, META_STORE, 'active');
  }
  db.close();
}

export class ModuleFormatError extends Error {}

// Texto de un pasaje desde el módulo en uso. null = sin módulo o pasaje faltante.
export async function personalPassage(reference: string): Promise<{ text: string; meta: PersonalModuleMeta } | null> {
  const meta = await getPersonalMeta();
  if (!meta?.id) return null;

  const m = normRef(reference).match(/^(.+?)\s+(\d+)(?::(.+))?$/);
  if (!m) return null;
  const key = m[1] === 'salmo' ? 'salmos' : m[1];
  const db = await openDb();
  const chapters = await idbGet(db, BOOKS_STORE, `${meta.id}:${key}`);
  db.close();
  if (!chapters) return null;

  const data: BibleData = { [key]: chapters };
  const text = passageFromData(data, reference);
  return text ? { text, meta } : null;
}
