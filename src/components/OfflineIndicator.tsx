import React from 'react';
import { WifiOff } from 'lucide-react';
import { useOnlineStatus } from '../hooks/useOnlineStatus';

export const OfflineIndicator: React.FC = () => {
  const isOnline = useOnlineStatus();

  if (isOnline) return null;

  return (
    <aside
      aria-label="Notificación de conectividad"
      className="fixed bottom-4 left-4 z-50 flex items-center gap-2 rounded-xl bg-amber-600 px-3.5 py-2 text-xs font-medium text-white shadow-xl border border-amber-400/40 animate-bounce"
    >
      <WifiOff className="w-4 h-4 text-amber-100" />
      <span>Modo sin conexión — Puedes seguir consultando tus bosquejos y notas guardadas.</span>
    </aside>
  );
};
