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

// Slugs verificados de BibliaTodo para el comentario de Matthew Henry en espanol (RVR1960).
const BIBLIATODO: Record<string, string> = {
  GEN:'genesis', EXO:'exodo', LEV:'levitico', NUM:'numeros', DEU:'deuteronomio', JOS:'josue', JDG:'jueces', RUT:'rut',
  '1SA':'1samuel', '2SA':'2samuel', '1KI':'1reyes', '2KI':'2reyes', '1CH':'1cronicas', '2CH':'2cronicas',
  EZR:'esdras', NEH:'nehemias', EST:'ester', JOB:'job', PSA:'salmos', PRO:'proverbios', ECC:'eclesiastes', SNG:'cantares',
  ISA:'isaias', JER:'jeremias', LAM:'lamentaciones', EZK:'ezequiel', DAN:'daniel', HOS:'oseas', JOL:'joel', AMO:'amos',
  OBA:'abdias', JON:'jonas', MIC:'miqueas', NAM:'nahum', HAB:'habacuc', ZEP:'sofonias', HAG:'hageo', ZEC:'zacarias', MAL:'malaquias',
  MAT:'mateo', MRK:'marcos', LUK:'lucas', JHN:'juan', ACT:'hechos', ROM:'romanos', '1CO':'1corintios', '2CO':'2corintios',
  GAL:'galatas', EPH:'efesios', PHP:'filipenses', COL:'colosenses', '1TH':'1tesalonicenses', '2TH':'2tesalonicenses',
  '1TI':'1timoteo', '2TI':'2timoteo', TIT:'tito', PHM:'filemon', HEB:'hebreos', JAS:'santiago',
  '1PE':'1pedro', '2PE':'2pedro', '1JN':'1juan', '2JN':'2juan', '3JN':'3juan', JUD:'judas', REV:'apocalipsis',
};

// Slugs verificados de Blue Letter Bible para las introducciones de John MacArthur (en ingles), por libro.
const BLB_INTRO: Record<string, string> = {
  GEN:'genesis', EXO:'exodus', LEV:'leviticus', NUM:'numbers', DEU:'deuteronomy', JOS:'joshua', JDG:'judges', RUT:'ruth',
  '1SA':'1samuel', '2SA':'2samuel', '1KI':'1kings', '2KI':'2kings', '1CH':'1chronicles', '2CH':'2chronicles',
  EZR:'ezra', NEH:'nehemiah', EST:'esther', JOB:'job', PSA:'psalms', PRO:'proverbs', ECC:'ecclesiastes', SNG:'songofsongs',
  ISA:'isaiah', JER:'jeremiah', LAM:'lamentations', EZK:'ezekiel', DAN:'daniel', HOS:'hosea', JOL:'joel', AMO:'amos',
  OBA:'obadiah', JON:'jonah', MIC:'micah', NAM:'nahum', HAB:'habakkuk', ZEP:'zephaniah', HAG:'haggai', ZEC:'zechariah', MAL:'malachi',
  MAT:'matthew', MRK:'mark', LUK:'luke', JHN:'john', ACT:'acts', ROM:'romans', '1CO':'1corinthians', '2CO':'2corinthians',
  GAL:'galatians', EPH:'ephesians', PHP:'philippians', COL:'colossians', '1TH':'1thessalonians', '2TH':'2thessalonians',
  '1TI':'1timothy', '2TI':'2timothy', TIT:'titus', PHM:'philemon', HEB:'hebrews', JAS:'james',
  '1PE':'1peter', '2PE':'2peter', '1JN':'1john', '2JN':'2john', '3JN':'3john', JUD:'jude', REV:'revelation',
};

// Comentario de Matthew Henry en espanol (BibliaTodo, basado en RVR1960), por capitulo.
export function matthewHenryUrl(ref: string): string | null {
  const m = norm(ref).match(/^((?:[123] ?)?[a-z ]+?)\s*(\d+)(?::(\d+)(?:\s*-\s*(?:(\d+):)?(\d+))?)?$/);
  if (!m) return null;
  const book = BOOKS[m[1].replace(/^([123]) ?/, '$1 ')];
  const slug = book && BIBLIATODO[book];
  if (!slug) return null;
  return `https://www.bibliatodo.com/comentario-biblico/?v=RV1960&co=matthew-henry&l=${slug}&cap=${m[2]}`;
}

