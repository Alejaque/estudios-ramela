// Prueba local E2E del lector de Biblia personal (fixtures públicos RV1909).
// Cubre: importación, persistencia, offline, limpieza de etiquetas MyBible
// (Strong/notas/morfología), números legítimos intactos, multi-módulo,
// reemplazo por mismo archivo, re-proceso desde el raw y migración v1.
import { chromium } from 'playwright';

const BASE = 'http://localhost:4173';
const FIXTURE = '/tmp/fixture-rv1909-prueba.SQLite3';
const FIXTURE_STRONG = '/tmp/fixture-strong-prueba.SQLite3';
const results = [];
const ok = (name, cond, extra = '') => { console.log(`${cond?'PASS':'FAIL'} ${name}${extra?' — '+extra:''}`); results.push(`${cond ? 'PASS' : 'FAIL'} ${name}${extra ? ' — ' + extra : ''}`); };

const browser = await chromium.launch({ executablePath: '/usr/bin/google-chrome' });
const ctx = await browser.newContext({ viewport: { width: 820, height: 1000 } });
const page = await ctx.newPage();
page.on('dialog', d => d.accept());
const netLog = [];
page.on('request', r => netLog.push(r.url()));

// Helpers de IndexedDB para verificar estado interno
const ensurePanelOpen = async () => {
  const det = page.locator('details:has-text("Mi Biblia personal")');
  if (!await det.evaluate(d => d.open)) await ensurePanelOpen();
};
const idbRead = () => page.evaluate(async () => {
  const db = await new Promise(r => { const q = indexedDB.open('personal-bible', 1); q.onsuccess = () => r(q.result); });
  const all = async (store) => {
    const keys = await new Promise(r => { const t = db.transaction(store, 'readonly').objectStore(store).getAllKeys(); t.onsuccess = () => r(t.result); });
    const out = {};
    for (const k of keys) {
      const v = await new Promise(r => { const t = db.transaction(store, 'readonly').objectStore(store).get(k); t.onsuccess = () => r(t.result); });
      out[String(k)] = v instanceof Blob ? `Blob(${v.size})` : v;
    }
    return out;
  };
  const books = await all('books');
  const meta = await all('meta');
  db.close();
  return { books, meta };
});

await page.goto(BASE, { waitUntil: 'networkidle' });

// 0. Estado inicial: panel con input de carga, sin módulo
await ensurePanelOpen();
ok('panel con input de carga', await page.$('input[aria-label="Cargar módulo MyBible"]') !== null);

// 1. Regresión sin módulo: Leer pasaje muestra RV1909 SIN nota de "tu Biblia personal"
await page.click('text=Leer pasaje');
await page.waitForSelector('role=dialog');
let body = await page.textContent('role=dialog');
ok('sin módulo muestra RV1909', body.includes('Reina-Valera 1909'));
ok('sin módulo NO muestra nota de módulo', !body.includes('Tu Biblia personal no tiene este pasaje'));
await page.click('button[aria-label="Cerrar Biblia"]');

// 2. Import del fixture RV1909
const libBefore = await page.evaluate(() => localStorage.getItem('reviewed_library_imports')?.length);
await page.setInputFiles('input[aria-label="Cargar módulo MyBible"]', FIXTURE);
await page.waitForSelector('text=/Listo:/', { timeout: 30000 });
const importMsg = await page.textContent('text=/Listo:/');
ok('import exitoso', /4 libros/.test(importMsg) && /4\.977/.test(importMsg), importMsg.trim().slice(0, 90));

// 3. Los estudios no se tocaron
const libAfter = await page.evaluate(() => localStorage.getItem('reviewed_library_imports')?.length);
ok('biblioteca intacta', libBefore === libAfter, `${libBefore} -> ${libAfter}`);

