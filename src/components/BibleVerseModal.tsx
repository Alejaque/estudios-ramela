import React, { useState, useEffect } from 'react';
import { X, BookOpen, Loader2 } from 'lucide-react';

interface BibleVerseModalProps {
  reference: string;
  onClose: () => void;
}

const TRANSLATIONS = [
  { id: 'RVR1960', label: 'RVR60' },
  { id: 'PDT', label: 'PDT' },
  { id: 'LBLA', label: 'LBLA' },
  { id: 'TLA', label: 'TLA' },
];

export const BibleVerseModal: React.FC<BibleVerseModalProps> = ({ reference, onClose }) => {
  const [translation, setTranslation] = useState('RVR1960');
  const [verseText, setVerseText] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchVerse = async () => {
      setLoading(true);
      setError('');
      setVerseText('');
      try {
        const encoded = encodeURIComponent(reference);
        const res = await fetch(
          `https://bible-api.com/${encoded}?translation=${translation.toLowerCase()}`
        );
        if (!res.ok) throw new Error('No encontrado');
        const data = await res.json();
        setVerseText(data.text || 'Texto no disponible.');
      } catch {
        setError('No se pudo cargar el pasaje. Verificá la referencia o la conexión.');
      } finally {
        setLoading(false);
      }
    };
    fetchVerse();
  }, [reference, translation]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-lg border border-slate-200 dark:border-slate-700 overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 dark:border-slate-700 bg-blue-50 dark:bg-blue-950/40">
          <div className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-blue-700 dark:text-blue-400" />
            <span className="font-bold text-slate-900 dark:text-slate-100 font-theology-serif text-lg">
              {reference}
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5 text-slate-600 dark:text-slate-300" />
          </button>
        </div>

        {/* Translation selector */}
        <div className="flex gap-2 px-5 py-3 border-b border-slate-100 dark:border-slate-800">
          {TRANSLATIONS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTranslation(t.id)}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                translation === t.id
                  ? 'bg-blue-700 text-white'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="px-5 py-5 min-h-[120px] flex items-center justify-center">
          {loading && (
            <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
              <Loader2 className="w-5 h-5 animate-spin" />
              <span className="text-sm">Cargando...</span>
            </div>
          )}
          {error && (
            <p className="text-sm text-red-600 dark:text-red-400 text-center">{error}</p>
          )}
          {!loading && !error && (
            <p className="text-base leading-relaxed text-slate-800 dark:text-slate-100 font-theology-serif italic text-center">
              {verseText}
            </p>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-slate-100 dark:border-slate-800 text-center">
          <span className="text-xs text-slate-400 dark:text-slate-500">
            {translation} · Tocá fuera para cerrar
          </span>
        </div>
      </div>
      {/* Click outside to close */}
      <div className="absolute inset-0 -z-10" onClick={onClose} />
    </div>
  );
};
