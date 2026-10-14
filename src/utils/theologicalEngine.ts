/**
 * Motor Teológico Exegético e Homilético
 * Proporciona análisis histórico-gramatical y bosquejos expositivos
 * con fidelidad a las Escrituras, lenguas originales (Hebreo/Griego con Strong)
 * y aplicación pastoral contemporánea.
 */

export interface ExegeticalStudy {
  passageOrTopic: string;
  translation: string;
  content: string;
}

interface BibleBookInfo {
  name: string;
  aliases: string[];
  testament: 'AT' | 'NT';
  author: string;
  date: string;
  audience: string;
  theme: string;
  genre: string;
  originalLanguage: 'Hebreo/Arameo' | 'Griego Koiné';
  keyTerms: Array<{
    term: string;
    transliteration: string;
    strong: string;
    meaning: string;
    grammaticalNuance: string;
  }>;
}

export const BIBLE_BOOKS: BibleBookInfo[] = [
  // Antiguo Testamento
  {
    name: 'Génesis',
    aliases: ['gn', 'gen', 'genesis', 'génesis'],
    testament: 'AT',
    author: 'Moisés',
    date: 'c. 1446–1406 a.C.',
    audience: 'El pueblo de Israel en el desierto rumbo a Canaán',
    theme: 'Los orígenes de la creación, la caída y el pacto de redención divina',
    genre: 'Narrativa histórica y teológica del pacto',
    originalLanguage: 'Hebreo/Arameo',
    keyTerms: [
      {
        term: 'בָּרָא',
        transliteration: 'bara',
        strong: 'H1254',
        meaning: 'Crear de la nada (ex nihilo)',
        grammaticalNuance: 'Verbo reservado exclusivamente para la acción creadora soberana de Dios.',
      },
      {
        term: 'בְּרִית',
        transliteration: 'berit',
        strong: 'H1285',
        meaning: 'Pacto, alianza soberana',
        grammaticalNuance: 'Pacto unilateral de gracia jurado por Dios con Abraham y su descendencia.',
      },
    ],
  },
  {
    name: 'Éxodo',
    aliases: ['ex', 'exo', 'exodo', 'éxodo'],
    testament: 'AT',
    author: 'Moisés',
    date: 'c. 1446–1406 a.C.',
    audience: 'Israel liberado de la servidumbre egipcia en el Sinaí',
    theme: 'Redención soberana de la esclavitud y la presencia de Dios en el tabernáculo',
    genre: 'Narrativa histórica de redención y ley del pacto',
    originalLanguage: 'Hebreo/Arameo',
    keyTerms: [
      {
        term: 'יְהוָה',
        transliteration: 'Yahweh',
        strong: 'H3068',
        meaning: 'El que es / Yo Soy el que Soy',
        grammaticalNuance: 'Nombre pactual inmutable que garantiza la fidelidad eterna de Dios.',
      },
      {
        term: 'גָּאַל',
        transliteration: 'gaal',
        strong: 'H1350',
        meaning: 'Redimir, rescatar como pariente redentor',
        grammaticalNuance: 'Acto de rescate por gracia mediante poder redentor y juicio sobre los opresores.',
      },
    ],
  },
  {
    name: 'Salmos',
    aliases: ['sal', 'ps', 'salm', 'salmo', 'salmos'],
    testament: 'AT',
    author: 'David, Asaf, los hijos de Coré, Moisés, Salomón y otros',
    date: 'c. 1000–450 a.C.',
    audience: 'La comunidad de adoración de Israel y los creyentes de todos los tiempos',
    theme: 'La adoración sincera, el consuelo en la aflicción y la soberanía del Rey Mesías',
    genre: 'Poesía lírica hebrea y alabanza cúltica',
    originalLanguage: 'Hebreo/Arameo',
    keyTerms: [
      {
        term: 'חֶסֶד',
        transliteration: 'hesed',
        strong: 'H2617',
        meaning: 'Misericordia pactual, amor leal e inquebrantable',
        grammaticalNuance: 'Compromiso soberano e inmutable de Dios hacia los suyos a pesar de la flaqueza humana.',
      },
      {
        term: 'בָּטַח',
        transliteration: 'batach',
        strong: 'H982',
        meaning: 'Confiar, refugiarse sin reservas',
        grammaticalNuance: 'Recostarse enteramente sobre Dios con certeza y abandono de la propia fuerza.',
      },
      {
        term: 'שָׁלוֹם',
        transliteration: 'shalom',
        strong: 'H7965',
        meaning: 'Paz integral, plenitud, bienestar espiritual',
        grammaticalNuance: 'Armonía y restauración relacional fruto de la justicia de Dios.',
      },
    ],
  },
  {
    name: 'Proverbios',
    aliases: ['pr', 'pro', 'prov', 'proverbios'],
    testament: 'AT',
    author: 'Salomón y sabios de Israel',
    date: 'c. 970–700 a.C.',
    audience: 'Jóvenes, discípulos y líderes del pueblo de Dios',
    theme: 'El temor de Jehová como principio de la sabiduría práctica y moral',
    genre: 'Literatura sapiencial',
    originalLanguage: 'Hebreo/Arameo',
    keyTerms: [
      {
        term: 'חָכְמָה',
        transliteration: 'jokmah',
        strong: 'H2451',
        meaning: 'Sabiduría práctica, pericia para la vida moral',
        grammaticalNuance: 'Habilidad dada por Dios para alinear la conducta diaria con el orden de la creación.',
      },
      {
        term: 'יִרְאָה',
        transliteration: 'yirah',
        strong: 'H3374',
        meaning: 'Temor reverente, asombro sumiso',
        grammaticalNuance: 'Reverencia santa y deleitosa ante la majestad divina que aleja del pecado.',
      },
    ],
  },
  {
    name: 'Isaías',
    aliases: ['is', 'isa', 'isaias', 'isaías'],
    testament: 'AT',
    author: 'Isaías hijo de Amoz',
    date: 'c. 740–680 a.C.',
    audience: 'El reino de Judá frente a las amenazas asiria y babilónica',
    theme: 'La santidad de Dios, el juicio purificador y el Siervo sufriente redentor',
    genre: 'Profecía clásica y poesía mesiánica',
    originalLanguage: 'Hebreo/Arameo',
    keyTerms: [
      {
        term: 'קָדוֹשׁ',
        transliteration: 'qadosh',
        strong: 'H6918',
        meaning: 'Santo, apartado, trascendente',
        grammaticalNuance: 'La pureza moral y majestad infinita de Dios ("El Santo de Israel").',
      },
      {
        term: 'עֶבֶד יְהוָה',
        transliteration: 'Ebed Yahweh',
        strong: 'H5650',
        meaning: 'El Siervo de Jehová',
        grammaticalNuance: 'El Ungido sufriente que carga con las transgresiones de muchos (cap. 53).',
      },
    ],
  },
  {
    name: 'Miqueas',
    aliases: ['miq', 'mic', 'miqueas'],
    testament: 'AT',
    author: 'Miqueas de Moreset',
    date: 'c. 735–700 a.C.',
    audience: 'Judá e Israel en tiempos de corrupción moral y opresión social',
    theme: 'Justicia social, amor por la misericordia y caminar humilde ante Dios',
    genre: 'Profecía oracular y judicial',
    originalLanguage: 'Hebreo/Arameo',
    keyTerms: [
      {
        term: 'מִשְׁפָּט',
        transliteration: 'mishpat',
        strong: 'H4941',
        meaning: 'Justicia vindicadora, rectitud comunitaria',
        grammaticalNuance: 'Trato equitativo y protección de los vulnerables reflejando el carácter de Dios.',
      },
      {
        term: 'צָנַע',
        transliteration: 'tsana',
        strong: 'H6800',
        meaning: 'Caminar con humildad, sobriedad',
        grammaticalNuance: 'Actitud mansa de total sumisión y dependencia del Señor.',
      },
    ],
  },

  // Nuevo Testamento
  {
    name: 'Mateo',
    aliases: ['mt', 'mat', 'mateo'],
    testament: 'NT',
    author: 'Mateo (Leví), apóstol de Jesucristo',
    date: 'c. 60–65 d.C.',
    audience: 'Creyentes de trasfondo judío y la iglesia universal',
    theme: 'Jesús como el Mesías prometido, Rey de reyes y cumplimiento del Antiguo Testamento',
    genre: 'Evangelio narrativo con 5 grandes discursos',
    originalLanguage: 'Griego Koiné',
    keyTerms: [
      {
        term: 'βασιλεία',
        transliteration: 'basileia',
        strong: 'G932',
        meaning: 'Reino, gobierno soberano de Dios',
        grammaticalNuance: 'La presencia y dominio salvífico de Dios inaugurado en la persona de Cristo.',
      },
      {
        term: 'μαθητεύω',
        transliteration: 'matheteuo',
        strong: 'G3100',
        meaning: 'Hacer discípulos, enseñar a seguir',
        grammaticalNuance: 'Imperativo central de la Gran Comisión: formar seguidores comprometidos con Cristo.',
      },
    ],
  },
  {
    name: 'Juan',
    aliases: ['jn', 'jua', 'juan'],
    testament: 'NT',
    author: 'Juan, el discípulo amado',
    date: 'c. 85–90 d.C.',
    audience: 'La iglesia gentil y judía de Asia Menor',
    theme: 'La deidad de Cristo manifestada en señales para que creyendo tengamos vida eterna',
    genre: 'Evangelio teológico y testimonial',
    originalLanguage: 'Griego Koiné',
    keyTerms: [
      {
        term: 'λόγος',
        transliteration: 'logos',
        strong: 'G3056',
        meaning: 'El Verbo, la Palabra eterna encarnada',
        grammaticalNuance: 'Cristo como la revelación suprema, coexistente con el Padre y creadora de todo.',
      },
      {
        term: 'πιστεύω',
        transliteration: 'pisteuo',
        strong: 'G4100',
        meaning: 'Creer, confiar vitalmente, depender',
        grammaticalNuance: 'Usado como verbo activo: no mero asentimiento mental, sino adhesión total a Jesús.',
      },
      {
        term: 'ζωὴ αἰώνιος',
        transliteration: 'zōē aiōnios',
        strong: 'G2222',
        meaning: 'Vida eterna, calidad de vida divina',
        grammaticalNuance: 'Vida divina indestructible presente ahora en comunión con Cristo y perpetua.',
      },
    ],
  },
  {
    name: 'Romanos',
    aliases: ['ro', 'rom', 'romanos'],
    testament: 'NT',
    author: 'El apóstol Pablo desde Corinto',
    date: 'c. 57 d.C.',
    audience: 'La iglesia en Roma (judíos y gentiles)',
    theme: 'El Evangelio del poder de Dios para salvación y la justificación por la fe sola',
    genre: 'Epístola doctrinal y teológica sistemática',
    originalLanguage: 'Griego Koiné',
    keyTerms: [
      {
        term: 'δικαιοσύνη',
        transliteration: 'dikaiosynē',
        strong: 'G1343',
        meaning: 'Justicia de Dios imputada al creyente',
        grammaticalNuance: 'Veredicto forense donde el pecador es declarado justo en virtud de la expiación de Cristo.',
      },
      {
        term: 'χάρις',
        transliteration: 'charis',
        strong: 'G5485',
        meaning: 'Gracia inmerecida, favor soberano',
        grammaticalNuance: 'La bondad generosa de Dios otorgada sin mérito alguno al pecador.',
      },
      {
        term: 'συνεργεῖ',
        transliteration: 'synergei',
        strong: 'G4903',
        meaning: 'Obrar conjuntamente, cooperar providentemente',
        grammaticalNuance: 'En Ro 8:28, Dios orquesta soberanamente todas las cosas para el bien eterno de los suyos.',
      },
    ],
  },
  {
    name: 'Efesios',
    aliases: ['ef', 'efe', 'efesios'],
    testament: 'NT',
    author: 'El apóstol Pablo encarcelado en Roma',
    date: 'c. 60–62 d.C.',
    audience: 'Creyentes de Éfeso y las iglesias de Asia Menor',
    theme: 'El misterio de Cristo: la salvación por gracia y la unidad de la Iglesia como Su cuerpo',
    genre: 'Epístola pastoral y eclesiológica',
    originalLanguage: 'Griego Koiné',
    keyTerms: [
      {
        term: 'χάρις',
        transliteration: 'charis',
        strong: 'G5485',
        meaning: 'Gracia inmerecida',
        grammaticalNuance: 'En Ef 2:8, el instrumento soberano e iniciador del rescate de la muerte espiritual.',
      },
      {
        term: 'ποίημα',
        transliteration: 'poiēma',
        strong: 'G4161',
        meaning: 'Hechura, obra maestra divina',
        grammaticalNuance: 'El creyente es una obra de arte espiritual recreada en Cristo para manifestar buenas obras.',
      },
    ],
  },
  {
    name: 'Filipenses',
    aliases: ['flp', 'fil', 'filipenses'],
    testament: 'NT',
    author: 'El apóstol Pablo en prisión',
    date: 'c. 61–62 d.C.',
    audience: 'La querida iglesia en Filipos de Macedonia',
    theme: 'El gozo inquebrantable en Cristo en medio del sufrimiento y la humildad del siervo',
    genre: 'Epístola pastoral de afecto y comunión',
    originalLanguage: 'Griego Koiné',
    keyTerms: [
      {
        term: 'χαίρετε',
        transliteration: 'chairete',
        strong: 'G5463',
        meaning: '¡Alegraos! ¡Regocijaos!',
        grammaticalNuance: 'Imperativo continuo presente: un gozo no dependiente de circunstancias externas.',
      },
      {
        term: 'εἰρήνη',
        transliteration: 'eirēnē',
        strong: 'G1515',
        meaning: 'Paz de Dios que sobrepasa el entendimiento',
        grammaticalNuance: 'Guarnición militar espiritual (*phroureo*) que custodia la mente y el corazón.',
      },
      {
        term: 'κενόω',
        transliteration: 'kenoo',
        strong: 'G2758',
        meaning: 'Despojarse, vaciarse a sí mismo',
        grammaticalNuance: 'Cristo renunció voluntariamente a sus prerrogativas de gloria tomando forma de siervo.',
      },
    ],
  },
  {
    name: 'Santiago',
    aliases: ['stg', 'san', 'santiago'],
    testament: 'NT',
    author: 'Jacobo (Santiago), siervo de Dios y hermano del Señor',
    date: 'c. 45–48 d.C. (una de las primeras epístolas)',
    audience: 'Las doce tribus dispersas (creyentes judeocristianos)',
    theme: 'La fe viva manifestada en obras, dominio de la lengua y paciencia en la prueba',
    genre: 'Sabiduría epistolar práctica',
    originalLanguage: 'Griego Koiné',
    keyTerms: [
      {
        term: 'ποιηταί',
        transliteration: 'poiētai',
        strong: 'G4163',
        meaning: 'Hacedores activos, ejecutores de la palabra',
        grammaticalNuance: 'No meros oyentes pasivos que se engañan a sí mismos, sino quienes ponen en práctica el texto.',
      },
      {
        term: 'ὑπομονή',
        transliteration: 'hypomonē',
        strong: 'G5281',
        meaning: 'Paciencia tenaz, perseverancia bajo presión',
        grammaticalNuance: 'Capacidad espiritual de permanecer firme sin doblegarse ante la prueba.',
      },
    ],
  },
  {
    name: 'Hebreos',
    aliases: ['heb', 'hebreos'],
    testament: 'NT',
    author: 'Autor apostólico anónimo guiado por el Espíritu',
    date: 'c. 64–68 d.C. (antes de la destrucción del templo)',
    audience: 'Creyentes de trasfondo hebreo tentados a regresar al sacerdocio levítico',
    theme: 'La supremacía absoluta de Cristo como Sumo Sacerdote y mediador de un mejor pacto',
    genre: 'Tratado homilético y epístola de exhortación',
    originalLanguage: 'Griego Koiné',
    keyTerms: [
      {
        term: 'κρείττων',
        transliteration: 'kreittōn',
        strong: 'G2909',
        meaning: 'Mejor, infinitamente superior',
        grammaticalNuance: 'Palabra clave repetida: Cristo ofrece un mejor sacrificio, mejor pacto y mejor esperanza.',
      },
      {
        term: 'πίστις',
        transliteration: 'pistis',
        strong: 'G4102',
        meaning: 'Fe, convicción inamovible',
        grammaticalNuance: 'La certeza de lo que se espera y la convicción viva de lo que no se ve (cap. 11:1).',
      },
    ],
  },
];

