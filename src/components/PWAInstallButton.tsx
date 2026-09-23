import React, { useState } from 'react';
import { Download, Smartphone } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { AndroidInstallModal } from './AndroidInstallModal';

interface PWAInstallButtonProps {
  variant?: 'header' | 'banner' | 'pill';
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({ variant = 'header' }) => {
  const { isInstallable, isInstalled, install, isAndroid } = usePWAInstall();
  const [isModalOpen, setIsModalOpen] = useState(false);

  // If already installed in standalone mode, do not display prompt
  if (isInstalled) {
    return null;
  }

  const handleAction = async () => {
    if (isInstallable) {
      const accepted = await install();
      if (!accepted) {
        setIsModalOpen(true);
      }
    } else {
      setIsModalOpen(true);
    }
  };

  if (variant === 'banner') {
    return (
      <>
        <div className="bg-gradient-to-r from-amber-600 to-amber-700 text-white px-4 py-2.5 text-xs shadow-sm flex items-center justify-between gap-3 animate-in fade-in slide-in-from-top-2 duration-300">
          <div className="flex items-center gap-2 min-w-0">
            <Smartphone className="w-4 h-4 shrink-0 text-amber-200" />
            <span className="truncate font-medium">
              ¿Usas Android? Instala la app oficial para acceder sin conexión y en pantalla completa.
            </span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handleAction}
              className="bg-white text-amber-900 hover:bg-amber-50 font-bold px-3 py-1 rounded-md text-xs shadow-xs transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Instalar en Android</span>
            </button>
          </div>
        </div>

        <AndroidInstallModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
        />
      </>
    );
  }

  return (
    <>
      <button
        id="btn-install-android-pwa"
        type="button"
        onClick={handleAction}
        title="Descargar e instalar en teléfono Android"
        className="p-2 sm:px-3 sm:py-1.5 rounded-lg text-xs font-semibold bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white shadow-xs flex items-center gap-1.5 transition-all cursor-pointer border border-amber-400/40 active:scale-95"
      >
        <Download className="w-4 h-4 text-white" />
        <span className="hidden sm:inline">Descargar en Android</span>
        <span className="sm:hidden">App</span>
      </button>

      <AndroidInstallModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </>
  );
};
