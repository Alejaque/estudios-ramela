import React, { useState, useEffect, useLayoutEffect, useCallback, useRef } from 'react';
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
  ArrowLeft,
  Timer,
  Maximize2,
  Minimize2,
  GripHorizontal,
  LocateFixed,
} from 'lucide-react';
import { exportStudyToPdf } from '../utils/pdfExport';
import { ensureOutlineTransition, extractMainPoints, type MainPoint } from '../utils/outlineTransition';
import { useModalBackButton } from '../hooks/useModalBackButton';
import { BibleVerseModal } from './BibleVerseModal';

interface PulpitModalProps {
  isOpen: boolean;
  onClose: () => void;
  passageOrTopic: string;
  translation?: string;
  content: string;
}

type PulpitTheme = 'dark-oled' | 'sepia' | 'light' | 'midnight';

interface TimerPosition {
  x: number;
  y: number;
}

interface TimerDrag {
  pointerId: number;
  offsetX: number;
  offsetY: number;
}

const TIMER_MARGIN = 8;
const TIMER_BASE_WIDTH = 304;
const TIMER_MIN_SCALE = 0.65;
const TIMER_MAX_SCALE = 1.6;

const clampTimerScale = (scale: number) =>
  Math.min(TIMER_MAX_SCALE, Math.max(TIMER_MIN_SCALE, Math.round(scale * 100) / 100));

