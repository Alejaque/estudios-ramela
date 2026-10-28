import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import {isAppBusy} from './utils/appBusy';

// Mantener la app siempre actualizada SIN interrumpir:
// - Busca una versión nueva del service worker al abrir la app, cada vez que
//   vuelve a primer plano y una vez por hora mientras queda abierta.
// - El service worker nuevo se activa solo (skipWaiting/clientsClaim en
//   vite.config.ts) pero eso NO toca la página abierta: sigue mostrando lo
//   que ya cargó.
// - Cuando la página pasa a estar controlada por la versión nueva
//   ('controllerchange'), se recarga SOLO en un momento seguro: nunca con el
//   púlpito abierto, ni editando, ni con notas o un pasaje abiertos, ni
//   generando un borrador. Si está en uso, reintenta cada 15 segundos hasta
//   que quede libre.
// Los estudios y apuntes guardados viven en localStorage y no se tocan con
// las actualizaciones. (Prueba de deferral OK, tercera pasada.)
let pendingReload = false;

function reloadWhenFree() {
  if (pendingReload) return;
  pendingReload = true;
  const timer = setInterval(() => {
    if (!isAppBusy()) {
      clearInterval(timer);
      window.location.reload();
    }
  }, 15000);
  if (!isAppBusy()) {
    clearInterval(timer);
    window.location.reload();
  }
}

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.addEventListener('controllerchange', reloadWhenFree);
  navigator.serviceWorker.register('/sw.js', {scope: '/'}).then((registration) => {
    const check = () => registration.update();
    check();
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') check();
    });
    setInterval(check, 60 * 60 * 1000);
  }).catch(() => {
    // Sin service worker la app sigue funcionando en línea; nada que hacer.
  });
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
