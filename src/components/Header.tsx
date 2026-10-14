import React from 'react';
import { Bookmark, Maximize2, Volume2, VolumeX, Sun, Moon, BookOpen } from 'lucide-react';
import { PWAInstallButton } from './PWAInstallButton';

interface HeaderProps {
  onOpenSaved: () => void;
  savedCount: number;
  onOpenPulpitMode: () => void;
  isSpeaking: boolean;
  onToggleSpeech: () => void;
  canSpeak: boolean;
  isDark: boolean;
  onToggleDarkMode: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenSaved,
  savedCount,
  onOpenPulpitMode,
  isSpeaking,
  onToggleSpeech,
  canSpeak,
  isDark,
  onToggleDarkMode,
}) => {
  return (
    <header className="sticky top-0 z-30 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800 shadow-xs transition-colors">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-4">
        {/* Brand & Identity */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl shrink-0 overflow-hidden shadow-sm ring-2 ring-amber-400/50 bg-slate-800">
            <img
              src="/favicon.png"
              alt="Logo Estudios Alejandro Ramela"
              className="w-full h-full object-cover"
              onError={(e) => {
                // fallback if png is missing
                (e.target as HTMLElement).style.display = 'none';
              }}
            />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100 tracking-tight font-theology-display">
                Estudios Alejandro Ramela
              </h1>
              <span className="hidden sm:inline-flex items-center px-2 py-0.5 text-[10px] font-bold uppercase rounded-full bg-amber-50 dark:bg-amber-950/70 text-amber-800 dark:text-amber-300 border border-amber-200/70 dark:border-amber-800/70">
                Exégesis & Púlpito
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium line-clamp-1">
              Método histórico-gramatical & bosquejos homiléticos
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* PWA Install Button */}
          <PWAInstallButton />

          {/* Dark Mode Toggle */}
          <button
            id="btn-toggle-dark-mode"
            type="button"
            onClick={onToggleDarkMode}
            title={isDark ? "Cambiar a modo claro" : "Cambiar a modo oscuro"}
            className="p-2 sm:px-3 sm:py-2 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center gap-1.5 transition-all cursor-pointer"
          >
            {isDark ? (
              <>
                <Sun className="w-4 h-4 text-amber-400" />
                <span className="hidden md:inline">Claro</span>
              </>
            ) : (
              <>
                <Moon className="w-4 h-4 text-slate-600 dark:text-slate-300" />
                <span className="hidden md:inline">Oscuro</span>
              </>
            )}
          </button>

          {/* Audio Speech */}
          {canSpeak && (
            <button
              onClick={onToggleSpeech}
              title={isSpeaking ? "Detener lectura de voz" : "Escuchar estudio bíblico"}
              className={`p-2 sm:px-3 sm:py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                isSpeaking
                  ? 'bg-amber-100 dark:bg-amber-950 text-amber-900 dark:text-amber-200 border border-amber-300 dark:border-amber-700 animate-pulse'
                  : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700'
              }`}
            >
              {isSpeaking ? (
                <>
                  <VolumeX className="w-4 h-4 text-amber-800 dark:text-amber-300" />
                  <span className="hidden md:inline">Detener</span>
                </>
              ) : (
                <>
                  <Volume2 className="w-4 h-4 text-slate-600 dark:text-slate-300" />
                  <span className="hidden md:inline">Escuchar</span>
                </>
              )}
            </button>
          )}

          {/* Pulpit Mode */}
          <button
            onClick={onOpenPulpitMode}
            title="Abrir teleprompter / atril para predicar"
            className="p-2 sm:px-3 sm:py-2 rounded-xl text-xs font-bold bg-indigo-50 dark:bg-indigo-950/70 hover:bg-indigo-100 dark:hover:bg-indigo-900 text-indigo-900 dark:text-indigo-200 border border-indigo-200 dark:border-indigo-800 flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs"
          >
            <Maximize2 className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            <span className="hidden sm:inline">Modo Púlpito</span>
          </button>

          {/* Saved Studies */}
          <button
            onClick={onOpenSaved}
            title="Ver mis bosquejos guardados"
            className="p-2 sm:px-3 sm:py-2 rounded-xl text-xs font-bold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 flex items-center gap-1.5 transition-all relative cursor-pointer border border-slate-200 dark:border-slate-700 shadow-2xs"
          >
            <Bookmark className="w-4 h-4 text-slate-700 dark:text-slate-300" />
            <span className="hidden sm:inline">Mis Bosquejos</span>
            {savedCount > 0 && (
              <span className="bg-blue-600 text-white text-[10px] font-extrabold px-1.5 py-0.2 rounded-full">
                {savedCount}
              </span>
            )}
          </button>
        </div>
      </div>
    </header>
  );
};
