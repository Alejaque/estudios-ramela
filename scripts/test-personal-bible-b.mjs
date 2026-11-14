// Parte B: etiquetas MyBible, multi-módulo, reemplazo, re-proceso, migración.
// Autocontenida con fixtures mínimos. Requiere `vite preview` en :4173.
import { chromium } from 'playwright';

const BASE = 'http://localhost:4173';
const FIXTURE_MINI = '/tmp/fixture-mini-prueba.SQLite3';
const FIXTURE_STRONG = '/tmp/fixture-strong-prueba.SQLite3';
const results = [];
const ok = (name, cond, extra = '') => { console.log(`${cond ? 'PASS' : 'FAIL'} ${name}${extra ? ' — ' + extra : ''}`); results.push(`${cond ? 'PASS' : 'FAIL'} ${name}`); };

const browser = await chromium.launch({ executablePath: '/usr/bin/google-chrome' });
const ctx = await browser.newContext({ viewport: { width: 820, height: 1000 } });
const page = await ctx.newPage();
page.setDefaultTimeout(12000);
page.on('dialog', d => d.accept());

const ensurePanelOpen = async () => {
  const det = page.locator('details:has-text("Mi Biblia personal")');
  if (!await det.evaluate(d => d.open)) await page.click('text=Mi Biblia personal');
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
const readModal = async (studyTitle) => {
  if (!await page.isVisible(`text=${studyTitle}`)) {
    const toggle = page.locator('button[aria-expanded]');
    if (await toggle.getAttribute('aria-expanded') === 'false') await toggle.click();
  }
  await page.locator('button', { hasText: studyTitle }).first().click();
  await page.click('text=Leer pasaje');
  await page.waitForSelector('role=dialog');
  await page.waitForTimeout(700);
  const t = await page.textContent('role=dialog');
  await page.click('button[aria-label="Cerrar Biblia"]');
  return t;
};

await page.goto(BASE, { waitUntil: 'networkidle' });
await page.evaluate(() => {
  localStorage.setItem('reviewed_library_imports', JSON.stringify([
    { id: 'test-fil', title: 'Prueba Filipenses', passageOrTopic: 'Filipenses 4:10-13', content: 'Prueba.', createdAt: '2026-11-13T00:00:00-03:00' },
    { id: 'test-sal23', title: 'Prueba Salmo 23', passageOrTopic: 'Salmos 23:1-3', content: 'Prueba.', createdAt: '2026-11-13T00:00:00-03:00' },
    { id: 'test-sal27', title: 'Prueba Salmo 27', passageOrTopic: 'Salmos 27:1', content: 'Prueba.', createdAt: '2026-11-13T00:00:00-03:00' },
    { id: 'test-sal90', title: 'Prueba Salmo 90', passageOrTopic: 'Salmos 90:10', content: 'Prueba.', createdAt: '2026-11-13T00:00:00-03:00' },
    { id: 'test-sal1', title: 'Prueba Salmo 1', passageOrTopic: 'Salmos 1:1', content: 'Prueba.', createdAt: '2026-11-13T00:00:00-03:00' },
    { id: 'test-jn3', title: 'Prueba Juan 3', passageOrTopic: 'Juan 3:16', content: 'Prueba.', createdAt: '2026-11-13T00:00:00-03:00' },
    { id: 'test-gn1', title: 'Prueba Génesis 1', passageOrTopic: 'Génesis 1:1', content: 'Prueba.', createdAt: '2026-11-13T00:00:00-03:00' },
  ]));
});
await page.reload({ waitUntil: 'networkidle' });

// Setup: dos módulos (MINI y STRONG). El último importado queda en uso.
await ensurePanelOpen();
await page.setInputFiles('input[aria-label="Cargar módulo MyBible"]', FIXTURE_MINI);
await page.waitForSelector('text=/Listo: RV1909 MINI PRUEBA/');
await page.setInputFiles('input[aria-label="Cargar módulo MyBible"]', FIXTURE_STRONG);
await page.waitForSelector('text=/Listo: RV1909 STRONG PRUEBA/');
ok('panel lista ambos módulos', await page.isVisible('text=RV1909 MINI PRUEBA') && await page.isVisible('text=RV1909 STRONG PRUEBA'));

// 9. Limpieza de etiquetas MyBible reales
let body = await readModal('Prueba Salmo 23');
ok('modal usa módulo Strong recién importado', body.includes('Tu Biblia personal · RV1909 STRONG PRUEBA'));
ok('Strong fuera del texto (Sal 23:1)', body.includes('Jehová es mi pastor; nada me faltará.'), body.split('\n').find(l => l.includes('pastor')) || '');
ok('<n> conserva su texto', body.includes('y me conducirá por sendas de justicia'));
ok('sin códigos Strong visibles', !/(3068|1961|7462|3808|2637|5116|1877|7257|5921|4325|4496|5095|7725|5315|5148|4570|6664|4616|8034)/.test(body));
ok('sin nota al pie [1]', !body.includes('[1]'));
ok('sin morfología N-msa', !body.includes('N-msa'));

body = await readModal('Prueba Salmo 27');
ok('título de salmo sin pegar palabras', body.includes('«Salmo de David.» * Jehová es mi luz y mi salvación;'), body.split('\n').find(l => l.includes('David')) || '');
ok('doble Strong seguida limpio', body.includes('¿de quién temeré?') && !/(4310|6342|3372|4581|2416)/.test(body));

body = await readModal('Prueba Salmo 90');
ok('números legítimos intactos', body.includes('son 70 años') && body.includes('80 años'), body.split('\n').find(l => l.includes('70')) || '');

body = await readModal('Prueba Salmo 1');
const lineSal1 = body.split('\n').find(l => l.includes('Bienaventurado')) || '';
ok('Strong al inicio no deja residuo', lineSal1.includes('Bienaventurado el varón que no anduvo') && !lineSal1.includes('376'), lineSal1);

body = await readModal('Prueba Juan 3');
ok('<J> conserva su texto', body.includes('que ha dado a su Hijo unigénito'));
ok('Strong griego fuera', !/(3754|3779|2889|3439|3956|4100|2192)/.test(body));

body = await readModal('Prueba Génesis 1');
ok('<i>/<e> conservan su texto', body.includes('En el principio') && body.includes('creó Dios los cielos y la tierra.') && !/(7225|1254|8064)/.test(body));

// 10. Alternar de módulo sin reelegir archivo
await ensurePanelOpen();
await page.click('button:has-text("Usar esta Biblia")');
await page.waitForSelector('text=/Las citas ahora se muestran con RV1909 MINI PRUEBA/');
body = await readModal('Prueba Filipenses');
ok('tras alternar, modal usa MINI', body.includes('Tu Biblia personal · RV1909 MINI PRUEBA') && body.includes('Cristo'));
body = await readModal('Prueba Salmo 23');
ok('mismo pasaje con el otro módulo', body.includes('Tu Biblia personal · RV1909 MINI PRUEBA'));

// 11. Reimportar el MISMO archivo reemplaza, no duplica
await ensurePanelOpen();
await page.setInputFiles('input[aria-label="Cargar módulo MyBible"]', FIXTURE_MINI);
await page.waitForSelector('text=/Listo: RV1909 MINI PRUEBA/');
const st2 = await idbRead();
ok('mismo archivo no duplica módulo', Object.keys(st2.meta).filter(k => k.startsWith('mod:')).length === 2);

// 12. Re-proceso automático desde el raw
const strongKey = Object.keys(st2.meta).find(k => k.startsWith('mod:') && st2.meta[k].name?.includes('STRONG'));
const strongId = strongKey.slice(4);
await ensurePanelOpen();
await page.click('button:has-text("Usar esta Biblia")');
await page.waitForSelector('text=/Las citas ahora se muestran con RV1909 STRONG PRUEBA/');
await page.evaluate(async (sid) => {
  const db = await new Promise(r => { const q = indexedDB.open('personal-bible', 1); q.onsuccess = () => r(q.result); });
  const put = (store, k, v) => new Promise(r => { const t = db.transaction(store, 'readwrite'); t.objectStore(store).put(v, k); t.oncomplete = r; });
  const get = (store, k) => new Promise(r => { const t = db.transaction(store, 'readonly').objectStore(store).get(k); t.onsuccess = () => r(t.result); });
  const meta = await get('meta', `mod:${sid}`);
  meta.parserVersion = 1;
  await put('meta', `mod:${sid}`, meta);
  const salmos = await get('books', `${sid}:salmos`);
  salmos['23']['1'] = salmos['23']['1'] + '3068'; // residuo como el del parseo viejo
  await put('books', `${sid}:salmos`, salmos);
  db.close();
}, strongId);
await page.reload({ waitUntil: 'networkidle' });
body = await readModal('Prueba Salmo 23');
ok('re-proceso limpia residuo viejo', body.includes('Jehová es mi pastor; nada me faltará.') && !body.includes('me faltará.3068'), body.split('\n').find(l => l.includes('pastor')) || '');
const st4 = await idbRead();
ok('re-proceso sube parserVersion', st4.meta[`mod:${strongId}`]?.parserVersion === 2);

// 13. Sin raw: no inventa recuperación, sigue sirviendo lo guardado
await page.evaluate(async (sid) => {
  const db = await new Promise(r => { const q = indexedDB.open('personal-bible', 1); q.onsuccess = () => r(q.result); });
  const del = (store, k) => new Promise(r => { const t = db.transaction(store, 'readwrite'); t.objectStore(store).delete(k); t.oncomplete = r; });
  const put = (store, k, v) => new Promise(r => { const t = db.transaction(store, 'readwrite'); t.objectStore(store).put(v, k); t.oncomplete = r; });
  const get = (store, k) => new Promise(r => { const t = db.transaction(store, 'readonly').objectStore(store).get(k); t.onsuccess = () => r(t.result); });
  await del('meta', `raw:${sid}`);
  const meta = await get('meta', `mod:${sid}`);
  meta.parserVersion = 1;
  await put('meta', `mod:${sid}`, meta);
  db.close();
}, strongId);
await page.reload({ waitUntil: 'networkidle' });
body = await readModal('Prueba Salmo 23');
ok('sin raw sigue sirviendo lo guardado', body.includes('Tu Biblia personal') && body.includes('Jehová es mi pastor'));
const st5 = await idbRead();
ok('sin raw no inventa parserVersion', st5.meta[`mod:${strongId}`]?.parserVersion === 1);

// 14. Migración del formato v1 (meta 'module' + libros sin prefijo)
await page.evaluate(async () => {
  const db = await new Promise(r => { const q = indexedDB.open('personal-bible', 1); q.onsuccess = () => r(q.result); });
  const put = (store, k, v) => new Promise(r => { const t = db.transaction(store, 'readwrite'); t.objectStore(store).put(v, k); t.oncomplete = r; });
  await put('meta', 'module', { name: 'LEGADO RV1909', language: 'spa', bookCount: 1, verseCount: 1, importedAt: '2026-11-10T00:00:00.000Z', fileName: 'viejo.SQLite3' });
  await put('books', 'salmos', { '1': { '1': 'Texto legado de prueba del formato viejo.' } });
  db.close();
});
await page.reload({ waitUntil: 'networkidle' });
await ensurePanelOpen();
ok('módulo legado migrado y visible', await page.isVisible('text=LEGADO RV1909'));
const st6 = await idbRead();
ok('migración elimina claves viejas', !st6.meta['module'] && !st6.books['salmos'], Object.keys(st6.books).join(','));
const legKey = Object.keys(st6.meta).find(k => k.startsWith('mod:') && st6.meta[k].name === 'LEGADO RV1909');
ok('migración marca parserVersion 1 (sin inventar raw)', st6.meta[legKey]?.parserVersion === 1 && !st6.meta[`raw:${legKey.slice(4)}`]);

// 15. Quitar módulos: quitar el activo reasigna "en uso"
const legId = legKey.slice(4);
await page.evaluate(async (lid) => {
  const db = await new Promise(r => { const q = indexedDB.open('personal-bible', 1); q.onsuccess = () => r(q.result); });
  await new Promise(r => { const t = db.transaction('meta', 'readwrite'); t.objectStore('meta').put(lid, 'active'); t.oncomplete = r; });
  db.close();
}, legId);
await page.reload({ waitUntil: 'networkidle' });
await ensurePanelOpen();
ok('tres módulos listados', await page.locator('button:has-text("Quitar")').count() === 3);
await page.locator('div', { hasText: 'Cargada desde viejo.SQLite3' }).locator('button:has-text("Quitar")').first().click();
await page.waitForTimeout(1100);
const st7 = await idbRead();
ok('legado quitado, otros intactos', !Object.keys(st7.meta).some(k => k.startsWith('mod:') && st7.meta[k].name === 'LEGADO RV1909') && Object.keys(st7.meta).filter(k => k.startsWith('mod:')).length === 2);
ok('active reasignado a un módulo existente', !!st7.meta[`mod:${st7.meta['active']}`]);

await browser.close();
const failed = results.filter(r => r.startsWith('FAIL'));
console.log(`\n${results.length - failed.length}/${results.length} PASS`);
process.exit(failed.length ? 1 : 0);
