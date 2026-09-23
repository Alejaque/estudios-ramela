import React from 'react';
import { BookOpen, Bookmark, Maximize2, Volume2, VolumeX, Sun, Moon } from 'lucide-react';
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
    <header className="sticky top-0 z-30 bg-white/95 dark:bg-slate-900/95 backdrop-blur border-b border-slate-200/80 dark:border-slate-800 shadow-xs transition-colors">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-4">
        {/* Brand & Identity */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 via-amber-500 to-amber-600 dark:from-amber-500 dark:to-amber-700 flex items-center justify-center text-slate-950 shadow-xs shrink-0 ring-1 ring-amber-400/50">
            <BookOpen className="w-5 h-5 text-slate-950" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100 tracking-tight font-theology-display">
                Estudios Alejandro Ramela
              </h1>
              <span className="hidden sm:inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-full bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-200/60 dark:border-amber-800/60">
                Bíblico & Pastoral
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              Exégesis histórico-gramatical y bosquejos homiléticos expositivos
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* PWA Install Button for Android */}
          <PWAInstallButton />

          {/* Dark Mode Toggle */}
          <button
            id="btn-toggle-dark-mode"
            type="button"
            onClick={onToggleDarkMode}
            title={isDark ? "Cambiar a modo claro" : "Cambiar a modo oscuro (estudio nocturno)"}
            className="p-2 sm:px-3 sm:py-1.5 rounded-lg text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            {isDark ? (
              <>
                <Sun className="w-4 h-4 text-amber-400" />
                <span className="hidden md:inline">Modo Claro</span>
              </>
            ) : (
              <>
                <Moon className="w-4 h-4 text-slate-600 dark:text-slate-300" />
                <span className="hidden md:inline">Modo Oscuro</span>
              </>
            )}
          </button>

          {canSpeak && (
            <button
              onClick={onToggleSpeech}
              title={isSpeaking ? "Detener lectura de voz" : "Escuchar estudio bíblico"}
              className={`p-2 sm:px-3 sm:py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer ${
                isSpeaking
                  ? 'bg-amber-100 dark:bg-amber-950 text-amber-900 dark:text-amber-200 border border-amber-300 dark:border-amber-700 animate-pulse'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 border border-transparent'
              }`}
            >
              {isSpeaking ? <VolumeX className="w-4 h-4 text-amber-800 dark:text-amber-300" /> : <Volume2 className="w-4 h-4 text-slate-600 dark:text-slate-300" />}
              <span className="hidden md:inline">{isSpeaking ? 'Silenciar' : 'Escuchar'}</span>
            </button>
          )}

          <button
            onClick={onOpenPulpitMode}
            title="Abrir modo atril / púlpito para predicar"
            className="p-2 sm:px-3 sm:py-1.5 rounded-lg text-xs font-medium text-slate-700 dark:text-slate-200 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Maximize2 className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            <span className="hidden sm:inline">Modo Púlpito</span>
          </button>

          <button
            onClick={onOpenSaved}
            className="p-2 sm:px-3 sm:py-1.5 rounded-lg text-xs font-medium bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 flex items-center gap-1.5 transition-colors relative cursor-pointer border border-slate-200 dark:border-slate-700"
          >
            <Bookmark className="w-4 h-4 text-slate-700 dark:text-slate-300" />
            <span className="hidden sm:inline">Mis Bosquejos</span>
            {savedCount > 0 && (
              <span className="bg-blue-600 text-white text-[10px] font-bold px-1.5 py-0.2 rounded-full">
                {savedCount}
              </span>
            )}
          </button>
        </div>
      </div>
    </header>
  );
};
