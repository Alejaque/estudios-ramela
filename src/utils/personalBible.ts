// Lector de la Biblia personal del usuario (módulo MyBible .SQLite3).
// El archivo se lee y se guarda SOLO en este dispositivo (IndexedDB);
// nunca se sube a Internet ni pasa por ningún servidor.
import initSqlJs from 'sql.js';
import wasmUrl from 'sql.js/dist/sql-wasm.wasm?url';
import { normRef, passageFromData, BibleData } from './offlineBible';

export interface PersonalModuleMeta {
  name: string;
  language: string;
  bookCount: number;
  verseCount: number;
  importedAt: string;
  fileName: string;
}

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

// Quita etiquetas HTML del texto del módulo y devuelve texto plano seguro.
function stripHtml(html: string): string {
  const doc = new DOMParser().parseFromString(html, 'text/html');
  return (doc.body.textContent || '').replace(/ /g, ' ').replace(/[ \t]+/g, ' ').trim();
}

export async function getPersonalMeta(): Promise<PersonalModuleMeta | null> {
  try {
    const db = await openDb();
    const meta = await idbGet(db, META_STORE, 'module');
    db.close();
    return meta || null;
  } catch { return null; }
}

export async function clearPersonalModule(): Promise<void> {
  const db = await openDb();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction([BOOKS_STORE, META_STORE], 'readwrite');
    tx.objectStore(BOOKS_STORE).clear();
    tx.objectStore(META_STORE).clear();
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
  db.close();
}

export class ModuleFormatError extends Error {}

export async function importPersonalModule(file: File): Promise<PersonalModuleMeta> {
  const SQL = await initSqlJs({ locateFile: () => wasmUrl });
  const buf = new Uint8Array(await file.arrayBuffer());
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
      name: (info.description || info.name || file.name.replace(/\.[^.]+$/, '')).trim(),
      language: (info.language || '').trim(),
      bookCount: Object.keys(byBook).length,
      verseCount,
      importedAt: new Date().toISOString(),
      fileName: file.name,
    };

    const idb = await openDb();
    // Reemplazo completo: primero se limpia para no mezclar módulos.
    await new Promise<void>((resolve, reject) => {
      const tx = idb.transaction([BOOKS_STORE, META_STORE], 'readwrite');
      tx.objectStore(BOOKS_STORE).clear();
      tx.objectStore(META_STORE).clear();
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
    for (const [key, chapters] of Object.entries(byBook)) await idbPut(idb, BOOKS_STORE, key, chapters);
    await idbPut(idb, META_STORE, 'module', meta);
    idb.close();
    return meta;
  } finally {
    db.close();
  }
}

// Texto de un pasaje desde el módulo personal. null = módulo ausente o pasaje faltante.
export async function personalPassage(reference: string): Promise<{ text: string; meta: PersonalModuleMeta } | null> {
  const db = await openDb();
  const meta: PersonalModuleMeta | undefined = await idbGet(db, META_STORE, 'module');
  if (!meta) { db.close(); return null; }

  const m = normRef(reference).match(/^(.+?)\s+(\d+)(?::(.+))?$/);
  if (!m) { db.close(); return null; }
  const key = m[1] === 'salmo' ? 'salmos' : m[1];
  const chapters = await idbGet(db, BOOKS_STORE, key);
  db.close();
  if (!chapters) return null;

  const data: BibleData = { [key]: chapters };
  const text = passageFromData(data, reference);
  return text ? { text, meta } : null;
        }
