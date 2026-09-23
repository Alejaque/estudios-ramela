import React, { useState } from 'react';
import { Search, Sparkles, BookOpen, History, Trash2 } from 'lucide-react';
import { QUICK_SUGGESTIONS } from '../data/sampleStudies';
import { RecentSearch } from '../types';

interface StudyInputProps {
  onStudy: (passageOrTopic: string, translation: string) => void;
  isLoading: boolean;
  activePassage: string;
  recentSearches: RecentSearch[];
  onClearRecent: () => void;
}

export const StudyInput: React.FC<StudyInputProps> = ({
  onStudy,
  isLoading,
  activePassage,
  recentSearches,
  onClearRecent,
}) => {
  const [inputVal, setInputVal] = useState('');
  const [translation, setTranslation] = useState('Reina-Valera 1960 (RVR1960)');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputVal.trim() || isLoading) return;
    onStudy(inputVal.trim(), translation);
  };

  const handleSelectQuick = (passage: string) => {
    setInputVal(passage);
    onStudy(passage, translation);
  };

  const handleSelectRecent = (recent: RecentSearch) => {
    setInputVal(recent.passageOrTopic);
    const chosenTr = recent.translation || translation;
    if (recent.translation) {
      setTranslation(recent.translation);
    }
    onStudy(recent.passageOrTopic, chosenTr);
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-4 sm:p-6 mb-6 transition-colors">
      <div className="mb-3">
        <label
          htmlFor="biblical-input"
          className="block text-sm font-semibold text-slate-900 dark:text-slate-100 mb-1.5 flex items-center justify-between"
        >
          <span className="flex items-center gap-1.5">
            <Search className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            Pasaje Bíblico o Tema Doctrinal/Expositivo
          </span>
          <span className="text-xs font-normal text-slate-500 dark:text-slate-400 hidden sm:inline">
            Ej: <em>Efesios 2:8-10</em> o <em>La soberanía de Dios en la aflicción</em>
          </span>
        </label>

        <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-2.5">
          <div className="relative flex-1">
            <input
              id="biblical-input"
              type="text"
              value={inputVal}
              onChange={(e) => setInputVal(e.target.value)}
              placeholder="Escribe el pasaje (ej. Romanos 8:28-30, Salmo 1) o un tema teológico..."
              disabled={isLoading}
              className="w-full pl-4 pr-10 py-3 rounded-xl border border-slate-300 dark:border-slate-700 focus:border-blue-600 dark:focus:border-blue-400 focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-950 outline-none text-slate-800 dark:text-slate-100 text-sm sm:text-base placeholder:text-slate-400 dark:placeholder:text-slate-500 transition-all font-sans bg-slate-50/50 dark:bg-slate-800/60 focus:bg-white dark:focus:bg-slate-800"
            />
            {inputVal && !isLoading && (
              <button
                type="button"
                onClick={() => setInputVal('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-xs px-1.5 py-0.5 rounded cursor-pointer"
              >
                ✕
              </button>
            )}
          </div>

          <div className="flex gap-2">
            <select
              value={translation}
              onChange={(e) => setTranslation(e.target.value)}
              disabled={isLoading}
              className="px-3 py-3 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 bg-slate-50/50 dark:bg-slate-800/60 text-xs sm:text-sm font-medium focus:border-blue-600 dark:focus:border-blue-400 focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-950 outline-none cursor-pointer"
            >
              <option value="Reina-Valera 1960 (RVR1960)">RVR 1960</option>
              <option value="Nueva Biblia de las Américas (NBLA)">NBLA</option>
              <option value="Nueva Versión Internacional (NVI)">NVI</option>
              <option value="La Biblia de las Américas (LBLA)">LBLA</option>
              <option value="Dios Habla Hoy (DHH)">DHH</option>
            </select>

            <button
              id="btn-generar-estudio"
              type="submit"
              disabled={isLoading || !inputVal.trim()}
              className="px-5 py-3 rounded-xl font-semibold text-xs sm:text-sm text-white bg-gradient-to-r from-blue-700 to-indigo-800 hover:from-blue-800 hover:to-indigo-900 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:shadow transition-all flex items-center justify-center gap-2 shrink-0 cursor-pointer"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Estudiando...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-amber-300" />
                  <span>Iniciar Exégesis</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Historial Reciente (Últimos 5 pasajes consultados) */}
      {recentSearches && recentSearches.length > 0 && (
        <div className="pt-3 border-t border-slate-100 dark:border-slate-800 mb-2">
          <div className="flex items-center justify-between gap-2 mb-1.5">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-blue-800 dark:text-blue-300">
              <History className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
              <span>Historial reciente (últimos {recentSearches.length}):</span>
            </div>
            <button
              type="button"
              onClick={onClearRecent}
              title="Borrar historial reciente"
              className="text-[11px] text-slate-400 dark:text-slate-500 hover:text-red-600 dark:hover:text-red-400 flex items-center gap-1 transition-colors cursor-pointer"
            >
              <Trash2 className="w-3 h-3" />
              <span>Limpiar</span>
            </button>
          </div>
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
            {recentSearches.map((item, idx) => {
              const isActive = activePassage.trim().toLowerCase() === item.passageOrTopic.trim().toLowerCase();
              return (
                <button
                  key={`${item.passageOrTopic}-${idx}`}
                  type="button"
                  onClick={() => handleSelectRecent(item)}
                  disabled={isLoading}
                  title={`Cargar ${item.passageOrTopic} (${item.translation || 'RVR 1960'})`}
                  className={`text-xs px-2.5 py-1 rounded-lg border font-medium transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                    isActive
                      ? 'bg-blue-600 text-white border-blue-600 shadow-2xs font-semibold'
                      : 'bg-slate-100/90 dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-slate-750 border-slate-200 dark:border-slate-700/80 text-slate-700 dark:text-slate-200 hover:text-blue-800 dark:hover:text-blue-300'
                  }`}
                >
                  <History className={`w-3 h-3 ${isActive ? 'text-white' : 'text-slate-400 dark:text-slate-500'}`} />
                  <span>{item.passageOrTopic}</span>
                  {item.translation && (
                    <span
                      className={`text-[10px] px-1 py-0.2 rounded font-normal ${
                        isActive
                          ? 'bg-blue-700 text-blue-100'
                          : 'bg-slate-200/80 dark:bg-slate-700 text-slate-500 dark:text-slate-400'
                      }`}
                    >
                      {item.translation.split(' ')[0]}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Sugerencias Rápidas */}
      <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
        <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-1 shrink-0">
          <BookOpen className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
          Sugerencias canónicas:
        </span>
        <div className="flex items-center gap-1.5 shrink-0">
          {QUICK_SUGGESTIONS.map((item) => {
            const isActive = activePassage.toLowerCase().includes(item.passage.toLowerCase());
            return (
              <button
                key={item.passage}
                type="button"
                onClick={() => handleSelectQuick(item.passage)}
                disabled={isLoading}
                className={`text-xs px-2.5 py-1 rounded-lg border font-medium transition-all flex items-center gap-1 cursor-pointer whitespace-nowrap ${
                  isActive
                    ? 'bg-blue-50 dark:bg-blue-950/80 border-blue-300 dark:border-blue-700 text-blue-800 dark:text-blue-300 shadow-xs'
                    : 'bg-slate-50 dark:bg-slate-800/80 hover:bg-slate-100 dark:hover:bg-slate-800 border-slate-200/80 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <span>{item.passage}</span>
                <span className="text-[10px] opacity-70">({item.title})</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
