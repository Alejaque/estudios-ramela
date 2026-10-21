// Convierte "Juan 6:1-15" al formato USFM de bible.com ("JHN.6.1-15").
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

export function rvr1960Url(ref: string): string | null {
  const m = norm(ref).match(/^((?:[123] ?)?[a-z ]+?)\s*(\d+)(?::(\d+)(?:\s*-\s*(?:(\d+):)?(\d+))?)?$/);
  if (!m) return null;
  const book = BOOKS[m[1].replace(/^([123]) ?/, '$1 ')];
  if (!book) return null;
  const [, , ch, v1, ch2, v2] = m;
  let id = `${book}.${ch}`;
  if (v1) id += `.${v1}`;
  if (v1 && v2 && (!ch2 || ch2 === ch)) id += `-${v2}`;
  return `https://www.bible.com/bible/149/${id}.RVR1960`;
}

// Abreviaturas OSIS que entiende STEP Bible (stepbible.org).
const OSIS: Record<string, string> = {
  GEN:'Gen', EXO:'Exod', LEV:'Lev', NUM:'Num', DEU:'Deut', JOS:'Josh', JDG:'Judg', RUT:'Ruth',
  '1SA':'1Sam', '2SA':'2Sam', '1KI':'1Kgs', '2KI':'2Kgs', '1CH':'1Chr', '2CH':'2Chr',
  EZR:'Ezra', NEH:'Neh', EST:'Esth', JOB:'Job', PSA:'Ps', PRO:'Prov', ECC:'Eccl', SNG:'Song',
  ISA:'Isa', JER:'Jer', LAM:'Lam', EZK:'Ezek', DAN:'Dan', HOS:'Hos', JOL:'Joel', AMO:'Amos',
  OBA:'Obad', JON:'Jonah', MIC:'Mic', NAM:'Nah', HAB:'Hab', ZEP:'Zeph', HAG:'Hag', ZEC:'Zech', MAL:'Mal',
  MAT:'Matt', MRK:'Mark', LUK:'Luke', JHN:'Jhn', ACT:'Acts', ROM:'Rom', '1CO':'1Cor', '2CO':'2Cor',
  GAL:'Gal', EPH:'Eph', PHP:'Phil', COL:'Col', '1TH':'1Thess', '2TH':'2Thess', '1TI':'1Tim', '2TI':'2Tim',
  TIT:'Titus', PHM:'Phlm', HEB:'Heb', JAS:'Jas', '1PE':'1Pet', '2PE':'2Pet', '1JN':'1John', '2JN':'2John',
  '3JN':'3John', JUD:'Jude', REV:'Rev',
};

// Enlace a STEP Bible (texto original, interlineal y léxico gratuito) para el mismo pasaje.
export function stepBibleUrl(ref: string): string | null {
  const m = norm(ref).match(/^((?:[123] ?)?[a-z ]+?)\s*(\d+)(?::(\d+)(?:\s*-\s*(?:(\d+):)?(\d+))?)?$/);
  if (!m) return null;
  const book = BOOKS[m[1].replace(/^([123]) ?/, '$1 ')];
  const osis = book && OSIS[book];
  if (!osis) return null;
  const [, , ch, v1, ch2, v2] = m;
  let id = `${osis}.${ch}`;
  if (v1) id += `.${v1}`;
  if (v1 && v2 && (!ch2 || ch2 === ch)) id += `-${v2}`;
  return `https://www.stepbible.org/?q=reference=${encodeURIComponent(id)}`;
}

// Enlace a Blue Letter Bible (texto RVR60 con léxico/comentarios, interfaz en inglés).
export function blbUrl(ref: string): string | null {
  const m = norm(ref).match(/^((?:[123] ?)?[a-z ]+?)\s*(\d+)(?::(\d+)(?:\s*-\s*(?:(\d+):)?(\d+))?)?$/);
  if (!m) return null;
  const book = BOOKS[m[1].replace(/^([123]) ?/, '$1 ')];
  const osis = book && OSIS[book];
  if (!osis) return null;
  const [, , ch, v1] = m;
  const b = osis.toLowerCase();
  return `https://www.blueletterbible.org/rvr60/${b}/${ch}/${v1 || '1'}/`;
}