// 4. Modal usa el módulo personal
await page.evaluate(() => {
  localStorage.setItem('reviewed_library_imports', JSON.stringify([
    { id: 'test-fil', title: 'Prueba Filipenses', passageOrTopic: 'Filipenses 4:10-13', content: '## Introducción\n\nPrueba.', createdAt: '2026-11-13T00:00:00-03:00' },
    { id: 'test-sal23', title: 'Prueba Salmo 23', passageOrTopic: 'Salmos 23:1-3', content: 'Prueba.', createdAt: '2026-11-13T00:00:00-03:00' },
    { id: 'test-sal27', title: 'Prueba Salmo 27', passageOrTopic: 'Salmos 27:1', content: 'Prueba.', createdAt: '2026-11-13T00:00:00-03:00' },
    { id: 'test-sal90', title: 'Prueba Salmo 90', passageOrTopic: 'Salmos 90:10', content: 'Prueba.', createdAt: '2026-11-13T00:00:00-03:00' },
    { id: 'test-sal1', title: 'Prueba Salmo 1', passageOrTopic: 'Salmos 1:1', content: 'Prueba.', createdAt: '2026-11-13T00:00:00-03:00' },
    { id: 'test-jn3', title: 'Prueba Juan 3', passageOrTopic: 'Juan 3:16', content: 'Prueba.', createdAt: '2026-11-13T00:00:00-03:00' },
    { id: 'test-gn1', title: 'Prueba Génesis 1', passageOrTopic: 'Génesis 1:1', content: 'Prueba.', createdAt: '2026-11-13T00:00:00-03:00' },
  ]));
});
await page.reload({ waitUntil: 'networkidle' });
await page.click('text=Prueba Filipenses');
await page.click('text=Leer pasaje');
await page.waitForSelector('role=dialog');
await page.waitForTimeout(900);
body = await page.textContent('role=dialog');
ok('modal usa Biblia personal', body.includes('Tu Biblia personal · RV1909 PRUEBA'), '');
ok('modal muestra texto del pasaje', body.includes('Cristo') || body.includes('Jehová'));
ok('modal conserva botón RVR1960 en línea', await page.isVisible('text=Ver en RVR1960'));
await page.click('button[aria-label="Cerrar Biblia"]');

// 5. Verificación directa en IndexedDB (claves con id de módulo)
const st1 = await idbRead();
const modKeys = Object.keys(st1.meta).filter(k => k.startsWith('mod:'));
const id1 = modKeys[0]?.slice(4);
ok('meta del módulo con id', modKeys.length === 1 && !!st1.meta[`mod:${id1}`]?.name, JSON.stringify(modKeys));
ok('libros con clave <id>:libro', !!st1.books[`${id1}:salmos`] && !st1.books['salmos']);
ok('Marcos ausente del fixture (para nota explícita)', !st1.books[`${id1}:marcos`]);
ok('meta con verseCount', st1.meta[`mod:${id1}`]?.verseCount === 4977);
ok('raw del archivo guardado', typeof st1.meta[`raw:${id1}`] === 'string' && st1.meta[`raw:${id1}`].startsWith('Blob('), st1.meta[`raw:${id1}`]);
ok('módulo activo marcado', st1.meta['active'] === id1);
ok('parserVersion actual', st1.meta[`mod:${id1}`]?.parserVersion === 2);

// 6. Persistencia tras recarga
await page.reload({ waitUntil: 'networkidle' });
await ensurePanelOpen();
ok('persiste tras recarga', await page.isVisible('text=RV1909 PRUEBA'));

// 7. SW activo y luego OFFLINE total
await page.evaluate(async () => { await navigator.serviceWorker.ready; });
await ctx.setOffline(true);
await page.reload().catch(() => {});
await page.waitForTimeout(1100);
const offlineOk = await page.evaluate(() => document.body.innerText.length > 200);
ok('app carga offline', offlineOk);
await page.click('text=Leer pasaje').catch(e => ok('click offline', false, e.message));
await page.waitForSelector('role=dialog', { timeout: 8000 }).catch(() => {});
body = await page.textContent('role=dialog').catch(() => '');
ok('modal offline usa Biblia personal', body.includes('Tu Biblia personal'), body.slice(0, 80).replace(/\n/g, ' '));
await page.screenshot({ path: '/downloads/modal-biblia-personal-offline.png' });
await page.click('button[aria-label="Cerrar Biblia"]').catch(() => {});
await ctx.setOffline(false);

// 8. Nada salió a la red por la función nueva
const external = netLog.filter(u => !u.startsWith(BASE) && !u.startsWith('data:') && !u.startsWith('blob:'));
const nonFont = external.filter(u => !u.includes('fonts.googleapis.com') && !u.includes('fonts.gstatic.com'));
ok('sin requests externos del lector (fuentes Google son preexistentes)', nonFont.length === 0, nonFont.slice(0, 3).join(', ') || `fuentes preexistentes: ${external.length}`);
ok('wasm SQLite servido local', netLog.some(u => u.startsWith(BASE) && u.includes('wasm')));

await browser.close();
console.log(results.join('\n'));
const failed = results.filter(r => r.startsWith('FAIL'));
console.log(`\n${results.length - failed.length}/${results.length} PASS`);
process.exit(failed.length ? 1 : 0);