/**
 * Encuentra información del libro bíblico a partir del texto ingresado
 */
export function detectBibleBook(text: string): BibleBookInfo | null {
  const normalized = text.toLowerCase().trim();
  for (const book of BIBLE_BOOKS) {
    if (normalized.includes(book.name.toLowerCase())) return book;
    for (const alias of book.aliases) {
      const regex = new RegExp(`\\b${alias}\\b`, 'i');
      if (regex.test(normalized)) return book;
    }
  }
  return null;
}

/**
 * Generador teológico de respaldo instantáneo con rigor exegético y homilético
 */
export function generateTheologicalStudy(
  passageOrTopic: string,
  translation: string = 'Reina-Valera 1960 (RVR1960)'
): string {
  const detectedBook = detectBibleBook(passageOrTopic);
  const cleanTitle = passageOrTopic.trim();

  // Si no se detecta libro específico, tratamos como tema teológico / doctrinal
  if (!detectedBook) {
    return generateDoctrinalStudy(cleanTitle, translation);
  }

  const isOT = detectedBook.testament === 'AT';
  const langName = isOT ? 'Hebreo' : 'Griego';
  const term1 = detectedBook.keyTerms[0] || {
    term: isOT ? 'חֶסֶד' : 'χάρις',
    transliteration: isOT ? 'hesed' : 'charis',
    strong: isOT ? 'H2617' : 'G5485',
    meaning: 'Amor pactual / Gracia soberana',
    grammaticalNuance: 'Fidelidad inmutable y favor incondicional de Dios hacia su pueblo.',
  };
  const term2 = detectedBook.keyTerms[1] || {
    term: isOT ? 'בָּטַח' : 'πίστις',
    transliteration: isOT ? 'batach' : 'pistis',
    strong: isOT ? 'H982' : 'G4102',
    meaning: 'Confianza viva / Fe perseverante',
    grammaticalNuance: 'Dependencia absoluta en las promesas del Señor en medio de la adversidad.',
  };

  return `### 1. 📖 Contexto, Exégesis y Lenguas Originales

- **Contexto Histórico-Literario:** 
  El pasaje de **${cleanTitle}** se enmarca dentro del libro de **${detectedBook.name}**, redactado por **${detectedBook.author}** (${detectedBook.date}). Fue dirigido primariamente a **${detectedBook.audience}**. El género literario es **${detectedBook.genre}**. El propósito teológico central radica en proclamar **${detectedBook.theme.toLowerCase()}**. La comprensión de este trasfondo previene la alegorización indebida y nos sitúa directamente en el fluir del pacto divino.

- **Palabras Clave (${langName} Original):**
  - **${term1.term} (*${term1.transliteration}*) (Strong ${term1.strong}):** ${term1.meaning}. ${term1.grammaticalNuance}
  - **${term2.term} (*${term2.transliteration}*) (Strong ${term2.strong}):** ${term2.meaning}. ${term2.grammaticalNuance}
  - **Estructura Gramatical:** El pasaje presenta un desarrollo lógico enfático donde el sujeto activo soberano es Dios y el creyente es llamado a una respuesta de fe obediente y adoración consagrada.

- **Pasajes Paralelos:**
  - **Romanos 8:28-30:** La providencia soberana de Dios guiando cada circunstancia para el bien eterno de los suyos.
  - **Salmo 119:105:** La suficiencia y claridad de la Palabra como lámpara a nuestros pies y lumbrera a nuestro camino.
  - **2 Timoteo 3:16-17:** Toda la Escritura inspirada por Dios y útil para enseñar, redargüir, corregir e instruir en justicia.

---

### 2. 📝 Bosquejo Expositivo (Sencillo y Profundo)

- **Introducción:** 
  En un mundo saturado de promesas efímeras, opiniones cambiantes y confusión ética, el corazón humano anhela un fundamento inamovible. Así como un ancla marina no se afirma en las olas agitadas sino en el lecho rocoso del fondo marino, **${cleanTitle}** nos invita a fijar nuestra mirada no en las circunstancias temporales, sino en la fidelidad eterna del Dios del pacto.

- **Proposición (La Gran Idea):** 
  *En ${cleanTitle}, Dios revela su suficiencia soberana y su gracia redentora para que su pueblo viva con confianza inquebrantable, fruto de un corazón transformado por la verdad.*

- **Desarrollo de Puntos Principales:**
  - **I. La Revelación del Carácter y la Fidelidad de Dios:**
    - *A. La iniciativa del Señor:* Dios habla primero y establece los términos del pacto por pura misericordia.
    - *B. La seguridad de sus promesas:* Ninguna palabra salida de su boca vuelve vacía; su consejo permanece para siempre.
    - *C. Base textual:* El texto enfatiza que la esperanza no descansa en nuestras fuerzas sino en quién es Él.
  - **II. La Respuesta de Fe y Humildad del Creyente:**
    - *A. El abandono de la autosuficiencia:* Reconocer nuestra pequeñez y necesidad continua de la guía divina.
    - *B. La obediencia del corazón:* La fe verdadera no es un mero asentimiento mental, sino una rendición activa a su señorío.
    - *C. Perseverancia en la prueba:* Mantenerse firmes cuando la realidad visible parece desafiar la promesa divina.
  - **III. El Impacto Transformador en la Vida Cotidiana:**
    - *A. Fruto de santidad:* Una fe auténtica se manifiesta en obras de justicia, misericordia y compasión.
    - *B. El gozo y la paz del pacto:* La tranquilidad que experimenta quien sabe que su vida está en las manos del Creador.
    - *C. Testimonio congregacional:* La iglesia como sal de la tierra y luz en medio de una generación desorientada.

- **Reflexión Teológica:** 
  - *Sobre Dios:* Reafirma su omnipotencia, su santidad majestuosa y su condescendencia compasiva al tratar con seres humanos frágiles.
  - *Sobre el ser humano:* Revela nuestra absoluta dependencia de la gracia. Separados de Él nada podemos hacer; pero en Su comunión hallamos nuestro mayor gozo y realización eterna.

---

### 3. 🌱 Aplicación Práctica Cotidiana

- **En el Carácter y la Vida Devocional:** Dedica tiempo diario a saturar tu mente con la verdad de ${cleanTitle}. Antes de revisar las noticias o las redes sociales, permite que la voz de Dios en las Escrituras calibre tus prioridades y ahuyente el temor.
- **En la Familia y el Matrimonio:** Lleva esta verdad al hogar; que el perdón recibido de Dios sea el mismo perdón que brindas ante los roces cotidianos. La gracia proclamada en el púlpito debe ser vivida en la mesa familiar.
- **En el Ámbito Laboral y Social:** Ejerce tu vocación con integridad irreprochable. Que tus compañeros y clientes vean a una persona cuya palabra es confiable, cuyo trabajo es excelente y cuyo trato refleja la bondad de Cristo.
- **En la Comunidad de Fe:** Sirve a tus hermanos con el corazón del Siervo; no busques protagonismo ni compitas por reconocimiento, sino edifica a los débiles y alienta a quienes atraviesan valles de dolor.

---

### 4. 🎯 Llamado a la Acción (CTA)

- ¿En qué área de tu vida estás intentando gobernar con tus propias fuerzas en lugar de descansar en la verdad de **${cleanTitle}**? Hoy Dios te desafía a soltar el control ilusorio. Toma en este momento un papel o una nota en tu teléfono, anota esa preocupación que te roba el sueño y entrégasela en oración sincera a Cristo, comprometiéndote a dar un paso tangible de obediencia antes de que termine esta semana.`;
}

