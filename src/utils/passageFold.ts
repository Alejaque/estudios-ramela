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
