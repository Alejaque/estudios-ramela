import type { VercelRequest, VercelResponse } from '@vercel/node';

const BIBLES: Record<string, string> = {
  rvr60: '592420522e16049f-01', // en api.bible es la Reina-Valera 1909 (dominio publico)
  nvi: 'b32b9d1b64b4ef29-01', // en api.bible es "Simple Spanish", no la NVI
};

const BOOKS: Record<string, string> = {
  genesis: 'GEN', exodo: 'EXO', levitico: 'LEV', numeros: 'NUM', deuteronomio: 'DEU', josue: 'JOS', jueces: 'JDG', rut: 'RUT',
  '1 samuel': '1SA', '2 samuel': '2SA', '1 reyes': '1KI', '2 reyes': '2KI', '1 cronicas': '1CH', '2 cronicas': '2CH',
  esdras: 'EZR', nehemias: 'NEH', ester: 'EST', job: 'JOB', salmos: 'PSA', salmo: 'PSA', proverbios: 'PRO', eclesiastes: 'ECC',
  cantares: 'SNG', isaias: 'ISA', jeremias: 'JER', lamentaciones: 'LAM', ezequiel: 'EZK', daniel: 'DAN', oseas: 'HOS', joel: 'JOL',
  amos: 'AMO', abdias: 'OBA', jonas: 'JON', miqueas: 'MIC', nahum: 'NAM', habacuc: 'HAB', sofonias: 'ZEP', hageo: 'HAG',
  zacarias: 'ZEC', malaquias: 'MAL', mateo: 'MAT', marcos: 'MRK', lucas: 'LUK', juan: 'JHN', hechos: 'ACT', romanos: 'ROM',
  '1 corintios': '1CO', '2 corintios': '2CO', galatas: 'GAL', efesios: 'EPH', filipenses: 'PHP', colosenses: 'COL',
  '1 tesalonicenses': '1TH', '2 tesalonicenses': '2TH', '1 timoteo': '1TI', '2 timoteo': '2TI', tito: 'TIT', filemon: 'PHM',
  hebreos: 'HEB', santiago: 'JAS', '1 pedro': '1PE', '2 pedro': '2PE', '1 juan': '1JN', '2 juan': '2JN', '3 juan': '3JN',
  judas: 'JUD', apocalipsis: 'REV',
};

const norm = (s: string) =>
  s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, ' ').trim();

// "Juan 6:1-15" -> JHN.6.1-JHN.6.15 ; "Juan 6" -> JHN.6 ; "Juan 6:1-7:3" tambien
export function toPassageId(ref: string): string | null {
  const m = norm(ref).match(/^((?:[123] ?)?[a-z ]+?)\s*(\d+)(?::(\d+)(?:\s*-\s*(?:(\d+):)?(\d+))?)?$/);
  if (!m) return null;
  const book = BOOKS[m[1].replace(/^([123]) ?/, '$1 ')];
  if (!book) return null;
  const [, , ch, v1, ch2, v2] = m;
  if (!v1) return `${book}.${ch}`;
  if (!v2) return `${book}.${ch}.${v1}`;
  return `${book}.${ch}.${v1}-${book}.${ch2 || ch}.${v2}`;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const key = process.env.BIBLE_API_KEY;
  if (!key) return res.status(500).json({ error: 'Falta BIBLE_API_KEY en el servidor' });
  const ref = String(req.query.ref || '');
  const version = String(req.query.version || 'rvr60');
  const bibleId = BIBLES[version];
  const passageId = toPassageId(ref);
  if (!bibleId || !passageId) return res.status(400).json({ error: 'Referencia no reconocida' });
  const url =
    `https://api.scripture.api.bible/v1/bibles/${bibleId}/passages/${passageId}` +
    `?content-type=text&include-verse-numbers=true&include-titles=false&include-notes=false`;
  const r = await fetch(url, { headers: { 'api-key': key } });
  if (!r.ok) return res.status(r.status).json({ error: 'No encontrado' });
  const data = await r.json();
  res.setHeader('Cache-Control', 's-maxage=86400, stale-while-revalidate');
  res.json({ text: String(data.data?.content || '').trim(), reference: data.data?.reference, copyright: data.data?.copyright });
}
