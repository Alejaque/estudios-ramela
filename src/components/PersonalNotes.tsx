import React, { useState, useEffect, useRef } from 'react';
import { PenLine, Save, Check, Copy, Trash2, Clock, Sparkles } from 'lucide-react';

interface PersonalNotesProps {
  passageOrTopic: string;
}

export const PersonalNotes: React.FC<PersonalNotesProps> = ({ passageOrTopic }) => {
  const [noteText, setNoteText] = useState('');
  const [lastSavedTime, setLastSavedTime] = useState<string | null>(null);
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'unsaved'>('saved');
  const [copied, setCopied] = useState(false);
  const saveTimeoutRef = useRef<number | null>(null);

  // Storage key helper: normalized passage
  const storageKey = `biblical_notes_${passageOrTopic.trim().toLowerCase()}`;

  // Load note whenever passageOrTopic changes
  useEffect(() => {
    try {
      const savedRaw = localStorage.getItem(storageKey);
      if (savedRaw) {
        const parsed = JSON.parse(savedRaw);
        setNoteText(parsed.text || '');
        setLastSavedTime(parsed.updatedAt || null);
        setSaveStatus('saved');
      } else {
        setNoteText('');
        setLastSavedTime(null);
        setSaveStatus('saved');
      }
    } catch {
      // If legacy plain text was stored
      const rawText = localStorage.getItem(storageKey);
      setNoteText(rawText || '');
      setLastSavedTime(null);
      setSaveStatus('saved');
    }
  }, [passageOrTopic, storageKey]);

  // Persist note to localStorage
  const saveNoteToStorage = (textToSave: string) => {
    const timestamp = new Date().toISOString();
    try {
      if (!textToSave.trim()) {
        localStorage.removeItem(storageKey);
        setLastSavedTime(null);
      } else {
        localStorage.setItem(
          storageKey,
          JSON.stringify({
            text: textToSave,
            updatedAt: timestamp,
            passage: passageOrTopic,
          })
        );
        setLastSavedTime(timestamp);
      }
      setSaveStatus('saved');
    } catch (err) {
      console.error('Error saving personal note:', err);
    }
  };

  // Handle user typing with auto-save debounce (800ms)
  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newText = e.target.value;
    setNoteText(newText);
    setSaveStatus('unsaved');

    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    setSaveStatus('saving');
    saveTimeoutRef.current = window.setTimeout(() => {
      saveNoteToStorage(newText);
    }, 800);
  };

  // Manual save trigger
  const handleManualSave = () => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    saveNoteToStorage(noteText);
  };

  // Copy to clipboard
  const handleCopy = async () => {
    if (!noteText) return;
    try {
      await navigator.clipboard.writeText(
        `Notas de estudio para ${passageOrTopic}:\n\n${noteText}`
      );
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {
      console.error('Could not copy notes:', e);
    }
  };

  // Clear note
  const handleClear = () => {
    if (!noteText.trim()) return;
    if (window.confirm(`¿Deseas borrar tus notas personales para "${passageOrTopic}"?`)) {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
      setNoteText('');
      setLastSavedTime(null);
      setSaveStatus('saved');
      try {
        localStorage.removeItem(storageKey);
      } catch (e) {
        console.error('Error removing note:', e);
      }
    }
  };

  // Quick insertion helpers
  const handleInsertSnippet = (snippet: string) => {
    const updated = noteText ? `${noteText}\n\n${snippet}` : snippet;
    setNoteText(updated);
    saveNoteToStorage(updated);
  };

  const wordCount = noteText.trim() ? noteText.trim().split(/\s+/).length : 0;

  return (
    <div className="mt-8 bg-white dark:bg-slate-900 rounded-2xl border border-amber-200/80 dark:border-amber-900/40 shadow-sm overflow-hidden transition-colors">
      {/* Header Bar */}
      <div className="px-5 sm:px-6 py-4 bg-amber-50/60 dark:bg-amber-950/20 border-b border-amber-100 dark:border-amber-900/30 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-amber-500/10 text-amber-700 dark:text-amber-400">
            <PenLine className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 font-theology-serif flex items-center gap-2">
              Notas Personales & Reflexiones Pastorales
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-400">
              Apuntes específicos para <span className="font-semibold text-amber-800 dark:text-amber-300">{passageOrTopic}</span> guardados en tu dispositivo.
            </p>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
          {/* Status badge */}
          <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1 mr-1">
            {saveStatus === 'saving' && (
              <span className="text-amber-600 dark:text-amber-400 flex items-center gap-1 animate-pulse">
                <Clock className="w-3 h-3" /> Guardando...
              </span>
            )}
            {saveStatus === 'saved' && (
              <span className="text-emerald-700 dark:text-emerald-400 flex items-center gap-1">
                <Check className="w-3 h-3" /> Guardado localmente
              </span>
            )}
            {saveStatus === 'unsaved' && (
              <span className="text-slate-400">
                Cambios pendientes
              </span>
            )}
          </div>

          <button
            type="button"
            onClick={handleManualSave}
            title="Guardar notas ahora"
            className="px-2.5 py-1.5 rounded-lg text-xs font-semibold text-slate-700 dark:text-slate-200 hover:text-amber-800 dark:hover:text-amber-300 bg-white dark:bg-slate-800 hover:bg-amber-50 dark:hover:bg-amber-950/40 border border-slate-200 dark:border-slate-700 transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <Save className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
            <span className="hidden sm:inline">Guardar</span>
          </button>

          <button
            type="button"
            onClick={handleCopy}
            disabled={!noteText.trim()}
            title="Copiar notas"
            className="px-2.5 py-1.5 rounded-lg text-xs font-semibold text-slate-700 dark:text-slate-200 hover:text-blue-700 dark:hover:text-blue-300 bg-white dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 transition-all flex items-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                <span className="hidden sm:inline text-emerald-600">Copiado</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
                <span className="hidden sm:inline">Copiar</span>
              </>
            )}
          </button>

          {noteText.trim() && (
            <button
              type="button"
              onClick={handleClear}
              title="Borrar estas notas"
              className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 transition-all cursor-pointer"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Note Area */}
      <div className="p-5 sm:p-6 space-y-3">
        {/* Quick prompt templates */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1 text-xs">
          <span className="text-slate-400 dark:text-slate-500 flex items-center gap-1 shrink-0 text-[11px] font-medium">
            <Sparkles className="w-3 h-3 text-amber-500" />
            Insertar guía rápida:
          </span>
          <button
            type="button"
            onClick={() => handleInsertSnippet('### Ilustración pastoral:\n- ')}
            className="px-2 py-0.5 rounded-md bg-amber-50 dark:bg-amber-950/40 hover:bg-amber-100 dark:hover:bg-amber-900/40 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800/50 text-[11px] font-medium transition-colors cursor-pointer shrink-0"
          >
            + Ilustración
          </button>
          <button
            type="button"
            onClick={() => handleInsertSnippet('### Pregunta de aplicación congregacional:\n- ¿De qué manera este pasaje desafía...?')}
            className="px-2 py-0.5 rounded-md bg-blue-50 dark:bg-blue-950/40 hover:bg-blue-100 dark:hover:bg-blue-900/40 text-blue-800 dark:text-blue-300 border border-blue-200 dark:border-blue-800/50 text-[11px] font-medium transition-colors cursor-pointer shrink-0"
          >
            + Pregunta congregacional
          </button>
          <button
            type="button"
            onClick={() => handleInsertSnippet('### Cita teológica complementaria:\n> "..." ')}
            className="px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/50 text-[11px] font-medium transition-colors cursor-pointer shrink-0"
          >
            + Cita teológica
          </button>
          <button
            type="button"
            onClick={() => handleInsertSnippet('### Compromiso o llamado pastoral:\n- ')}
            className="px-2 py-0.5 rounded-md bg-purple-50 dark:bg-purple-950/40 hover:bg-purple-100 dark:hover:bg-purple-900/40 text-purple-800 dark:text-purple-300 border border-purple-200 dark:border-purple-800/50 text-[11px] font-medium transition-colors cursor-pointer shrink-0"
          >
            + Llamado pastoral
          </button>
        </div>

        <textarea
          id="personal-study-notes"
          value={noteText}
          onChange={handleChange}
          rows={6}
          placeholder={`Escribe aquí tus reflexiones personales sobre ${passageOrTopic}, anécdotas, aplicaciones para tu iglesia local, notas de consejería o puntos a enfatizar en el sermón...`}
          className="w-full p-4 rounded-xl border border-slate-300 dark:border-slate-700 focus:border-amber-500 dark:focus:border-amber-400 focus:ring-2 focus:ring-amber-100 dark:focus:ring-amber-950/50 outline-none text-slate-800 dark:text-slate-100 text-sm leading-relaxed placeholder:text-slate-400 dark:placeholder:text-slate-500 bg-slate-50/40 dark:bg-slate-800/50 focus:bg-white dark:focus:bg-slate-800 transition-all font-sans resize-y"
        />

        {/* Footer info */}
        <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 pt-1">
          <div className="flex items-center gap-3">
            <span>{wordCount} {wordCount === 1 ? 'palabra' : 'palabras'}</span>
            <span>•</span>
            <span>{noteText.length} caracteres</span>
          </div>

          {lastSavedTime && (
            <span className="text-[11px] text-slate-400 dark:text-slate-500">
              Última actualización: {new Date(lastSavedTime).toLocaleDateString('es-ES', {
                hour: '2-digit',
                minute: '2-digit',
                day: 'numeric',
                month: 'short',
              })}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