/**
 * Generador teológico para temas doctrinales y homiléticos
 */
function generateDoctrinalStudy(topic: string, translation: string): string {
  return `### 1. 📖 Contexto, Exégesis y Lenguas Originales

- **Contexto Histórico-Literario:** 
  El estudio temático sobre **"${topic}"** recorre el gran arco redentor de las Escrituras, desde la revelación progresiva del Antiguo Testamento hasta su clímax en la persona y obra de Jesucristo. La teología bíblica nos enseña que ningún tema debe aislarse de la meta narrativa divina: la gloria de Dios manifestada en la salvación de un pueblo para alabanza de la gloria de su gracia.

- **Palabras Clave (Lenguas Originales Hebreo y Griego):**
  - **חֶסֶד (*hesed*) (Strong H2617):** Amor pactual, fidelidad y compasión inmutable de Dios. Fundamento veterotestamentario indispensable para comprender la comunión con el Creador.
  - **χάρις (*charis*) (Strong G5485):** Gracia soberana e inmerecida otorgada mediante la cruz de Cristo.
  - **ἀλήθεια (*alētheia*) (Strong G225):** Verdad objetiva, fidelidad revelada en contraste con las ilusiones del mundo caído.

- **Pasajes Paralelos Clave:**
  - **Juan 17:17:** "Santifícalos en tu verdad; tu palabra es verdad."
  - **Efesios 4:15:** Siguiendo la verdad en amor, para crecer en todo en aquel que es la cabeza, esto es, Cristo.
  - **Hebreos 4:12:** La Palabra de Dios viva y eficaz, más cortante que toda espada de dos filos.

---

### 2. 📝 Bosquejo Expositivo (Sencillo y Profundo)

- **Introducción:** 
  Vivimos en una cultura de opiniones cambiantes donde las certezas morales se diluyen. Abordar con rigor bíblico el tema de **"${topic}"** no es un mero ejercicio académico; es una necesidad vital para cimentar la fe de la iglesia local sobre la roca inconmovible de las Sagradas Escrituras.

- **Proposición (La Gran Idea):** 
  *La comprensión bíblica de "${topic}" transforma nuestra mente, alinea nuestros afectos con el corazón de Dios y nos impulsa a una vida de obediencia ferviente para Su gloria.*

- **Desarrollo de Puntos Principales:**
  - **I. El Fundamento Bíblico y la Revelación Divina:**
    - *A. El origen en la mente de Dios:* Cómo las Escrituras introducen y sostienen esta verdad fundamental.
    - *B. La centralidad de Cristo:* De qué manera el Evangelio es el filtro y la plenitud de este tema doctrinal.
    - *C. La iluminación del Espíritu Santo:* Guiando a la iglesia a toda la verdad mediante la Palabra.
  - **II. Las Distorsiones Comunes y la Corrección Pastoral:**
    - *A. El peligro del legalismo o moralismo:* Convertir una doctrina de gracia en una carga de desempeño humano.
    - *B. El peligro del relativismo:* Suavizar la verdad bíblica para agradar las tendencias contemporáneas.
    - *C. El equilibrio apostólico:* Sostener la verdad con firmeza doctrinal y profunda ternura pastoral.
  - **III. El Fruto Visible en la Comunidad de Fe:**
    - *A. Adoración genuina:* El conocimiento teológico que no culmina en doxología es vano; conocer a Dios produce alabanza.
    - *B. Consagración y santidad:* Un amor ardiente por los mandamientos del Señor en la vida cotidiana.
    - *C. Misión y evangelismo:* La urgencia de proclamar esta verdad redentora a un mundo que perece.

- **Reflexión Teológica:** 
  - *Sobre Dios:* Exalta Su santidad, sabiduría insondable y fidelidad incondicional hacia los suyos.
  - *Sobre el ser humano:* Expone nuestra vulnerabilidad y nos recuerda que nuestra única suficiencia proviene de Dios.

---

### 3. 🌱 Aplicación Práctica Cotidiana

- **En el Corazón y los Pensamientos:** Examina tus convicciones a la luz de "${topic}". Pídele al Espíritu Santo que exponga cualquier pensamiento que no se someta a la obediencia a Cristo.
- **En la Vida Familiar:** Dialoga sobre este principio con tu familia y tus hijos de manera accesible y amorosa, modelándolo con un ejemplo coherente.
- **En la Vocación y el Trabajo:** Que esta verdad bíblica dicte tu ética profesional, tu integridad ante las tentaciones y tu amor por el prójimo.
- **En el Discipulado Eclesial:** Comparte lo aprendido con un hermano más joven en la fe, fortaleciendo los lazos de comunión y edificación mutua.

---

### 4. 🎯 Llamado a la Acción (CTA)

- ¿Estás dispuesto hoy a rendir tus opiniones personales y abrazar la verdad bíblica de **"${topic}"** con gozo y sumisión? Durante las próximas 48 horas, identifica una decisión concreta que debas tomar a la luz de este estudio, y da ese paso de fe con la certeza de que Dios respalda a quienes honran Su Palabra.`;
}

