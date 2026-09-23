import React, { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { X, Printer, ZoomIn, ZoomOut, Moon, Sun, PenLine, FileDown } from 'lucide-react';
import { exportStudyToPdf } from '../utils/pdfExport';

interface PulpitModalProps {
  isOpen: boolean;
  onClose: () => void;
  passageOrTopic: string;
  translation?: string;
  content: string;
}

export const PulpitModal: React.FC<PulpitModalProps> = ({
  isOpen,
  onClose,
  passageOrTopic,
  translation,
  content,
}) => {
  const [fontSize, setFontSize] = useState<number>(18);
  const [isDark, setIsDark] = useState<boolean>(false);
  const [personalNote, setPersonalNote] = useState<string>('');

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

  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleExportPdf = () => {
    exportStudyToPdf({
      passageOrTopic,
      translation,
      content,
      personalNotes: personalNote,
    });
  };

  return (
    <div
      className={`fixed inset-0 z-50 flex flex-col ${
        isDark ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'
      }`}
    >
      {/* Top Bar (no print) */}
      <div
        className={`px-4 sm:px-8 py-3.5 border-b flex items-center justify-between no-print ${
          isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
        }`}
      >
        <div className="flex items-center gap-3">
          <span className="text-xs uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-amber-500/20 text-amber-500">
            Atril / Púlpito
          </span>
          <h2 className="text-base sm:text-lg font-bold font-theology-serif truncate max-w-xs sm:max-w-md">
            {passageOrTopic || 'Estudio Bíblico'}
          </h2>
        </div>

        <div className="flex items-center gap-2">
          {/* Zoom controls */}
          <div className="flex items-center rounded-lg border border-slate-300 dark:border-slate-700 overflow-hidden">
            <button
              onClick={() => setFontSize((s) => Math.max(14, s - 2))}
              title="Reducir letra"
              className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <span className="text-xs px-2 font-mono font-medium">{fontSize}px</span>
            <button
              onClick={() => setFontSize((s) => Math.min(28, s + 2))}
              title="Aumentar letra"
              className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
          </div>

          {/* Theme toggle */}
          <button
            onClick={() => setIsDark(!isDark)}
            title="Cambiar tema día/noche"
            className="p-2 rounded-lg border border-slate-300 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-700" />}
          </button>

          {/* Export PDF */}
          <button
            onClick={handleExportPdf}
            title="Descargar PDF para el púlpito"
            className="p-2 rounded-lg border border-slate-300 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors cursor-pointer flex items-center gap-1.5 text-xs font-medium"
          >
            <FileDown className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <span className="hidden md:inline">PDF</span>
          </button>

          {/* Print */}
          <button
            onClick={handlePrint}
            title="Imprimir hoja para el púlpito"
            className="p-2 rounded-lg border border-slate-300 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <Printer className="w-4 h-4" />
          </button>

          {/* Close */}
          <button
            onClick={onClose}
            className="p-2 rounded-lg bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:opacity-80 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Reading Document Container */}
      <div className="flex-1 overflow-y-auto px-4 sm:px-12 md:px-20 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Header info in print or reader */}
          <div className="border-b pb-4 mb-6 border-slate-200 dark:border-slate-800">
            <h1 className="text-2xl sm:text-3xl font-bold font-theology-serif tracking-tight mb-1">
              {passageOrTopic}
            </h1>
            {translation && (
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                Texto base: {translation} • Bosquejo Expositivo Homilético
              </p>
            )}
          </div>

          <div
            className="markdown-theology prose prose-slate dark:prose-invert max-w-none font-theology-serif"
            style={{ fontSize: `${fontSize}px`, lineHeight: 1.8 }}
          >
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {content}
            </ReactMarkdown>
          </div>

          {/* Personal Notes Section in Pulpit View */}
          {personalNote && (
            <div className="mt-10 pt-6 border-t-2 border-amber-300/80 dark:border-amber-800/80 bg-amber-50/50 dark:bg-amber-950/20 p-6 rounded-2xl">
              <h3 className="text-base sm:text-lg font-bold font-theology-serif text-amber-900 dark:text-amber-300 mb-3 flex items-center gap-2">
                <PenLine className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                Notas y Reflexiones Personales del Expositor
              </h3>
              <div className="text-sm sm:text-base text-slate-800 dark:text-slate-200 whitespace-pre-wrap font-sans leading-relaxed">
                {personalNote}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
