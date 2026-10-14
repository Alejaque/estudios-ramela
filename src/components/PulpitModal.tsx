import React, { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import {
  X,
  Printer,
  ZoomIn,
  ZoomOut,
  Maximize,
  Minimize,
  Play,
  Pause,
  RotateCcw,
  Clock,
  Compass,
  PenLine,
  FileDown,
  Palette,
  ChevronRight,
} from 'lucide-react';
import { exportStudyToPdf } from '../utils/pdfExport';
import { BibleVerseModal } from './BibleVerseModal';

interface PulpitModalProps {
  isOpen: boolean;
  onClose: () => void;
  passageOrTopic: string;
  translation?: string;
  content: string;
}

type PulpitTheme = 'dark-oled' | 'sepia' | 'light' | 'midnight';

export const PulpitModal: React.FC<PulpitModalProps> = ({
  isOpen,
  onClose,
  passageOrTopic,
  translation,
  content,
}) => {
  const [fontSize, setFontSize] = useState<number>(20);
  const [theme, setTheme] = useState<PulpitTheme>('dark-oled');
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [personalNote, setPersonalNote] = useState<string>('');
  const [verseRef, setVerseRef] = useState<string | null>(null);

  // Preaching Timer / Stopwatch
  const [timerSeconds, setTimerSeconds] = useState<number>(0);
  const [isTimerRunning, setIsTimerRunning] = useState<boolean>(false);
  const [targetMinutes, setTargetMinutes] = useState<number>(30); // 30 min default
  const [currentClock, setCurrentClock] = useState<string>('');

  // Auto-scroll teleprompter
  const [isAutoScrolling, setIsAutoScrolling] = useState<boolean>(false);
  const [scrollSpeed, setScrollSpeed] = useState<number>(2); // 1 to 5
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const autoScrollAnimRef = useRef<number | null>(null);

  // Clock updater
  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      setCurrentClock(
        now.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })
      );
    };
    updateClock();
    const interval = setInterval(updateClock, 1000);
    return () => clearInterval(interval);
  }, []);

  // Timer interval
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (isTimerRunning) {
      interval = setInterval(() => {
        setTimerSeconds((prev) => prev + 1);
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isTimerRunning]);

  // Teleprompter Auto-scroll
  useEffect(() => {
    if (!isAutoScrolling) {
      if (autoScrollAnimRef.current) {
        cancelAnimationFrame(autoScrollAnimRef.current);
      }
      return;
    }

    const step = () => {
      if (scrollContainerRef.current) {
        scrollContainerRef.current.scrollTop += scrollSpeed * 0.4;
      }
      autoScrollAnimRef.current = requestAnimationFrame(step);
    };

    autoScrollAnimRef.current = requestAnimationFrame(step);
    return () => {
      if (autoScrollAnimRef.current) {
        cancelAnimationFrame(autoScrollAnimRef.current);
      }
    };
  }, [isAutoScrolling, scrollSpeed]);

  // Load personal notes
  useEffect(() => {
    if (!passageOrTopic) return;
    try {
      const storageKey = `biblical_notes_${passageOrTopic.trim().toLowerCase()}`;
      const savedRaw = localStorage.getItem(storageKey);
      if (savedRaw) {
        const parsed = JSON.parse(savedRaw);
        setPersonalNote(parsed.text || '');
      } else {
        setPersonalNote('');
      }
    } catch {
      const rawText = localStorage.getItem(`biblical_notes_${passageOrTopic.trim().toLowerCase()}`);
      setPersonalNote(rawText || '');
    }
  }, [passageOrTopic, isOpen]);

  // Fullscreen toggle
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
    }
  };

  if (!isOpen) return null;

  const handlePrint = () => window.print();

  const handleExportPdf = () => {
    exportStudyToPdf({
      passageOrTopic,
      translation,
      content,
      personalNotes: personalNote,
    });
  };

  // Timer calculations
  const formatTimer = (totalSec: number) => {
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const targetSeconds = targetMinutes * 60;
  const isTimeWarning = targetMinutes > 0 && timerSeconds >= targetSeconds - 300 && timerSeconds < targetSeconds;
  const isTimeExceeded = targetMinutes > 0 && timerSeconds >= targetSeconds;

  // Theme styling classes
  const themeClasses = {
    'dark-oled': 'bg-black text-slate-100',
    'sepia': 'bg-[#fcf8ed] text-[#2c2214]',
    'light': 'bg-white text-slate-900',
    'midnight': 'bg-slate-950 text-slate-100',
  }[theme];

  const headerThemeClasses = {
    'dark-oled': 'bg-zinc-950 border-zinc-900 text-white',
    'sepia': 'bg-[#f5edd7] border-[#e6dbc0] text-[#2c2214]',
    'light': 'bg-slate-100 border-slate-200 text-slate-900',
    'midnight': 'bg-slate-900 border-slate-800 text-white',
  }[theme];

  // Quick jump helper
  const scrollToHeading = (textSnippet: string) => {
    if (!scrollContainerRef.current) return;
    const elements = scrollContainerRef.current.querySelectorAll('h1, h2, h3, strong');
    for (const el of Array.from(elements)) {
      if (el.textContent?.toLowerCase().includes(textSnippet.toLowerCase())) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        break;
      }
    }
  };

  const BoldAsVerse = ({ children }: { children?: React.ReactNode }) => {
    const text = String(children ?? '');
    const verseRegex = /^([1-3]?\s?[A-Za-záéíóúüñÁÉÍÓÚÜÑ]+\.?\s\d+[:\d,\-\s]*)/;
    if (verseRegex.test(text.trim())) {
      return (
        <strong
          className="cursor-pointer underline decoration-dotted text-blue-400 hover:text-blue-300 transition-colors"
          onClick={() => setVerseRef(text.trim())}
          title="Tocar para leer el pasaje"
        >
          {children}
        </strong>
      );
    }
    return <strong className="font-bold">{children}</strong>;
  };

  return (
    <div className={`fixed inset-0 z-50 flex flex-col font-theology-serif select-none ${themeClasses}`}>
      {verseRef && (
        <BibleVerseModal
          reference={verseRef}
          onClose={() => setVerseRef(null)}
        />
      )}

      {/* Top Preaching Control Bar */}
      <div
        className={`px-4 sm:px-6 py-2.5 border-b flex flex-wrap items-center justify-between gap-3 no-print shadow-md ${headerThemeClasses} font-sans`}
      >
        {/* Title and Clock */}
        <div className="flex items-center gap-3">
          <span className="text-[10px] uppercase font-extrabold tracking-wider px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30">
            Atril / Púlpito
          </span>
          <h2 className="text-sm sm:text-base font-bold truncate max-w-xs sm:max-w-md font-theology-serif">
            {passageOrTopic}
          </h2>
          <div className="hidden lg:flex items-center gap-1 text-xs font-mono px-2 py-0.5 rounded bg-black/20 text-slate-300">
            <Clock className="w-3.5 h-3.5 text-blue-400" />
            <span>{currentClock}</span>
          </div>
        </div>

        {/* Preaching Stopwatch Controls */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          <div
            className={`flex items-center gap-1.5 px-3 py-1 rounded-xl font-mono text-sm font-bold border transition-colors ${
              isTimeExceeded
                ? 'bg-red-500/20 text-red-400 border-red-500/40 animate-pulse'
                : isTimeWarning
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                : 'bg-black/20 text-emerald-400 border-emerald-500/30'
            }`}
          >
            <span>{formatTimer(timerSeconds)}</span>
            <span className="text-[10px] opacity-60">/ {targetMinutes}m</span>

            <button
              type="button"
              onClick={() => setIsTimerRunning(!isTimerRunning)}
              title={isTimerRunning ? 'Pausar cronómetro' : 'Iniciar cronómetro de prédica'}
              className="p-1 hover:text-white rounded transition-colors cursor-pointer"
            >
              {isTimerRunning ? <Pause className="w-3.5 h-3.5 text-amber-400" /> : <Play className="w-3.5 h-3.5 text-emerald-400" />}
            </button>
            <button
              type="button"
              onClick={() => {
                setIsTimerRunning(false);
                setTimerSeconds(0);
              }}
              title="Reiniciar cronómetro"
              className="p-1 hover:text-white rounded opacity-75 hover:opacity-100 transition-opacity cursor-pointer"
            >
              <RotateCcw className="w-3 h-3" />
            </button>
          </div>

          {/* Target minutes preset */}
          <select
            value={targetMinutes}
            onChange={(e) => setTargetMinutes(Number(e.target.value))}
            className="px-2 py-1 rounded-lg text-xs bg-black/20 border border-white/10 text-slate-200 outline-none cursor-pointer"
            title="Meta de tiempo de prédica"
          >
            <option value={15}>15 min</option>
            <option value={20}>20 min</option>
            <option value={25}>25 min</option>
            <option value={30}>30 min</option>
            <option value={40}>40 min</option>
            <option value={45}>45 min</option>
          </select>

          {/* Teleprompter Auto-scroll toggle */}
          <div className="hidden md:flex items-center gap-1 px-2 py-1 rounded-xl bg-black/20 border border-white/10 text-xs">
            <button
              type="button"
              onClick={() => setIsAutoScrolling(!isAutoScrolling)}
              title={isAutoScrolling ? 'Pausar teleprompter' : 'Activar auto-desplazamiento suave'}
              className={`px-2 py-0.5 rounded font-semibold flex items-center gap-1 cursor-pointer transition-colors ${
                isAutoScrolling ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-300 hover:text-white'
              }`}
            >
              {isAutoScrolling ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
              <span>Auto-scroll</span>
            </button>
            {isAutoScrolling && (
              <select
                value={scrollSpeed}
                onChange={(e) => setScrollSpeed(Number(e.target.value))}
                className="bg-transparent text-[11px] text-amber-300 outline-none cursor-pointer"
              >
                <option value={1} className="bg-slate-900 text-white">1x</option>
                <option value={2} className="bg-slate-900 text-white">2x</option>
                <option value={3} className="bg-slate-900 text-white">3x</option>
                <option value={4} className="bg-slate-900 text-white">4x</option>
              </select>
            )}
          </div>

          {/* Font Size */}
          <div className="flex items-center rounded-xl bg-black/20 border border-white/10 overflow-hidden text-xs">
            <button
              onClick={() => setFontSize((s) => Math.max(16, s - 2))}
              title="Reducir letra"
              className="p-1.5 hover:bg-white/10 transition-colors cursor-pointer"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <span className="px-1.5 text-[11px] font-mono">{fontSize}px</span>
            <button
              onClick={() => setFontSize((s) => Math.min(36, s + 2))}
              title="Aumentar letra"
              className="p-1.5 hover:bg-white/10 transition-colors cursor-pointer"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Theme Selector */}
          <div className="flex items-center rounded-xl bg-black/20 border border-white/10 p-0.5 text-xs">
            <button
              type="button"
              onClick={() => setTheme('dark-oled')}
              title="Tema OLED Negro puro"
              className={`px-2 py-1 rounded-lg cursor-pointer ${theme === 'dark-oled' ? 'bg-zinc-800 text-white font-bold' : 'text-slate-400'}`}
            >
              🖤
            </button>
            <button
              type="button"
              onClick={() => setTheme('sepia')}
              title="Tema Sepia Pergamino"
              className={`px-2 py-1 rounded-lg cursor-pointer ${theme === 'sepia' ? 'bg-amber-200 text-amber-950 font-bold' : 'text-slate-400'}`}
            >
              📜
            </button>
            <button
              type="button"
              onClick={() => setTheme('light')}
              title="Tema Luz Blanco"
              className={`px-2 py-1 rounded-lg cursor-pointer ${theme === 'light' ? 'bg-white text-slate-900 font-bold' : 'text-slate-400'}`}
            >
              ☀️
            </button>
          </div>

          {/* Fullscreen */}
          <button
            onClick={toggleFullscreen}
            title={isFullscreen ? 'Salir de pantalla completa' : 'Pantalla completa para el atril'}
            className="p-2 rounded-xl bg-black/20 border border-white/10 hover:bg-white/10 transition-colors cursor-pointer"
          >
            {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
          </button>

          {/* PDF */}
          <button
            onClick={handleExportPdf}
            title="Exportar a PDF"
            className="p-2 rounded-xl bg-black/20 border border-white/10 hover:bg-white/10 transition-colors cursor-pointer hidden sm:block"
          >
            <FileDown className="w-4 h-4 text-blue-400" />
          </button>

          {/* Print */}
          <button
            onClick={handlePrint}
            title="Imprimir hoja para el púlpito"
            className="p-2 rounded-xl bg-black/20 border border-white/10 hover:bg-white/10 transition-colors cursor-pointer hidden sm:block"
          >
            <Printer className="w-4 h-4" />
          </button>

          {/* Close */}
          <button
            onClick={onClose}
            title="Cerrar modo púlpito"
            className="p-2 rounded-xl bg-red-600/80 hover:bg-red-600 text-white transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Quick Outline Jump Bar */}
      <div className="px-4 sm:px-8 py-1.5 bg-black/30 border-b border-white/5 flex items-center gap-1 overflow-x-auto no-scrollbar text-xs font-sans no-print">
        <span className="text-[11px] font-semibold text-slate-400 flex items-center gap-1 shrink-0 mr-1">
          <Compass className="w-3.5 h-3.5 text-amber-400" />
          Salto rápido:
        </span>
        <button
          type="button"
          onClick={() => scrollToHeading('Contexto')}
          className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/15 text-slate-300 hover:text-white transition-colors shrink-0 cursor-pointer"
        >
          1. Contexto
        </button>
        <button
          type="button"
          onClick={() => scrollToHeading('Introducción')}
          className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/15 text-slate-300 hover:text-white transition-colors shrink-0 cursor-pointer"
        >
          2. Introducción
        </button>
        <button
          type="button"
          onClick={() => scrollToHeading('Proposición')}
          className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/15 text-slate-300 hover:text-white transition-colors shrink-0 cursor-pointer"
        >
          3. Gran Idea
        </button>
        <button
          type="button"
          onClick={() => scrollToHeading('Punto I')}
          className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/15 text-slate-300 hover:text-white transition-colors shrink-0 cursor-pointer"
        >
          4. Punto I
        </button>
        <button
          type="button"
          onClick={() => scrollToHeading('Punto II')}
          className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/15 text-slate-300 hover:text-white transition-colors shrink-0 cursor-pointer"
        >
          5. Punto II
        </button>
        <button
          type="button"
          onClick={() => scrollToHeading('Punto III')}
          className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/15 text-slate-300 hover:text-white transition-colors shrink-0 cursor-pointer"
        >
          6. Punto III
        </button>
        <button
          type="button"
          onClick={() => scrollToHeading('Aplicación')}
          className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/15 text-slate-300 hover:text-white transition-colors shrink-0 cursor-pointer"
        >
          7. Aplicación
        </button>
        <button
          type="button"
          onClick={() => scrollToHeading('Llamado')}
          className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/15 text-slate-300 hover:text-white transition-colors shrink-0 cursor-pointer"
        >
          8. Llamado
        </button>
        {personalNote && (
          <button
            type="button"
            onClick={() => scrollToHeading('Notas y Reflexiones')}
            className="px-2.5 py-1 rounded-lg bg-amber-500/20 text-amber-300 hover:bg-amber-500/30 transition-colors shrink-0 cursor-pointer font-semibold"
          >
            ✍️ Mis Notas
          </button>
        )}
      </div>

      {/* Main Preaching Content */}
      <div
        ref={scrollContainerRef}
        className="flex-1 overflow-y-auto px-5 sm:px-12 md:px-20 lg:px-32 py-10"
      >
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Header */}
          <div className="border-b pb-4 mb-6 border-white/10">
            <h1
              className="text-3xl sm:text-4xl md:text-5xl font-extrabold font-theology-serif tracking-tight mb-2 cursor-pointer hover:opacity-80 transition-opacity"
              onClick={() => setVerseRef(passageOrTopic.trim())}
              title="Tocar para leer el texto bíblico"
            >
              {passageOrTopic}
            </h1>
            {translation && (
              <p className="text-sm opacity-70 font-sans">
                Texto base: {translation} • Bosquejo Homilético Expositivo
              </p>
            )}
          </div>

          {/* Text with dynamic font size */}
          <div
            className="markdown-theology prose prose-invert max-w-none font-theology-serif"
            style={{ fontSize: `${fontSize}px`, lineHeight: 1.85 }}
          >
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{ strong: BoldAsVerse }}
            >
              {content}
            </ReactMarkdown>
          </div>

          {/* Personal Preacher's Notes at the bottom */}
          {personalNote && (
            <div className="mt-12 pt-8 border-t-2 border-amber-400/40 bg-amber-950/20 p-6 sm:p-8 rounded-3xl">
              <h3 className="text-xl font-bold font-theology-serif text-amber-300 mb-3 flex items-center gap-2">
                <PenLine className="w-5 h-5 text-amber-400" />
                Notas y Reflexiones Personales del Expositor
              </h3>
              <div
                className="whitespace-pre-wrap font-sans leading-relaxed text-slate-200"
                style={{ fontSize: `${Math.max(16, fontSize - 2)}px` }}
              >
                {personalNote}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
