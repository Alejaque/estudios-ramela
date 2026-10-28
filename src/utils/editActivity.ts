// Actividad de escritura en curso (Estudio personal): marca la app como
// ocupada mientras el usuario escribe y por unos segundos después de la
// última tecla, para que una actualización del service worker no recargue
// en medio de la escritura ni le robe el foco/cursor. Se libera sola por
// inactividad o explícitamente al salir de la pantalla.
import { setAppBusySource } from './appBusy';

const SOURCE = 'taller-edicion';
const IDLE_RELEASE_MS = 4000;

let idleTimer: number | null = null;

export function noteEditingActivity(): void {
  setAppBusySource(SOURCE, true);
  if (idleTimer !== null) window.clearTimeout(idleTimer);
  idleTimer = window.setTimeout(() => {
    idleTimer = null;
    setAppBusySource(SOURCE, false);
  }, IDLE_RELEASE_MS);
}

export function endEditingActivity(): void {
  if (idleTimer !== null) {
    window.clearTimeout(idleTimer);
    idleTimer = null;
  }
  setAppBusySource(SOURCE, false);
}
