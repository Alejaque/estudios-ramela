// Marca global de "la app está en uso delicado" (púlpito, edición, notas,
// lectura de pasaje, generación). La usa main.tsx para NO recargar la página
// en medio de una prédica o con trabajo sin guardar cuando llega una
// actualización del service worker.
// Multi-fuente: cada pantalla registra su propia condición y isAppBusy()
// es verdadero mientras CUALQUIER fuente siga activa; así el Estudio
// personal y la biblioteca no se pisan al liberar su estado.
const sources = new Map<string, boolean>();

export function setAppBusySource(source: string, value: boolean): void {
  sources.set(source, value);
}

export function isAppBusy(): boolean {
  for (const v of sources.values()) if (v) return true;
  return false;
}
