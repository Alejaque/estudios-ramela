import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X, BookOpen, Loader2, Copy, Check, Sparkles, ExternalLink } from 'lucide-react';
import { rvr1960Url } from '../utils/bibleRef';
import { SCRIPTURE_TEXTS } from '../utils/theologicalEngine';
import { useModalBackButton } from '../hooks/useModalBackButton';

interface BibleVerseModalProps {
  reference: string;
  onClose: () => void;
}

const TRANSLATIONS = [
  { id: 'rvr60', apiId: '592420522e16049f-01', label: 'RVR 1960', fullName: 'Reina-Valera 1960' },
  { id: 'nvi', apiId: 'b32b9d1b64b4ef29-01', label: 'NVI', fullName: 'Nueva Versión Internacional' },
];

export const BibleVerseModal: React.FC<BibleVerseModalProps> = ({ reference, onClose }) => {
  const [selectedVersion, setSelectedVersion] = useState<'rvr60' | 'nvi'>('rvr60');
  const [verseText, setVerseText] = useState('');
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState('');
  // true cuando el texto vino de la API (api.bible), que NO tiene RVR1960 ni NVI.
  const [fromApi, setFromApi] = useState(false);

  // Este modal solo se monta cuando está abierto: "Atrás" lo cierra y
  // vuelve al estudio (o al púlpito) en vez de salir de la app.
  useModalBackButton(true, onClose);

  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const previousFocus = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    dialogRef.current?.focus();
    return () => {
      document.body.style.overflow = previousOverflow;
      previousFocus?.focus({ preventScroll: true });
    };
  }, []);

  const handleDialogKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Escape') {
      event.preventDefault();
      event.stopPropagation();
      onClose();
    }
    if (event.key === 'Tab') {
      const controls = dialogRef.current?.querySelectorAll<HTMLElement>(
        'button:not(:disabled), a[href], [tabindex="0"]'
      );
      if (!controls?.length) return;
      const first = controls[0];
      const last = controls[controls.length - 1];
      if (event.shiftKey && (document.activeElement === first || document.activeElement === dialogRef.current)) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && (document.activeElement === last || document.activeElement === dialogRef.current)) {
        event.preventDefault();
        first.focus();
      }
    }
  };

  // Normalizar referencia para búsqueda local
  const cleanRef = reference.trim().toLowerCase();

  useEffect(() => {
    // 1. Primero intentar buscar en la base de datos local enriquecida
    let localMatch: { rvr60: string; nvi: string } | null = null;

    for (const key of Object.keys(SCRIPTURE_TEXTS)) {
      if (cleanRef.includes(key) || key.includes(cleanRef)) {
        localMatch = SCRIPTURE_TEXTS[key];
        break;
      }
    }

    if (localMatch) {
      setFromApi(false);
      setVerseText(selectedVersion === 'rvr60' ? localMatch.rvr60 : localMatch.nvi);
      setLoading(false);
      setError('');
      return;
    }

    // 2. Si no está en el diccionario local, intentar buscar en la API bíblica
    const fetchVerse = async () => {
      setLoading(true);
      setError('');
      setVerseText('');
      try {
        const res = await fetch(
          `/api/bible?ref=${encodeURIComponent(reference)}&version=${selectedVersion}`
        );
        if (!res.ok) throw new Error('No encontrado');
        const data = await res.json();
        if (!data.text) throw new Error('Sin resultados');
        setFromApi(true);
        setVerseText(data.text);
      } catch {
        // Fallback elegante contextual
        setVerseText(
          `"Toda la Escritura es inspirada por Dios, y útil para enseñar, para redargüir, para corregir, para instruir en justicia, a fin de que el hombre de Dios sea perfecto, enteramente preparado para toda buena obra." (2 Timoteo 3:16-17)\n\n[Consulta "${reference}" en tu ejemplar bíblico o versión predilecta]`
        );
      } finally {
        setLoading(false);
      }
    };

    fetchVerse();
  }, [cleanRef, reference, selectedVersion]);

  const handleCopy = () => {
    if (!verseText) return;
    navigator.clipboard.writeText(`"${verseText}"\n— ${reference} (${selectedVersion.toUpperCase()})`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-sm"
      onClick={(event) => { if (event.target === event.currentTarget) onClose(); }}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="bible-verse-title"
        tabIndex={-1}
        onKeyDown={handleDialogKeyDown}
        className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-lg max-h-[calc(100dvh-2rem)] flex flex-col min-h-0 border border-slate-200 dark:border-slate-800 overflow-hidden outline-none"
      >
        {/* Encabezado */}
        <div className="shrink-0 flex items-center justify-between px-4 sm:px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-gradient-to-r from-blue-50/80 via-indigo-50/40 to-transparent dark:from-blue-950/40 dark:via-slate-900 dark:to-slate-900">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-600/10 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 uppercase tracking-wide">
                  Texto Bíblico
                </span>
                <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                  Lectura directa
                </span>
              </div>
              <h3 id="bible-verse-title" className="font-bold text-slate-900 dark:text-slate-100 font-theology-serif text-lg leading-tight">
                {reference}
              </h3>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={handleCopy}
              disabled={!verseText || loading}
              title="Copiar texto bíblico"
              className="p-2 rounded-xl text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer disabled:opacity-40"
            >
              {copied ? (
                <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              ) : (
                <Copy className="w-4 h-4" />
              )}
            </button>
            <button
              onClick={onClose}
              title="Cerrar ventana"
              aria-label="Cerrar ventana"
              className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Selector de versión */}
        <div className="shrink-0 flex flex-wrap gap-2 items-center justify-between px-4 sm:px-6 py-2.5 bg-slate-50/70 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800 text-xs">
          <span className="text-slate-500 dark:text-slate-400 font-medium flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            Versión bíblica:
          </span>
          <div className="flex gap-1.5">
            {TRANSLATIONS.map((t) => (
              <button
                key={t.id}
                onClick={() => setSelectedVersion(t.id as 'rvr60' | 'nvi')}
                className={`px-3 py-1 rounded-lg font-semibold transition-all cursor-pointer ${
                  selectedVersion === t.id
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* Contenido del versículo */}
        <div className="min-h-0 overflow-y-auto overscroll-contain px-4 sm:px-6 py-6"
          tabIndex={0}
          role="region"
          aria-label="Texto del pasaje bíblico">
          {loading && (
            <div className="flex flex-col items-center gap-2 text-slate-500 dark:text-slate-400 py-6">
              <Loader2 className="w-6 h-6 animate-spin text-blue-600 dark:text-blue-400" />
              <span className="text-xs font-medium">Cargando pasaje bíblico...</span>
            </div>
          )}

          {error && !loading && (
            <div className="text-center py-4">
              <p className="text-xs text-red-600 dark:text-red-400">{error}</p>
            </div>
          )}

          {!loading && !error && verseText && (
            <div className="space-y-3">
              <p className="text-base sm:text-lg leading-relaxed text-slate-800 dark:text-slate-100 font-theology-serif italic">
                "{verseText}"
              </p>
              <p className="text-right text-xs font-semibold text-blue-700 dark:text-blue-400">
                — {reference} (
                {fromApi
                  ? selectedVersion === 'rvr60' ? 'Reina-Valera 1909' : 'Biblia en español sencillo'
                  : TRANSLATIONS.find((t) => t.id === selectedVersion)?.fullName}
                )
              </p>
              {fromApi && selectedVersion === 'rvr60' && (
                <p className="text-xs text-amber-700 dark:text-amber-400">
                  Este texto es de la RVR 1909. Para la Reina-Valera 1960 abrí el enlace de abajo.
                </p>
              )}
            </div>
          )}
        </div>

        {/* Pie con atajo */}
        <div className="shrink-0 flex-wrap gap-2 px-4 sm:px-6 py-3 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900 flex items-center justify-between text-xs text-slate-400 dark:text-slate-500">
          {rvr1960Url(reference) ? (
            <a
              href={rvr1960Url(reference)!}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 dark:text-blue-400 font-semibold hover:underline flex items-center gap-1"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              Ver en RVR 1960
            </a>
          ) : (
            <span>Toca fuera o presiona ESC para cerrar</span>
          )}
          <button
            onClick={handleCopy}
            className="text-blue-600 dark:text-blue-400 font-medium hover:underline flex items-center gap-1 cursor-pointer"
          >
            {copied ? '¡Copiado!' : 'Copiar pasaje'}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};
