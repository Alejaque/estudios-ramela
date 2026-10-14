import React, { useState, useEffect, useRef } from 'react';
import { PenLine, Save, Check, Copy, Trash2, Clock, Sparkles, Eye, Edit3 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface PersonalNotesProps {
  passageOrTopic: string;
}

export const PersonalNotes: React.FC<PersonalNotesProps> = ({ passageOrTopic }) => {
  const [noteText, setNoteText] = useState('');
  const [lastSavedTime, setLastSavedTime] = useState<string | null>(null);
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'unsaved'>('saved');
  const [copied, setCopied] = useState(false);
  const [isPreview, setIsPreview] = useState(false);
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

  // Handle user typing with auto-save debounce (600ms)
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
    }, 600);
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
        `Notas del Expositor para ${passageOrTopic}:\n\n${noteText}`
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
    <div className="mt-8 bg-white dark:bg-slate-900 rounded-3xl border border-amber-200/90 dark:border-amber-900/40 shadow-sm overflow-hidden transition-all">
      {/* Header Bar */}
      <div className="px-5 sm:px-7 py-4 bg-amber-50/70 dark:bg-amber-950/25 border-b border-amber-100 dark:border-amber-900/30 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-amber-500/15 text-amber-700 dark:text-amber-400 flex items-center justify-center">
            <PenLine className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100 font-theology-serif flex items-center gap-2">
              Notas & Reflexiones del Expositor
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-400">
              Apuntes pastorales para <span className="font-semibold text-amber-800 dark:text-amber-300">{passageOrTopic}</span> guardados en tu dispositivo.
            </p>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
          {/* Status badge */}
          <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1 mr-1">
            {saveStatus === 'saving' && (
              <span className="text-amber-600 dark:text-amber-400 flex items-center gap-1 animate-pulse font-medium">
                <Clock className="w-3 h-3" /> Guardando...
              </span>
            )}
            {saveStatus === 'saved' && (
              <span className="text-emerald-700 dark:text-emerald-400 flex items-center gap-1 font-medium">
                <Check className="w-3 h-3" /> Guardado
              </span>
            )}
            {saveStatus === 'unsaved' && (
              <span className="text-slate-400">
                Cambios pendientes
              </span>
            )}
          </div>

          {/* Toggle Preview / Edit */}
          <button
            type="button"
            onClick={() => setIsPreview(!isPreview)}
            title={isPreview ? "Editar notas" : "Vista previa formateada"}
            className="p-1.5 sm:px-2.5 sm:py-1.5 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 hover:text-amber-800 dark:hover:text-amber-300 bg-white dark:bg-slate-800 hover:bg-amber-50 dark:hover:bg-amber-950/40 border border-slate-200 dark:border-slate-700 transition-all flex items-center gap-1 cursor-pointer"
          >
            {isPreview ? (
              <>
                <Edit3 className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                <span className="hidden sm:inline">Editar</span>
              </>
            ) : (
              <>
                <Eye className="w-3.5 h-3.5 text-slate-500" />
                <span className="hidden sm:inline">Vista Previa</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={handleManualSave}
            title="Guardar notas ahora"
            className="p-1.5 sm:px-2.5 sm:py-1.5 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 hover:text-amber-800 dark:hover:text-amber-300 bg-white dark:bg-slate-800 hover:bg-amber-50 dark:hover:bg-amber-950/40 border border-slate-200 dark:border-slate-700 transition-all flex items-center gap-1 cursor-pointer"
          >
            <Save className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
            <span className="hidden sm:inline">Guardar</span>
          </button>

          <button
            type="button"
            onClick={handleCopy}
            disabled={!noteText.trim()}
            title="Copiar notas"
            className="p-1.5 sm:px-2.5 sm:py-1.5 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 hover:text-blue-700 dark:hover:text-blue-300 bg-white dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 transition-all flex items-center gap-1 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                <span className="hidden sm:inline text-emerald-600">¡Copiado!</span>
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
              className="p-1.5 rounded-xl text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 transition-all cursor-pointer"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Note Area */}
      <div className="p-5 sm:p-7 space-y-3">
        {/* Quick prompt templates */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1 text-xs">
          <span className="text-slate-400 dark:text-slate-500 flex items-center gap-1 shrink-0 text-[11px] font-semibold">
            <Sparkles className="w-3 h-3 text-amber-500" />
            Insertar plantilla:
          </span>
          <button
            type="button"
            onClick={() => handleInsertSnippet('### 💡 Ilustración Pastoral:\n- ')}
            className="px-2.5 py-1 rounded-lg bg-amber-50 dark:bg-amber-950/40 hover:bg-amber-100 dark:hover:bg-amber-900/40 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800/50 text-xs font-semibold transition-colors cursor-pointer shrink-0"
          >
            + Ilustración
          </button>
          <button
            type="button"
            onClick={() => handleInsertSnippet('### ❓ Pregunta de Aplicación para la Iglesia:\n- ¿De qué manera este pasaje desafía nuestra...?')}
            className="px-2.5 py-1 rounded-lg bg-blue-50 dark:bg-blue-950/40 hover:bg-blue-100 dark:hover:bg-blue-900/40 text-blue-800 dark:text-blue-300 border border-blue-200 dark:border-blue-800/50 text-xs font-semibold transition-colors cursor-pointer shrink-0"
          >
            + Pregunta congregacional
          </button>
          <button
            type="button"
            onClick={() => handleInsertSnippet('### 📖 Cita Teológica Complementaria:\n> "..." ')}
            className="px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/50 text-xs font-semibold transition-colors cursor-pointer shrink-0"
          >
            + Cita teológica
          </button>
          <button
            type="button"
            onClick={() => handleInsertSnippet('### 🙏 Oración Final y Desafío de Semana:\n- Señor, concédenos poner por obra...')}
            className="px-2.5 py-1 rounded-lg bg-purple-50 dark:bg-purple-950/40 hover:bg-purple-100 dark:hover:bg-purple-900/40 text-purple-800 dark:text-purple-300 border border-purple-200 dark:border-purple-800/50 text-xs font-semibold transition-colors cursor-pointer shrink-0"
          >
            + Oración pastoral
          </button>
        </div>

        {isPreview ? (
          <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/40 min-h-[140px] prose prose-slate dark:prose-invert max-w-none text-sm">
            {noteText ? (
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {noteText}
              </ReactMarkdown>
            ) : (
              <p className="text-slate-400 italic">No hay notas escritas aún.</p>
            )}
          </div>
        ) : (
          <textarea
            id="personal-study-notes"
            value={noteText}
            onChange={handleChange}
            rows={5}
            placeholder={`Escribe aquí tus reflexiones personales sobre ${passageOrTopic}, anécdotas, ilustraciones para tu congregación o puntos específicos para enfatizar en el sermón...`}
            className="w-full p-4 rounded-2xl border border-slate-300 dark:border-slate-700 focus:border-amber-500 dark:focus:border-amber-400 focus:ring-2 focus:ring-amber-100 dark:focus:ring-amber-950/50 outline-none text-slate-900 dark:text-slate-100 text-sm leading-relaxed placeholder:text-slate-400 dark:placeholder:text-slate-500 bg-slate-50/50 dark:bg-slate-800/50 focus:bg-white dark:focus:bg-slate-800 transition-all font-sans resize-y"
          />
        )}

        {/* Footer info */}
        <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 pt-1">
          <div className="flex items-center gap-2">
            <span>{wordCount} {wordCount === 1 ? 'palabra' : 'palabras'}</span>
            <span>•</span>
            <span>{noteText.length} caracteres</span>
            <span>•</span>
            <span className="text-[11px] text-amber-600 dark:text-amber-400">Incluido en la exportación a PDF y Modo Púlpito</span>
          </div>

          {lastSavedTime && (
            <span className="text-[11px] text-slate-400 dark:text-slate-500 hidden sm:inline">
              Actualizado: {new Date(lastSavedTime).toLocaleDateString('es-ES', {
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
