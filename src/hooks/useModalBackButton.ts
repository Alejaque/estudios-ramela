import { useEffect } from 'react';

/**
 * Intercepta el botón / gesto "Atrás" del celular (evento `popstate`)
 * mientras un modal está abierto.
 *
 * Al abrirse, el modal agrega una entrada al historial del navegador.
 * Si el usuario presiona "Atrás", en vez de salirse de la app / PWA, el
 * navegador consume esa entrada y nosotros simplemente cerramos el modal,
 * volviendo al modo estudio (o al modal que estaba debajo).
 *
 * Soporta modales anidados (p. ej. el lector de versículos dentro del
 * púlpito): cada modal apila su propia entrada y "Atrás" cierra primero
 * el que está arriba de todo.
 */

interface ModalHistoryEntry {
  onClose: () => void;
  /** true si el cierre lo provocó el propio `popstate` (no hay que tocar el historial). */
  closedByBack: boolean;
}

const stack: ModalHistoryEntry[] = [];
let listenerInstalled = false;
/** true cuando el `history.back()` lo disparamos nosotros al cerrar con un botón. */
let suppressNextPop = false;

function ensurePopstateListener() {
  if (listenerInstalled || typeof window === 'undefined') return;
  listenerInstalled = true;

  window.addEventListener('popstate', () => {
    if (suppressNextPop) {
      suppressNextPop = false;
      return;
    }
    // Cierra el modal superior; su cleanup verá `closedByBack` y no
    // volverá a tocar el historial (la entrada ya fue consumida).
    const top = stack.pop();
    if (top) {
      top.closedByBack = true;
      top.onClose();
    }
  });
}

/**
 * @param isOpen  Si el modal está visible.
 * @param onClose Cierre del modal (debe llevar al modo estudio / vista anterior).
 */
export function useModalBackButton(isOpen: boolean, onClose: () => void) {
  useEffect(() => {
    if (!isOpen || typeof window === 'undefined') return;

    ensurePopstateListener();

    const entry: ModalHistoryEntry = { onClose, closedByBack: false };
    stack.push(entry);
    window.history.pushState(
      { ...(window.history.state ?? {}), arenaModalDepth: stack.length },
      '',
      window.location.href
    );

    return () => {
      const idx = stack.indexOf(entry);
      if (idx !== -1) stack.splice(idx, 1);

      // Cierre con botón/X (no con "Atrás"): retiramos nuestra entrada del
      // historial sin que eso cierre el modal que quedó debajo.
      if (!entry.closedByBack && idx === stack.length) {
        suppressNextPop = true;
        window.history.back();
        // Si por algún motivo el popstate no llega, no dejar el flag trabado.
        window.setTimeout(() => {
          suppressNextPop = false;
        }, 350);
      }
    };
    // `onClose` suele ser una closure inline: solo (des)registramos por apertura.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);
}
