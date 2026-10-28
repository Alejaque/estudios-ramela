// Marca global de "la app está en uso delicado" (púlpito, edición, notas,
// lectura de pasaje, generación). La usa main.tsx para NO recargar la página
// en medio de una prédica o con trabajo sin guardar cuando llega una
// actualización del service worker.
let busy = false;

export function setAppBusy(value: boolean): void {
  busy = value;
}

export function isAppBusy(): boolean {
  return busy;
}
