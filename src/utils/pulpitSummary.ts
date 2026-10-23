/**
 * Vista resumida del púlpito y resaltado de ideas principales.
 *
 * Todo el texto que muestra el resumen se extrae PALABRA POR PALABRA del
 * estudio cargado: no se genera contenido nuevo, solo se reorganiza lo que
 * el estudio ya dice (punto principal, puntos I-III con su explicación
 * corta, aplicación práctica, conclusión, llamado y oración).
 */

const ROMANS = ['I', 'II', 'III'] as const;
type Roman = (typeof ROMANS)[number];

export interface SummaryPoint {
  numeral: Roman;
  title: string;
  explanation?: string;
  application?: string;
}

export interface PulpitSummary {
  proposition?: string;
  points: SummaryPoint[];
  conclusion?: string;
  call?: string;
  prayer?: string;
}

const normalize = (text: string): string =>
  text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ')
    .trim();

/**
 * Índice del final de la primera oración (incluye el cierre), o -1.
 * No corta en abreviaturas como "v. 2" o "vv. 5-6": exige que la oración
 * siguiente empiece con mayúscula, apertura de pregunta o comilla.
 */
function firstSentenceEnd(text: string, from = 0): number {
  const re = /[.!?…]+["'»)\]]*?(?=\s+[A-ZÁÉÍÓÚÜÑ¿¡«(])/g;
  re.lastIndex = from;
  const m = re.exec(text);
  return m ? m.index + m[0].length : -1;
}

/**
 * La oración que lleva la idea del párrafo. Si el párrafo arranca con una
 * etiqueta corta ("Explicación.", "Aplicación.", "Transición."), incluye
 * también la primera oración de contenido.
 */
export function keySentence(paragraph: string): string {
  const text = paragraph.trim();
  let end = firstSentenceEnd(text);
  if (end !== -1 && end <= 18) {
    const next = firstSentenceEnd(text, end);
    if (next !== -1) end = next;
  }
  return (end === -1 ? text : text.slice(0, end)).trim();
}

/**
 * Variante para el resumen: si la idea quedó demasiado corta para ser útil
 * al predicar ("Jesús no improvisa."), suma las oraciones siguientes hasta
 * llegar a minChars aprox. (máx. 4 extensiones). Sigue siendo texto literal
 * del estudio, solo más completo.
 */
export function keySentences(paragraph: string, minChars = 140): string {
  const text = paragraph.trim();
  let end = firstSentenceEnd(text);
  if (end === -1) return text;
  if (end <= 18) {
    const next = firstSentenceEnd(text, end);
    if (next !== -1) end = next;
  }
  for (let i = 0; i < 4 && end < minChars; i++) {
    const next = firstSentenceEnd(text, end);
    if (next === -1) break;
    end = next;
  }
  return text.slice(0, end).trim();
}

/** Últimas `count` oraciones del párrafo (para el llamado final). */
function lastSentences(paragraph: string, count: number): string {
  const text = paragraph.trim();
  const re = /[.!?…]+["'»)\]]*?(?=\s+[A-ZÁÉÍÓÚÜÑ¿¡«(])/g;
  const ends: number[] = [];
  let m: RegExpExecArray | null;
  while ((m = re.exec(text))) ends.push(m.index + m[0].length);
  if (ends.length <= count) return text;
  return text.slice(ends[ends.length - count]).trim();
}

interface Section {
  key: string;
  title: string;
  paragraphs: string[];
}

function splitSections(content: string): Section[] {
  const sections: Section[] = [];
  let current: Section = { key: '', title: '', paragraphs: [] };
  let buffer: string[] = [];
  const flush = () => {
    const paragraph = buffer.join(' ').trim();
    if (paragraph) current.paragraphs.push(paragraph);
    buffer = [];
  };
  for (const raw of content.split('\n')) {
    const line = raw.trim();
    const heading = line.match(/^#{1,6}\s+(.+)$/);
    if (heading) {
      flush();
      const title = heading[1].replace(/\*\*/g, '').replace(/[:.]\s*$/, '').trim();
      current = { key: normalize(title), title, paragraphs: [] };
      sections.push(current);
    } else if (!line) {
      flush();
    } else {
      buffer.push(line);
    }
  }
  flush();
  return sections;
}

const stripMd = (text: string): string =>
  text
    .replace(/\*\*/g, '')
    .replace(/^[-*+]\s+/, '')
    .replace(/^\d+[.)]\s+/, '')
    .trim();

/**
 * Arma la vista resumida del estudio: punto principal, puntos I-III con una
 * explicación corta de cada uno, aplicación práctica, conclusión clara,
 * llamado a la acción y oración. Devuelve null si el estudio no tiene una
 * estructura reconocible (en ese caso el púlpito avisa y sigue en completo).
 */
export function buildPulpitSummary(content: string): PulpitSummary | null {
  if (!content) return null;
  const sections = splitSections(content);
  const findSection = (pred: (key: string) => boolean) =>
    sections.find((s) => s.key && pred(s.key));

  const propSec = findSection((k) => k.startsWith('proposicion') || k.includes('gran idea'));
  const conclSec = findSection((k) => k.startsWith('conclusion'));
  const praySec = findSection((k) => k.startsWith('oracion') && !k.includes('transicion'));
  const pointSections = ROMANS.map((numeral) => {
    const re = new RegExp(`^(?:punto\\s+)?${numeral.toLowerCase()}(?![ivx])\\s*[.):\\-–—]`);
    const sec = findSection((k) => re.test(k));
    return sec ? { numeral, sec } : null;
  }).filter((x): x is { numeral: Roman; sec: Section } => x !== null);

  if (!propSec && pointSections.length === 0 && !conclSec) return null;

  const firstPlainParagraph = (sec?: Section) =>
    sec?.paragraphs.find((p) => !p.startsWith('«') && !p.startsWith('"') && !p.startsWith('“'));

  const summary: PulpitSummary = { points: [] };

  const propParagraph = firstPlainParagraph(propSec);
  if (propParagraph) summary.proposition = stripMd(propParagraph).replace(/:\s*$/, '');

  summary.points = pointSections.map(({ numeral, sec }) => {
    const expl =
      sec.paragraphs.find((p) => /^explicaci[óo]n\b/i.test(stripMd(p))) ?? firstPlainParagraph(sec);
    const appl = sec.paragraphs.find((p) => /^aplicaci[óo]n\b/i.test(stripMd(p)));
    return {
      numeral,
      title: sec.title,
      explanation: expl ? keySentences(stripMd(expl), 140) : undefined,
      application: appl ? keySentences(stripMd(appl), 140) : undefined,
    };
  });

  const conclParagraphs = (conclSec?.paragraphs ?? []).filter(
    (p) => !p.startsWith('\u00ab') && !p.startsWith('"') && !p.startsWith('\u201c'),
  );
  if (conclParagraphs.length > 0) {
    // Conclusión: el párrafo más sustancioso de la sección (cuando hay
    // varios, el primero suele ser sólo el puntapié del repaso).
    const longest = conclParagraphs.reduce((a, b) => (b.length > a.length ? b : a));
    summary.conclusion = keySentences(stripMd(longest), 200);
    // Llamado: cierre del último párrafo de la sección, donde queda el
    // llamado cuando la conclusión tiene varios párrafos. Si ese párrafo es
    // corto, se muestra entero para que el llamado quede autocontenido (con
    // la consigna); si es largo, se conservan las 2 oraciones finales.
    const lastConcl = stripMd(conclParagraphs[conclParagraphs.length - 1]);
    summary.call = lastConcl.length <= 400 ? lastConcl : lastSentences(lastConcl, 2);
  }

  if (praySec && praySec.paragraphs.length > 0) {
    summary.prayer = praySec.paragraphs.map(stripMd).join('\n\n');
  }

  return summary;
}

/**
 * Resalta en negrita la idea principal de cada párrafo y los ítems de las
 * listas, sin tocar el texto: agrega marcadores ** al markdown de lectura.
 * Se saltea encabezados, citas bíblicas (párrafos que abren con «) y
 * contenido que ya viene en negrita.
 */
export function highlightKeyIdeas(markdown: string): string {
  return markdown
    .split(/\n{2,}/)
    .map((block) => {
      const t = block.trim();
      if (!t) return block;
      // Encabezados, citas en bloque, código y tablas: ya destacados o no aplican.
      if (/^(#{1,6}\s|>|```|\|)/.test(t)) return block;
      // Listas: negrita al contenido de cada ítem (sin tocar el marcador).
      if (/^(?:[-*+]|\d+[.)])\s/.test(t)) {
        return block
          .split('\n')
          .map((line) => {
            const m = line.match(/^(\s*(?:[-*+]|\d+[.)])\s+)(.+)$/);
            if (!m) return line;
            const item = m[2].trim();
            if (item.startsWith('*') || item.startsWith('_') || item.length > 220) return line;
            return `${m[1]}**${item}**`;
          })
          .join('\n');
      }
      // Citas bíblicas y negritas existentes: no se tocan.
      if (t.startsWith('«') || t.startsWith('"') || t.startsWith('“')) return block;
      if (t.startsWith('**') || t.startsWith('_')) return block;

      let end = firstSentenceEnd(t);
      if (end !== -1 && end <= 18) {
        const next = firstSentenceEnd(t, end);
        if (next !== -1) end = next;
      }
      if (end === -1) {
        if (t.length <= 300 && !t.includes('**')) return `**${t}**`;
        return block;
      }
      const head = t.slice(0, end).trimEnd();
      if (head.includes('**')) return block;
      return `**${head}**${t.slice(end)}`;
    })
    .join('\n\n');
}
