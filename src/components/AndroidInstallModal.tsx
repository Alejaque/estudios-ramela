import React, { useState } from 'react';
import { Download, Smartphone, Check, Copy, ExternalLink, X, Sparkles } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

interface AndroidInstallModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AndroidInstallModal: React.FC<AndroidInstallModalProps> = ({ isOpen, onClose }) => {
  const { isInstallable, install, isInstalled } = usePWAInstall();
  const [copied, setCopied] = useState(false);
  const [installing, setInstalling] = useState(false);

  if (!isOpen) return null;

  const currentUrl = typeof window !== 'undefined' ? window.location.href : '';

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(currentUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // fallback
    }
  };

  const handleNativeInstall = async () => {
    setInstalling(true);
    const success = await install();
    setInstalling(false);
    if (success) {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        className="relative w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]"
        role="dialog"
        aria-modal="true"
      >
        {/* Header with App Brand */}
        <div className="bg-gradient-to-r from-slate-900 via-slate-850 to-slate-900 text-white p-5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-amber-500/20 border border-amber-400/40 p-1.5 flex items-center justify-center shrink-0">
              <img 
                src="/icon.svg" 
                alt="App Icon" 
                className="w-full h-full object-contain"
              />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold tracking-tight text-white font-theology-display">
                  Instalar en Android
                </h3>
                <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                  PWA Nativa
                </span>
              </div>
              <p className="text-xs text-slate-300">
                Estudios Bíblicos Alejandro Ramela
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            aria-label="Cerrar modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-5 text-slate-700 dark:text-slate-300 text-sm">
          
          {/* Status banner */}
          {isInstalled ? (
            <div className="flex items-center gap-3 p-3.5 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl text-emerald-800 dark:text-emerald-300 text-xs font-medium">
              <Check className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <span>¡La aplicación ya está instalada en este dispositivo y lista para usarse como app nativa!</span>
            </div>
          ) : isInstallable ? (
            <div className="p-4 bg-amber-500/10 dark:bg-amber-950/30 border border-amber-500/30 rounded-xl space-y-3">
              <div className="flex items-start gap-3">
                <Sparkles className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-amber-800 dark:text-amber-300">
                    Instalación Rápida con 1 Clic
                  </h4>
                  <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5">
                    Tu navegador soporta la descarga directa de la aplicación en tu pantalla de inicio como una app de Android.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleNativeInstall}
                disabled={installing}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-amber-600 hover:bg-amber-700 active:scale-[0.99] text-white font-semibold shadow-md transition-all cursor-pointer"
              >
                <Download className="w-5 h-5" />
                <span>{installing ? 'Descargando...' : 'Descargar e Instalar en Android Ahora'}</span>
              </button>
            </div>
          ) : null}

          {/* Step-by-step instructions for Android */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-slate-100 mb-3 flex items-center gap-1.5">
              <Smartphone className="w-4 h-4 text-amber-500" />
              Pasos para instalar en tu teléfono Android (Chrome / Navegador)
            </h4>

            <div className="space-y-2.5">
              <div className="flex items-start gap-3 p-3 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 rounded-xl">
                <div className="w-6 h-6 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                  1
                </div>
                <div>
                  <p className="font-semibold text-slate-900 dark:text-slate-100 text-xs">
                    Abre el enlace en Google Chrome
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Abre esta página en el navegador <strong>Google Chrome</strong> o <strong>Samsung Internet</strong> de tu teléfono Android.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 rounded-xl">
                <div className="w-6 h-6 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                  2
                </div>
                <div>
                  <p className="font-semibold text-slate-900 dark:text-slate-100 text-xs">
                    Toca el menú de 3 puntos (⋮)
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    En la esquina superior derecha del navegador Chrome, pulsa el botón de opciones (tres puntos verticales).
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 rounded-xl">
                <div className="w-6 h-6 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                  3
                </div>
                <div>
                  <p className="font-semibold text-slate-900 dark:text-slate-100 text-xs">
                    Selecciona "Instalar aplicación" o "Agregar a pantalla principal"
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Toca <strong>Instalar aplicación</strong> (o <em>Agregar a pantalla de inicio</em>). El ícono de <strong>Estudios Alejandro Ramela</strong> aparecerá en tu menú de aplicaciones de Android como una app independiente.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Advantages of Android Installation */}
          <div className="bg-slate-50 dark:bg-slate-800/40 rounded-xl p-4 border border-slate-200/80 dark:border-slate-800">
            <h5 className="text-xs font-bold text-slate-800 dark:text-slate-200 mb-2">
              ¿Por qué instalarla en tu teléfono?
            </h5>
            <ul className="text-xs text-slate-600 dark:text-slate-400 space-y-1.5 list-disc list-inside">
              <li><strong>Sin barra de navegador:</strong> Vista limpia a pantalla completa para predicar en el púlpito.</li>
              <li><strong>Acceso inmediato:</strong> Toca el ícono en tu pantalla de inicio para abrirla al instante.</li>
              <li><strong>Tus bosquejos guardados:</strong> Se mantienen en la memoria de tu teléfono.</li>
              <li><strong>Lectura en voz alta:</strong> Escucha los estudios mientras conduces o descansas.</li>
            </ul>
          </div>

          {/* Share/Copy link to open on phone */}
          <div className="border-t border-slate-200 dark:border-slate-800 pt-4">
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">
              Enlace directo para abrir en tu teléfono:
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                readOnly
                value={currentUrl}
                className="flex-1 px-3 py-2 text-xs bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-200 select-all font-mono truncate"
              />
              <button
                type="button"
                onClick={handleCopyLink}
                className="px-3.5 py-2 text-xs font-semibold rounded-lg bg-slate-800 hover:bg-slate-700 text-white flex items-center gap-1.5 transition-colors cursor-pointer shrink-0"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Copiado</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copiar</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <span className="text-[11px] text-slate-500 dark:text-slate-400">
            Compatible con Android 7.0+ y Google Chrome
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold rounded-lg bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 transition-colors cursor-pointer"
          >
            Entendido
          </button>
        </div>
      </div>
    </div>
  );
};