/**
 * Biblioteca de versículos bíblicos clave para lectura instantánea sin conexión
 */
export const SCRIPTURE_TEXTS: Record<string, { rvr60: string; nvi: string }> = {
  'efesios 2:8-10': {
    rvr60:
      'Porque por gracia sois salvos por medio de la fe; y esto no de vosotros, pues es don de Dios; no por obras, para que nadie se gloríe. Porque somos hechura suya, creados en Cristo Jesús para buenas obras, las cuales Dios preparó de antemano para que anduviésemos en ellas.',
    nvi:
      'Porque por gracia ustedes han sido salvados mediante la fe; esto no procede de ustedes, sino que es el regalo de Dios, no por obras, para que nadie se jacte. Porque somos hechura de Dios, creados en Cristo Jesús para buenas obras, las cuales Dios dispuso de antemano a fin de que las pongamos en práctica.',
  },
  'romanos 8:28-30': {
    rvr60:
      'Y sabemos que a los que aman a Dios, todas las cosas les ayudan a bien, esto es, a los que conforme a su propósito son llamados. Porque a los que antes conoció, también los predestinó para que fuesen hechos conformes a la imagen de su Hijo, para que él sea el primogénito entre muchos hermanos. Y a los que predestinó, a éstos también llamó; y a los que llamó, a éstos también justificó; y a los que justificó, a éstos también glorificó.',
    nvi:
      'Ahora bien, sabemos que Dios dispone todas las cosas para el bien de quienes lo aman, los que han sido llamados de acuerdo con su propósito. Porque a los que Dios conoció de antemano, también los predestinó a ser transformados según la imagen de su Hijo, para que él sea el primogénito entre muchos hermanos. A los que predestinó, también los llamó; a los que llamó, también los justificó; y a los que justificó, también los glorificó.',
  },
  'romanos 12:1-2': {
    rvr60:
      'Así que, hermanos, os ruego por las misericordias de Dios, que presentéis vuestros cuerpos en sacrificio vivo, santo, agradable a Dios, que es vuestro culto racional. No os conforméis a este siglo, sino transformaos por medio de la renovación de vuestro entendimiento, para que comprobéis cuál sea la buena voluntad de Dios, agradable y perfecta.',
    nvi:
      'Por lo tanto, hermanos, tomando en cuenta la misericordia de Dios, les ruego que cada uno de ustedes, en adoración espiritual, ofrezca su cuerpo como sacrificio vivo, santo y agradable a Dios. No se amolden al mundo actual, sino sean transformados mediante la renovación de su mente. Así podrán comprobar cuál es la voluntad de Dios, buena, agradable y perfecta.',
  },
  'salmo 23:1-4': {
    rvr60:
      'Jehová es mi pastor; nada me faltará. En lugares de delicados pastos me hará descansar; junto a aguas de reposo me pastoreará. Confortará mi alma; me guiará por sendas de justicia por amor de su nombre. Aunque ande en valle de sombra de muerte, no temeré mal alguno, porque tú estarás conmigo; tu vara y tu cayado me infundirán aliento.',
    nvi:
      'El Señor es mi pastor, nada me falta; en verdes pastos me hace descansar. Junto a tranquilas aguas me conduce; me infunde nuevas fuerzas. Me guía por sendas de justicia por amor a su nombre. Aun si voy por valles tenebrosos, no temo peligro alguno porque tú estás a mi lado; tu vara de pastor me reconforta.',
  },
  'salmo 23': {
    rvr60:
      'Jehová es mi pastor; nada me faltará. En lugares de delicados pastos me hará descansar; junto a aguas de reposo me pastoreará. Confortará mi alma; me guiará por sendas de justicia por amor de su nombre. Aunque ande en valle de sombra de muerte, no temeré mal alguno, porque tú estarás conmigo; tu vara y tu cayado me infundirán aliento. Aderezas mesa delante de mí en presencia de mis angustiadores; unges mi cabeza con aceite; mi copa está rebosando. Ciertamente el bien y la misericordia me seguirán todos los días de mi vida, y en la casa de Jehová moraré por largos días.',
    nvi:
      'El Señor es mi pastor, nada me falta; en verdes pastos me hace descansar. Junto a tranquilas aguas me conduce; me infunde nuevas fuerzas. Me guía por sendas de justicia por amor a su nombre. Aun si voy por valles tenebrosos, no temo peligro alguno porque tú estás a mi lado; tu vara de pastor me reconforta. Dispones ante mí un banquete en presencia de mis enemigos. Has ungido con perfume mi cabeza; has llenado mi copa hasta el borde. La bondad y el amor me seguirán todos los días de mi vida; y en la casa del Señor habitaré para siempre.',
  },
  'filipenses 4:6-7': {
    rvr60:
      'Por nada estéis afanosos, sino sean conocidas vuestras peticiones delante de Dios en toda oración y ruego, con acción de gracias. Y la paz de Dios, que sobrepasa todo entendimiento, guardará vuestros corazones y vuestros pensamientos en Cristo Jesús.',
    nvi:
      'No se inquieten por nada; más bien, en toda ocasión, con oración y ruego, presenten sus peticiones a Dios y denle gracias. Y la paz de Dios, que sobrepasa todo entendimiento, cuidará sus corazones y sus pensamientos en Cristo Jesús.',
  },
  'miqueas 6:8': {
    rvr60:
      'Oh hombre, él te ha declarado lo que es bueno, y qué pide Jehová de ti: solamente hacer justicia, y amar misericordia, y humillarte ante tu Dios.',
    nvi:
      '¡Ya se te ha declarado lo que es bueno! Ya se te ha dicho lo que de ti espera el Señor: Practicar la justicia, amar la misericordia, y humillarte ante tu Dios.',
  },
  'santiago 1:22-25': {
    rvr60:
      'Pero sed hacedores de la palabra, y no tan solamente oidores, engañándoos a vosotros mismos. Porque si alguno es oidor de la palabra pero no hacedor de ella, éste es semejante al hombre que considera en un espejo su rostro natural. Porque él se considera a sí mismo, y se va, y luego olvida cómo era. Mas el que mira atentamente en la perfecta ley, la de la libertad, y persevera en ella, no siendo oidor olvidadizo, sino hacedor de la obra, éste será bienaventurado en lo que hace.',
    nvi:
      'No se contenten solo con escuchar la palabra, pues así se engañan ustedes mismos. Llévenla a la práctica. El que escucha la palabra, pero no la pone en práctica, es como el que se mira el rostro en un espejo y, después de mirarse, se va y se olvida en seguida de cómo es. Pero quien se fija atentamente en la ley perfecta que da libertad, y persevera en ella, no olvidando lo que ha oído, sino haciéndolo, este será dichoso en lo que hace.',
  },
  'juan 3:16': {
    rvr60:
      'Porque de tal manera amó Dios al mundo, que ha dado a su Hijo unigénito, para que todo aquel que en él cree, no se pierda, mas tenga vida eterna.',
    nvi:
      'Porque tanto amó Dios al mundo que dio a su Hijo unigénito, para que todo el que cree en él no se pierda, sino que tenga vida eterna.',
  },
  'juan 1:1-5': {
    rvr60:
      'En el principio era el Verbo, y el Verbo era con Dios, y el Verbo era Dios. Este era en el principio con Dios. Todas las cosas por él fueron hechas, y sin él nada de lo que ha sido hecho, fue hecho. En él estaba la vida, y la vida era la luz de los hombres. La luz en las tinieblas resplandece, y las tinieblas no prevalecieron contra ella.',
    nvi:
      'En el principio ya existía el Verbo, y el Verbo estaba con Dios, y el Verbo era Dios. Él estaba con Dios en el principio. Por medio de él todas las cosas fueron creadas; sin él, nada de lo creado llegó a existir. En él estaba la vida, y la vida era la luz de la humanidad. Esta luz resplandece en las tinieblas, y las tinieblas no han podido extinguirla.',
  },
  'mateo 28:18-20': {
    rvr60:
      'Y Jesús se acercó y les habló diciendo: Toda potestad me es dada en el cielo y en la tierra. Por tanto, id, y haced discípulos a todas las naciones, bautizándolos en el nombre del Padre, y del Hijo, y del Espíritu Santo; enseñándoles que guarden todas las cosas que os he mandado; y he aquí yo estoy con vosotros todos los días, hasta el fin del mundo. Amén.',
    nvi:
      'Jesús se acercó entonces a ellos y les dijo: Se me ha dado toda autoridad en el cielo y en la tierra. Por tanto, vayan y hagan discípulos de todas las naciones, bautizándolos en el nombre del Padre y del Hijo y del Espíritu Santo, enseñándoles a obedecer todo lo que les he mandado a ustedes. Y les aseguro que estaré con ustedes siempre, hasta el fin del mundo.',
  },
};
