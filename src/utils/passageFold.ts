/**
 * Pasaje plegado: para estudios que traen `passageText`, el texto bíblico
 * no ocupa pantalla dentro del apunte; se abre al tocar "Pasaje".
 *
 * `splitForPassage` parte el contenido donde empieza el desarrollo
 * (el encabezado del Punto I) para renderizar el plegado entre la
 * proposición y los puntos. `contentWithPassage` lo reinserta en ese
 * mismo lugar (exportación a PDF, donde todo va en un solo documento).
 */
export function splitForPassage(content: string): [string, string] {
  const m = /\n(?=##\s+I[.)\s])/.exec(content);
  if (!m) return [content, ''];
  return [content.slice(0, m.index), content.slice(m.index + 1)];
}

export function contentWithPassage(content: string, passageText?: string): string {
  if (!passageText) return content;
  const [before, after] = splitForPassage(content);
  return after
    ? `${before}\n\n${passageText}\n\n${after}`
    : `${content}\n\n${passageText}`;
}

const norm = (s: string) => s.toLowerCase().replace(/[^\p{L}\p{N}]+/gu, '');

/**
 * Solo para mostrar: versiones viejas de un estudio (por ejemplo una edicion
 * guardada en el dispositivo) traian el texto biblico como primera seccion
 * "## Texto (...)". Hoy el pasaje vive en el bloque Pasaje, despues de la
 * proposicion; si ademas la seccion inicial repite ese mismo texto, se oculta
 * al mostrar. No modifica ni borra nada guardado: el contenido original queda
 * intacto en el estudio y en la edicion del dispositivo.
 */
export function hideLegacyPassageSection(content: string, passageText?: string, studyId?: string): string {
  let out = content;
  // Solo 2 Co 5:16-21 (pedido de Ale); el resto de los estudios no cambia.
  if (studyId !== '2co-5-17-21-breve-20261106') return out;
  if (passageText) {
    const m = /^(\s*)## Texto[^\n]*\n([\s\S]*?)(?=\n## |$)/.exec(out);
    if (m) {
      const body = norm(m[2]);
      const probe = norm(passageText).slice(0, 40);
      if (probe.length >= 20 && body.includes(probe)) {
        const ant = /\*?Antecedente inmediato[^\n]*/.exec(m[2]);
        let rest = out.slice(m[0].length).replace(/^\s+/, '');
        // El antecedente se conserva: pasa al final de la Introduccion.
        if (ant && !rest.includes('Antecedente inmediato')) {
          const at = rest.search(/\n## (?!Introducci)/);
          const intro = /(^|\n)## Introducci/.test(rest);
          if (intro && at !== -1) rest = rest.slice(0, at).replace(/\s+$/, '') + '\n\n' + ant[0].trim() + '\n' + rest.slice(at);
          else rest = ant[0].trim() + '\n\n' + rest;
        }
        out = rest;
      }
    }
  }
  // Pedido de Ale (2 Co 5:16-21): sin la nota "Como usar este apunte" al mostrar.
  if (studyId === '2co-5-17-21-breve-20261106') {
    out = out.replace(/^[ \t]*\*Cómo usar este apunte:[^\n]*\n+/m, '');
  }
  return out;
}
