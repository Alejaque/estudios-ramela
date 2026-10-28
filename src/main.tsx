import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import {registerSW} from 'virtual:pwa-register';
import {isAppBusy} from './utils/appBusy';

// Mantener la app siempre actualizada sin interrumpir: busca una versión
// nueva del service worker al abrir la app, cada vez que vuelve a primer
// plano y una vez por hora mientras queda abierta. Cuando hay una versión
// nueva (registerType 'prompt' en vite.config.ts), se aplica recargando la
// página SOLO en un momento seguro: nunca con el púlpito abierto, ni
// editando, ni con notas o un pasaje abiertos, ni generando un borrador.
// Si está en uso, reintenta cada 15 segundos hasta que quede libre.
// Los estudios y apuntes guardados viven en localStorage y no se tocan
// con las actualizaciones.
let pendingReload = false;

const updateSW = registerSW({
  immediate: true,
  onRegisteredSW(_swUrl, registration) {
    if (!registration) return;
    const check = () => registration.update();
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') check();
    });
    setInterval(check, 60 * 60 * 1000);
  },
  onNeedRefresh() {
    if (pendingReload) return;
    pendingReload = true;
    const tryApply = () => {
      if (!isAppBusy()) {
        clearInterval(timer);
        updateSW(true);
      }
    };
    const timer = setInterval(tryApply, 15000);
    tryApply();
  },
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
