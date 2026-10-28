import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import {registerSW} from 'virtual:pwa-register';

// Mantener la app siempre actualizada (verificado de punta a punta): busca una versión nueva del service
// worker al abrir la app, cada vez que vuelve a primer plano y una vez por
// hora mientras queda abierta. En vite.config.ts el registro es
// 'autoUpdate': cuando hay una versión nueva lista, la página se recarga
// sola y la muestra. Los estudios y apuntes guardados viven en localStorage
// y no se tocan con las actualizaciones.
registerSW({
  immediate: true,
  onRegisteredSW(_swUrl, registration) {
    if (!registration) return;
    const check = () => registration.update();
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') check();
    });
    setInterval(check, 60 * 60 * 1000);
  },
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