export const PulpitModal: React.FC<PulpitModalProps> = ({
  isOpen,
  onClose,
  passageOrTopic,
  translation,
  content,
}) => {
  const [fontSize, setFontSize] = useState<number>(() =>
    typeof window !== 'undefined' && window.innerWidth <= 1024 ? 24 : 22
  );
  const [theme, setTheme] = useState<PulpitTheme>('dark-oled');
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [personalNote, setPersonalNote] = useState<string>('');
  const [verseRef, setVerseRef] = useState<string | null>(null);

  // Preaching Timer / Stopwatch
  const [timerSeconds, setTimerSeconds] = useState<number>(0);
  const [isTimerRunning, setIsTimerRunning] = useState<boolean>(false);
  const [targetMinutes, setTargetMinutes] = useState<number>(30); // 30 min default
  const [currentClock, setCurrentClock] = useState<string>('');
  const [timerScale, setTimerScale] = useState<number>(1);
  // Modo franja: por defecto el cronómetro es una tira chica que no tapa el texto.
  const [timerCompact, setTimerCompact] = useState<boolean>(() => {
    try { return localStorage.getItem('pulpit_timer_compact') !== '0'; } catch { return true; }
  });
  const [timerPosition, setTimerPosition] = useState<TimerPosition | null>(null);
  const [timerPreferencesLoaded, setTimerPreferencesLoaded] = useState(false);
  const [isTimerDragging, setIsTimerDragging] = useState(false);
  const timerWidgetRef = useRef<HTMLDivElement | null>(null);
  const timerDragRef = useRef<TimerDrag | null>(null);

  const clampTimerPosition = useCallback((position: TimerPosition): TimerPosition => {
    const widget = timerWidgetRef.current;
    if (!widget) return position;
    const rect = widget.getBoundingClientRect();
    // En móviles, un desborde de la página de fondo puede inflar innerWidth /
    // innerHeight. El modal ocupa el viewport real (100vw / 100dvh).
    const viewport = widget.parentElement?.getBoundingClientRect();
    const width = Math.min(window.innerWidth, viewport?.width ?? window.innerWidth);
    const height = Math.min(window.innerHeight, viewport?.height ?? window.innerHeight);
    return {
      x: Math.max(TIMER_MARGIN, Math.min(position.x, width - rect.width - TIMER_MARGIN)),
      y: Math.max(TIMER_MARGIN, Math.min(position.y, height - rect.height - TIMER_MARGIN)),
    };
  }, []);

  // Un desborde horizontal del estudio no debe ampliar ni reescalar el
  // viewport móvil al girar el teléfono. Restaurar los estilos al cerrar.
  useLayoutEffect(() => {
    if (!isOpen) return;
    const elements = [document.documentElement, document.body];
    const previous = elements.map((element) => ({
      value: element.style.getPropertyValue('overflow-x'),
      priority: element.style.getPropertyPriority('overflow-x'),
    }));
    elements.forEach((element) => element.style.setProperty('overflow-x', 'hidden'));
    return () => elements.forEach((element, index) => {
      const { value, priority } = previous[index];
      if (value) element.style.setProperty('overflow-x', value, priority);
      else element.style.removeProperty('overflow-x');
    });
  }, [isOpen]);

  // Restaurar al abrir, antes de pintar. No guardar valores iniciales sobre
  // las preferencias existentes mientras todavía se están cargando.
  useLayoutEffect(() => {
    timerDragRef.current = null;
    setIsTimerDragging(false);
    setTimerPreferencesLoaded(false);
    if (!isOpen) return;

    let scale = 1;
    let position: TimerPosition | null = null;
    try {
      const savedScale = Number(localStorage.getItem('pulpit_timer_scale'));
      if (Number.isFinite(savedScale) && savedScale > 0) {
        scale = clampTimerScale(savedScale);
      }
    } catch {
      // El cronómetro sigue funcionando si el navegador bloquea el storage.
    }
    try {
      const savedPosition = JSON.parse(localStorage.getItem('pulpit_timer_pos') ?? 'null');
      if (
        savedPosition !== null &&
        typeof savedPosition.x === 'number' && Number.isFinite(savedPosition.x) &&
        typeof savedPosition.y === 'number' && Number.isFinite(savedPosition.y)
      ) {
        position = { x: savedPosition.x, y: savedPosition.y };
      }
    } catch {
      // Una posición inválida vuelve a la esquina por defecto.
    }
    setTimerScale(scale);
    setTimerPosition(position);
    setTimerPreferencesLoaded(true);
  }, [isOpen]);

  // Reacomodar al girar el teléfono, escalar o cambiar el tamaño real del
  // widget (p. ej. cuando los controles pasan a otra fila en una pantalla chica).
  useLayoutEffect(() => {
    if (!isOpen || !timerPreferencesLoaded) return;
    const keepInsideViewport = () => {
      setTimerPosition((position) => {
        if (!position) return null;
        const next = clampTimerPosition(position);
        return next.x === position.x && next.y === position.y ? position : next;
      });
    };
    keepInsideViewport();
    window.addEventListener('resize', keepInsideViewport);
    const observer = typeof ResizeObserver !== 'undefined'
      ? new ResizeObserver(keepInsideViewport)
      : null;
    if (timerWidgetRef.current) observer?.observe(timerWidgetRef.current);
    return () => {
      window.removeEventListener('resize', keepInsideViewport);
      observer?.disconnect();
    };
  }, [isOpen, timerPreferencesLoaded, timerScale, clampTimerPosition]);

  useEffect(() => {
    if (!isOpen || !timerPreferencesLoaded) return;
    try {
      localStorage.setItem('pulpit_timer_scale', String(timerScale));
      localStorage.setItem('pulpit_timer_compact', timerCompact ? '1' : '0');
      localStorage.setItem('pulpit_timer_pos', JSON.stringify(timerPosition));
    } catch {
      // Storage lleno o deshabilitado: conservar las preferencias en memoria.
    }
  }, [isOpen, timerPreferencesLoaded, timerScale, timerPosition, timerCompact]);

  const handleTimerPointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!event.isPrimary || event.button !== 0 || timerDragRef.current) return;
    if (event.target instanceof Element && event.target.closest('button, select, input, a, label')) return;
    const rect = event.currentTarget.getBoundingClientRect();
    event.currentTarget.setPointerCapture(event.pointerId);
    timerDragRef.current = {
      pointerId: event.pointerId,
      offsetX: event.clientX - rect.left,
      offsetY: event.clientY - rect.top,
    };
    setIsTimerDragging(true);
  };

  const handleTimerPointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    const drag = timerDragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    setTimerPosition(clampTimerPosition({
      x: event.clientX - drag.offsetX,
      y: event.clientY - drag.offsetY,
    }));
  };

  const handleTimerPointerEnd = (event: React.PointerEvent<HTMLDivElement>) => {
    if (timerDragRef.current?.pointerId !== event.pointerId) return;
    timerDragRef.current = null;
    setIsTimerDragging(false);
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  };

  // Auto-scroll teleprompter
  const [isAutoScrolling, setIsAutoScrolling] = useState<boolean>(false);
  const [scrollSpeed, setScrollSpeed] = useState<number>(2); // 1 to 5
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const autoScrollAnimRef = useRef<number | null>(null);

  // Botón/gesto "Atrás" del celular: vuelve al modo estudio, no sale de la app.
  useModalBackButton(isOpen, onClose);

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

  // Bosquejo con la Oración de Transición y Vista Previa tras la Gran Idea.
  const displayContent = ensureOutlineTransition(content);

  const handlePrint = () => window.print();

  const handleExportPdf = () => {
    exportStudyToPdf({
      passageOrTopic,
      translation,
      content: displayContent,
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

  // Quick jump helpers -----------------------------------------------------
  const normalizeText = (text: string) =>
    text
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/\s+/g, ' ')
      .trim();

  /** Desplaza suavemente SOLO el contenedor del púlpito hasta el elemento. */
  const scrollWithinContainer = (el: Element) => {
    const container = scrollContainerRef.current;
    if (!container) return;
    const offset =
      container.scrollTop +
      (el.getBoundingClientRect().top - container.getBoundingClientRect().top) -
      12;
    container.scrollTo({ top: Math.max(0, offset), behavior: 'smooth' });

    // Destello breve para ubicar el destino, sobre todo en pantallas chicas.
    const htmlEl = el as HTMLElement;
    const previous = {
      outline: htmlEl.style.outline,
      outlineOffset: htmlEl.style.outlineOffset,
      borderRadius: htmlEl.style.borderRadius,
    };
    htmlEl.style.outline = '2px solid rgba(245, 158, 11, 0.9)';
    htmlEl.style.outlineOffset = '3px';
    htmlEl.style.borderRadius = '4px';
    window.setTimeout(() => {
      htmlEl.style.outline = previous.outline;
      htmlEl.style.outlineOffset = previous.outlineOffset;
      htmlEl.style.borderRadius = previous.borderRadius;
    }, 1800);
  };

  const scrollToHeading = (textSnippet: string) => {
    if (!scrollContainerRef.current) return;
    const needle = normalizeText(textSnippet);
    const elements = scrollContainerRef.current.querySelectorAll('h1, h2, h3, h4, strong, li, p');
    for (const el of Array.from(elements)) {
      if (normalizeText(el.textContent ?? '').includes(needle)) {
        scrollWithinContainer(el);
        break;
      }
    }
  };

  /**
   * Salto a los Puntos I / II / III del desarrollo.
   *
   * El contenido real titula los puntos como "**I. …**", "**II. …**",
   * "**III. …**" (sin la palabra "Punto"), por eso buscar el texto
   * "Punto I" nunca encontraba destino y los botones 4, 5 y 6 no hacían
   * nada. Aquí se busca por el numeral romano al inicio del título,
   * distinguiendo I de II y III, y se ignoran las menciones de la
   * "Oración de Transición y Vista Previa" (que también los enumera,
   * pero está antes del desarrollo).
   */
  const scrollToMainPoint = (numeral: MainPoint['numeral']) => {
    const container = scrollContainerRef.current;
    if (!container) return;
    const n = numeral.toLowerCase();
    // `(?![ivx])` evita que "I" coincida con "II"/"III" (y viceversa).
    const directPattern = new RegExp(`^${n}(?![ivx])\\s*[.):\\-–—]`);
    const puntoPattern = new RegExp(`^punto\\s+${n}(?![ivx])\\b`);

    const candidates = Array.from(
      container.querySelectorAll('h1, h2, h3, h4, strong, li, p')
    );

    // 1) Formato del desarrollo: "I. Título", "II. Título", "III. Título".
    const direct = candidates.find((el) =>
      directPattern.test(normalizeText(el.textContent ?? ''))
    );
    if (direct) {
      scrollWithinContainer(direct);
      return;
    }

    // 2) Formato alternativo: "Punto I: Título" como encabezado del desarrollo,
    //    salteando la enumeración de la Vista Previa (lista numerada / párrafo
    //    de transición ubicado antes del desarrollo).
    const punto = candidates.find((el) => {
      const text = normalizeText(el.textContent ?? '');
      if (!puntoPattern.test(text) || text.length > 220) return false;
      if (el.closest('ol')) return false; // lista 1-2-3 de la Vista Previa
      const context = normalizeText(
        el.closest('p, li')?.textContent ?? text
      );
      return (
        !context.includes('oracion de transicion') &&
        !context.includes('vista previa') &&
        !context.includes('de esta gran idea se desprende')
      );
    });
    if (punto) {
      scrollWithinContainer(punto);
      return;
    }

    // 3) Último recurso: cualquier mención al punto.
    scrollToHeading(`Punto ${numeral}`);
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
    <div data-pulpit-theme={theme} className={`pulpit-view fixed inset-0 w-screen h-dvh z-50 flex flex-col font-theology-serif select-none ${themeClasses}`}>
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
        {/* Volver a Estudio (bien visible, arriba a la izquierda) */}
        <button
          type="button"
          onClick={onClose}
          title="Volver al modo estudio"
          aria-label="Volver a Estudio"
          className="shrink-0 inline-flex items-center gap-1.5 min-h-[44px] px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 active:bg-amber-600 text-slate-950 text-sm font-extrabold shadow-md transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-5 h-5 shrink-0" />
          <span>← Volver a Estudio</span>
        </button>

        {/* Title and Clock */}
        <div className="flex items-center gap-3 min-w-0">
          <span className="hidden sm:inline-block text-[10px] uppercase font-extrabold tracking-wider px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30 shrink-0">
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

        {/* Preaching Stopwatch Controls (en celular vive en el widget flotante) */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          <div
            className={`hidden md:flex items-center gap-1.5 px-3 py-1 rounded-xl font-mono text-sm font-bold border transition-colors ${
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
            className="hidden md:block px-2 py-1 rounded-lg text-xs bg-black/20 border border-white/10 text-slate-200 outline-none cursor-pointer"
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
      <div className="pulpit-jumps px-4 sm:px-8 py-1.5 bg-black/30 border-b border-white/5 flex items-center gap-1 overflow-x-auto no-scrollbar text-xs font-sans no-print">
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
          onClick={() => scrollToHeading(/bosquejo general/i.test(displayContent) ? 'Bosquejo General' : 'Oración de Transición')}
          title="Bosquejo y vista previa del pasaje"
          className="px-2.5 py-1 rounded-lg bg-amber-500/15 text-amber-300 hover:bg-amber-500/30 transition-colors shrink-0 cursor-pointer font-semibold"
        >
          ↪ Vista Previa
        </button>
        {extractMainPoints(displayContent).map((point) => (
          <button key={point.numeral} type="button" onClick={() => scrollToMainPoint(point.numeral)}
            className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/15 text-slate-300 hover:text-white transition-colors shrink-0 cursor-pointer">
            {point.label}
          </button>
        ))}
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
        className="flex-1 overflow-y-auto px-5 sm:px-12 md:px-20 lg:px-32 pt-10 pb-44"
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
            className="pulpit-markdown markdown-theology prose max-w-none font-theology-serif"
            style={{ fontSize: `${fontSize}px`, lineHeight: 1.7 }}
          >
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{ strong: BoldAsVerse }}
            >
              {displayContent}
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

      {/* Cronómetro flotante: movible con dedo o mouse, sin desplazar el sermón. */}
      <div
        ref={timerWidgetRef}
        onPointerDown={handleTimerPointerDown}
        onPointerMove={handleTimerPointerMove}
        onPointerUp={handleTimerPointerEnd}
        onPointerCancel={handleTimerPointerEnd}
        onLostPointerCapture={handleTimerPointerEnd}
        className={`absolute z-50 no-print font-sans ${timerCompact ? 'rounded-full shadow-lg' : 'rounded-3xl shadow-2xl'} border backdrop-blur-md touch-none select-none overflow-y-auto ${
          isTimerDragging ? 'cursor-grabbing' : 'cursor-grab'
        } ${
          isTimeExceeded
            ? 'bg-red-950/90 border-red-500/60'
            : isTimeWarning
            ? 'bg-amber-950/90 border-amber-500/60'
            : 'bg-slate-950/90 border-white/20'
        }`}
        style={{
          ...(timerCompact ? {} : { width: TIMER_BASE_WIDTH * timerScale }),
          maxWidth: `calc(100vw - ${TIMER_MARGIN * 2}px)`,
          maxHeight: `calc(100dvh - ${TIMER_MARGIN * 2}px)`,
          padding: timerCompact ? '4px 6px 4px 12px' : `${12 * timerScale}px ${16 * timerScale}px`,
          ...(timerPosition
            ? { left: timerPosition.x, top: timerPosition.y }
            : { right: TIMER_MARGIN, bottom: `max(${TIMER_MARGIN}px, env(safe-area-inset-bottom))` }),
        }}
        role="timer"
        aria-label={`Cronómetro de prédica: ${formatTimer(timerSeconds)} de ${targetMinutes} minutos`}
      >
        {timerCompact ? (
          <div className="flex items-center gap-2 whitespace-nowrap">
            <Timer className={`w-3.5 h-3.5 shrink-0 ${isTimerRunning ? 'text-emerald-400 animate-pulse' : 'text-slate-400'}`} aria-hidden="true" />
            <span
              className={`font-mono font-bold tabular-nums text-base leading-none ${
                isTimeExceeded ? 'text-red-400 animate-pulse' : isTimeWarning ? 'text-amber-300' : 'text-emerald-400'
              }`}
            >
              {formatTimer(timerSeconds)}
            </span>
            <button
              type="button"
              onClick={() => setIsTimerRunning(!isTimerRunning)}
              title={isTimerRunning ? 'Pausar cronómetro' : 'Iniciar cronómetro de prédica'}
              aria-label={isTimerRunning ? 'Pausar cronómetro' : 'Iniciar cronómetro de prédica'}
              className={`w-9 h-9 shrink-0 rounded-full flex items-center justify-center cursor-pointer ${
                isTimerRunning ? 'bg-amber-500 text-slate-950' : 'bg-emerald-600 text-white'
              }`}
            >
              {isTimerRunning ? <Pause size={16} /> : <Play size={16} />}
            </button>
            <button
              type="button"
              onClick={() => setTimerCompact(false)}
              title="Ver cronómetro completo (meta, tamaño, reiniciar)"
              aria-label="Ver cronómetro completo"
              className="w-9 h-9 shrink-0 rounded-full flex items-center justify-center bg-white/10 text-slate-200 cursor-pointer"
            >
              <Maximize2 size={14} />
            </button>
          </div>
        ) : (
        <>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="flex items-center gap-1.5 text-[10px] font-extrabold uppercase tracking-wider text-slate-300">
            <Timer className={`w-4 h-4 ${isTimerRunning ? 'text-emerald-400 animate-pulse' : 'text-slate-400'}`} />
            Cronómetro
          </span>
          <select
            value={targetMinutes}
            onChange={(e) => setTargetMinutes(Number(e.target.value))}
            className="px-1.5 py-1 rounded-lg text-[11px] font-semibold bg-white/10 border border-white/15 text-slate-100 outline-none cursor-pointer"
            title="Meta de tiempo de prédica"
            aria-label="Meta de tiempo de prédica"
          >
            <option value={15} className="bg-slate-900">Meta 15m</option>
            <option value={20} className="bg-slate-900">Meta 20m</option>
            <option value={25} className="bg-slate-900">Meta 25m</option>
            <option value={30} className="bg-slate-900">Meta 30m</option>
            <option value={40} className="bg-slate-900">Meta 40m</option>
            <option value={45} className="bg-slate-900">Meta 45m</option>
          </select>
        </div>

        <div className="mt-2 flex items-center justify-center gap-1 text-[10px] text-slate-400">
          <GripHorizontal className="w-3.5 h-3.5" aria-hidden="true" />
          <span>mantené y arrastrá</span>
        </div>

        <div className="flex flex-wrap items-end justify-between gap-2 mt-2">
          <span
            style={{ fontSize: 52 * timerScale }}
            className={`font-mono font-extrabold tabular-nums leading-none ${
              isTimeExceeded
                ? 'text-red-400 animate-pulse'
                : isTimeWarning
                ? 'text-amber-300'
                : 'text-emerald-400'
            }`}
          >
            {formatTimer(timerSeconds)}
          </span>
          <div className="flex items-center gap-1.5 pb-1">
            <button
              type="button"
              onClick={() => setIsTimerRunning(!isTimerRunning)}
              title={isTimerRunning ? 'Pausar cronómetro' : 'Iniciar cronómetro de prédica'}
              aria-label={isTimerRunning ? 'Pausar cronómetro' : 'Iniciar cronómetro de prédica'}
              style={{ width: Math.max(38, 44 * timerScale), height: Math.max(38, 44 * timerScale) }}
              className={`shrink-0 rounded-2xl flex items-center justify-center text-white shadow-md transition-colors cursor-pointer ${
                isTimerRunning
                  ? 'bg-amber-500 hover:bg-amber-400 text-slate-950'
                  : 'bg-emerald-600 hover:bg-emerald-500'
              }`}
            >
              {isTimerRunning
                ? <Pause size={Math.max(16, 20 * timerScale)} />
                : <Play size={Math.max(16, 20 * timerScale)} />}
            </button>
            <button
              type="button"
              onClick={() => {
                setIsTimerRunning(false);
                setTimerSeconds(0);
              }}
              title="Reiniciar cronómetro"
              aria-label="Reiniciar cronómetro"
              style={{ width: Math.max(38, 44 * timerScale), height: Math.max(38, 44 * timerScale) }}
              className="shrink-0 rounded-2xl flex items-center justify-center bg-white/10 hover:bg-white/20 text-slate-200 border border-white/15 transition-colors cursor-pointer"
            >
              <RotateCcw size={Math.max(16, 20 * timerScale)} />
            </button>
          </div>
        </div>

        {/* Progreso hacia la meta */}
        <div className="mt-2.5">
          <div className="h-2 rounded-full bg-white/10 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-1000 ${
                isTimeExceeded ? 'bg-red-500' : isTimeWarning ? 'bg-amber-400' : 'bg-emerald-500'
              }`}
              style={{
                width: `${targetSeconds > 0 ? Math.min(100, (timerSeconds / targetSeconds) * 100) : 0}%`,
              }}
            />
          </div>
          <p className="mt-1 text-[11px] font-medium text-slate-300 flex items-center justify-between">
            <span>
              {isTimeExceeded
                ? `Te pasaste de la meta (${targetMinutes} min)`
                : isTimeWarning
                ? '¡Últimos 5 minutos!'
                : `Meta: ${targetMinutes} min`}
            </span>
            {currentClock && <span className="font-mono text-slate-400">🕐 {currentClock}</span>}
          </p>
        </div>

        <div className="mt-2 pt-2 border-t border-white/10 flex flex-wrap items-center justify-between gap-1 text-[11px] text-slate-300">
          <div className="flex items-center gap-0.5" role="group" aria-label="Tamaño del cronómetro">
            <button
              type="button"
              onClick={() => setTimerScale((scale) => clampTimerScale(scale - 0.1))}
              disabled={timerScale <= TIMER_MIN_SCALE}
              title="Achicar cronómetro"
              aria-label="Achicar cronómetro"
              className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 disabled:opacity-40 disabled:cursor-not-allowed text-lg font-bold cursor-pointer"
            >
              −
            </button>
            <span className="min-w-8 text-center font-mono" aria-live="polite">
              {Math.round(timerScale * 100)}%
            </span>
            <button
              type="button"
              onClick={() => setTimerScale((scale) => clampTimerScale(scale + 0.1))}
              disabled={timerScale >= TIMER_MAX_SCALE}
              title="Agrandar cronómetro"
              aria-label="Agrandar cronómetro"
              className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 disabled:opacity-40 disabled:cursor-not-allowed text-lg font-bold cursor-pointer"
            >
              +
            </button>
          </div>
          <button
            type="button"
            onClick={() => {
              setTimerScale(1);
              setTimerPosition(null);
            }}
            title="Volver a la esquina inferior derecha y al tamaño 100%"
            className="h-8 px-1.5 rounded-lg bg-white/10 hover:bg-white/20 flex items-center gap-1 cursor-pointer"
          >
            <LocateFixed className="w-3.5 h-3.5" aria-hidden="true" />
            Esquina
          </button>
          <button
            type="button"
            onClick={() => setTimerCompact(true)}
            title="Achicar a franja"
            className="h-8 px-1.5 rounded-lg bg-white/10 hover:bg-white/20 flex items-center gap-1 cursor-pointer"
          >
            <Minimize2 className="w-3.5 h-3.5" aria-hidden="true" />
            Franja
          </button>
        </div>
        </>
        )}
      </div>
    </div>
  );
};