// Introduccion del libro por John MacArthur (Blue Letter Bible, en ingles): autor, fecha,
// trasfondo, temas historico-teologicos y bosquejo del libro.
export function macarthurIntroUrl(ref: string): string | null {
  const m = norm(ref).match(/^((?:[123] ?)?[a-z ]+?)\s*(\d+)(?::(\d+)(?:\s*-\s*(?:(\d+):)?(\d+))?)?$/);
  if (!m) return null;
  const book = BOOKS[m[1].replace(/^([123]) ?/, '$1 ')];
  const slug = book && BLB_INTRO[book];
  if (!slug) return null;
  return `https://www.blueletterbible.org/Comm/macarthur_john/bible-introductions/${slug}-intro.cfm`;
}

// Atlas biblico interactivo en espanol (mapas, cronologias y genealogias; busqueda por lugar).
export const BIBLE_ATLAS_URL = 'https://bible-atlas.com/es';

// Contexto historico-cultural y mapas (Bible History, en ingles).
export const BIBLE_HISTORY_URL = 'https://bible-history.com/biblemaps';

// Diccionario biblico en espanol (BibliaTodo): terminos, personas, lugares y costumbres.
export const DICCIONARIO_URL = 'https://www.bibliatodo.com/Diccionario-biblico';

// Slugs verificados de BibleHub para referencias cruzadas (en ingles), por versiculo inicial.
const BIBLEHUB: Record<string, string> = {
  GEN:'genesis', EXO:'exodus', LEV:'leviticus', NUM:'numbers', DEU:'deuteronomy', JOS:'joshua', JDG:'judges', RUT:'ruth',
  '1SA':'1_samuel', '2SA':'2_samuel', '1KI':'1_kings', '2KI':'2_kings', '1CH':'1_chronicles', '2CH':'2_chronicles',
  EZR:'ezra', NEH:'nehemiah', EST:'esther', JOB:'job', PSA:'psalms', PRO:'proverbs', ECC:'ecclesiastes', SNG:'songs',
  ISA:'isaiah', JER:'jeremiah', LAM:'lamentations', EZK:'ezekiel', DAN:'daniel', HOS:'hosea', JOL:'joel', AMO:'amos',
  OBA:'obadiah', JON:'jonah', MIC:'micah', NAM:'nahum', HAB:'habakkuk', ZEP:'zephaniah', HAG:'haggai', ZEC:'zechariah', MAL:'malachi',
  MAT:'matthew', MRK:'mark', LUK:'luke', JHN:'john', ACT:'acts', ROM:'romans', '1CO':'1_corinthians', '2CO':'2_corinthians',
  GAL:'galatians', EPH:'ephesians', PHP:'philippians', COL:'colossians', '1TH':'1_thessalonians', '2TH':'2_thessalonians',
  '1TI':'1_timothy', '2TI':'2_timothy', TIT:'titus', PHM:'philemon', HEB:'hebrews', JAS:'james',
  '1PE':'1_peter', '2PE':'2_peter', '1JN':'1_john', '2JN':'2_john', '3JN':'3_john', JUD:'jude', REV:'revelation',
};

// Referencias cruzadas del pasaje (BibleHub, en ingles): versiculos relacionados tematicamente.
export function crossRefsUrl(ref: string): string | null {
  const m = norm(ref).match(/^((?:[123] ?)?[a-z ]+?)\s*(\d+)(?::(\d+)(?:\s*-\s*(?:(\d+):)?(\d+))?)?$/);
  if (!m) return null;
  const book = BOOKS[m[1].replace(/^([123]) ?/, '$1 ')];
  const slug = book && BIBLEHUB[book];
  if (!slug) return null;
  return `https://biblehub.com/crossref/${slug}/${m[2]}-${m[3] || '1'}.htm`;
}
