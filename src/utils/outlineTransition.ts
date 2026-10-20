/**
 * Estructura homilética del Bosquejo Expositivo.
 *
 * Garantiza que, inmediatamente después de la "Proposición (La Gran Idea)",
 * aparezca la "Oración de Transición y Vista Previa" enumerando los tres
 * puntos principales (Punto I, Punto II y Punto III) antes del desarrollo.
 *
 * Los contenidos generados por IA, los estudios curados y los bosquejos
 * guardados por versiones anteriores pueden no traer esa oración: en ese
 * caso se construye a partir de los títulos reales de los puntos I–III
 * detectados en el propio texto, sin inventar títulos nuevos.
 */

export interface MainPoint {
  /** Numeral romano normalizado: "I" | "II" | "III" */
  numeral: 'I' | 'II' | 'III' | 'IV' | 'V' | 'VI' | 'VII' | 'VIII' | 'IX' | 'X';
  /** Etiqueta visible: "Punto I", "Punto II", "Punto III" */
  label: string;
  /** Título del punto, sin el numeral ni negritas. */
  title: string;
}

const ROMAN_ORDER: Array<'I' | 'II' | 'III' | 'IV' | 'V' | 'VI' | 'VII' | 'VIII' | 'IX' | 'X'> = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X'];

function cleanTitle(raw: string): string {
  return raw
    .replace(/\*\*/g, '')
    .replace(/[*_`]/g, '')
    .replace(/\s+/g, ' ')
    .replace(/[:：]\s*$/, '')
    .trim();
}

/**
 * Extrae los títulos de los puntos principales I, II y III del bosquejo.
 * Reconoce los formatos habituales del contenido:
 *   - **I. Título (v. 8):**
 *   - **Punto I: Título**
 *   ### Punto II — Título
 *   1. **Punto III: Título**
 */
export function extractMainPoints(content: string): MainPoint[] {
  if (!content) return [];

  const found = new Map<string, MainPoint>();

  for (const rawLine of content.split('\n')) {
    // Quitamos marcadores de lista/encabezado y negritas para analizar la línea.
    const line = rawLine
      .replace(/^\s*(?:#{1,4}\s*)?(?:[-*+]\s*)?(?:\d+[.)]\s*)?/, '')
      .replace(/\*\*/g, '')
      .trim();

    const match = line.match(/^(?:Punto\s+)?(VIII|VII|VI|IV|IX|III|II|X|V|I)\s*[.):\-–—]\s*(.+)$/i);
    if (!match) continue;

    const numeralRaw = match[1].toUpperCase();
    const numeral = numeralRaw as 'I' | 'II' | 'III' | 'IV' | 'V' | 'VI' | 'VII' | 'VIII' | 'IX' | 'X';

    const title = cleanTitle(match[2]);
    // Descartamos falsos positivos muy cortos o que son sub-puntos (A., B., ...).
    if (title.length < 4) continue;
    // La primera aparición manda (las repeticiones suelen ser citas en el texto).
    if (!found.has(numeral)) {
      found.set(numeral, { numeral, label: `Punto ${numeral}`, title });
    }
  }

  return ROMAN_ORDER.filter((n) => found.has(n)).map((n) => found.get(n)!);
}

/** Construye el bloque Markdown de la Oración de Transición y Vista Previa. */
export function buildTransitionPreview(points: MainPoint[]): string {
  return [
    '- **Oración de Transición y Vista Previa:**',
    '  Este es el recorrido del pasaje. Sigamos su argumento punto por punto:',
    ...points.map((point, index) => `  ${index + 1}. **${point.label}:** ${point.title}`),
  ].join('\n');
}

/**
 * Devuelve el contenido con la Oración de Transición y Vista Previa ubicada
 * inmediatamente después de la Proposición (La Gran Idea) y antes del
 * Desarrollo de Puntos Principales. Si ya existe, o si no se detectan la
 * Proposición y los tres puntos, devuelve el contenido sin cambios.
 */
export function ensureOutlineTransition(content: string): string {
  if (!content) return content;
  if (/oraci[óo]n\s+de\s+transici[óo]n|bosquejo\s+(?:general|anticipado)/i.test(content)) return content;

  const points = extractMainPoints(content);
  if (points.length < 2) return content;

  const propMatch = content.match(/proposici[óo]n\s*\(la gran idea\)/i);
  if (!propMatch || propMatch.index === undefined) return content;
  const afterProp = propMatch.index + propMatch[0].length;

  // El bloque se inserta justo antes del "Desarrollo de Puntos Principales"
  // (o, en su defecto, antes de la línea del Punto I).
  const rest = content.slice(afterProp);
  const candidates: number[] = [];

  const devMatch = rest.match(/\n[ \t]*(?:[-*+]\s*)?(?:\*\*)?\s*Desarrollo\s+de\s+Puntos/i);
  if (devMatch?.index !== undefined) candidates.push(devMatch.index);

  const reflexMatch = rest.match(/\n[ \t]*(?:[-*+]\s*)?(?:\*\*)?\s*Reflexi[óo]n\s+Teol[óo]gica/i);
  if (reflexMatch?.index !== undefined) candidates.push(reflexMatch.index);

  let insertAt: number;
  if (candidates.length > 0) {
    insertAt = afterProp + Math.min(...candidates);
  } else {
    // Sin encabezado de desarrollo: cortar al final del párrafo de la Proposición.
    const paragraphEnd = rest.indexOf('\n\n');
    if (paragraphEnd === -1) return content;
    insertAt = afterProp + paragraphEnd;
  }

  const before = content.slice(0, insertAt).replace(/\s+$/, '');
  const after = content.slice(insertAt).replace(/^\s+/, '');
  return `${before}\n\n${buildTransitionPreview(points)}\n\n${after}`;
}
