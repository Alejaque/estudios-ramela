import React, { useState, useRef, useEffect } from 'react';
import { Search, Sparkles, BookOpen, History, Trash2, X, Compass, ChevronRight } from 'lucide-react';
import { QUICK_SUGGESTIONS } from '../data/sampleStudies';
import { RecentSearch } from '../types';

interface StudyInputProps {
  onStudy: (passageOrTopic: string, translation: string) => void;
  studyStyle: string;
  onStyleChange: (style: string) => void;
  isLoading: boolean;
  activePassage: string;
  recentSearches: RecentSearch[];
  onClearRecent: () => void;
  onRemoveRecentItem?: (passage: string) => void;
}

const COMMON_SUGGESTIONS = [
  'Efesios 2:8-10',
  'Romanos 8:28-30',
  'Salmo 23:1-6',
  'Juan 1:1-14',
  'Mateo 5:1-12',
  'Filipenses 4:4-9',
  'Romanos 12:1-2',
  'Miqueas 6:8',
  'Santiago 1:22-25',
  'Juan 3:16',
  'Salmo 1:1-6',
  'Isaías 53:3-6',
  '2 Timoteo 3:16-17',
  'Gálatas 5:22-23',
  'Mateo 28:18-20',
  'Hebreos 11:1-6',
  '1 Corintios 13:4-8',
  'Proverbios 3:5-6',
  'La Gracia Soberana de Dios',
  'La Justificación por la Fe Sola',
  'La Paz de Dios en la Ansiedad',
  'El Sufrimiento y la Providencia Divina',
  'La Gran Comisión y el Discipulado',
];

const CANONICAL_CATEGORIES = [
  { id: 'destacados', label: '⭐ Destacados' },
  { id: 'evangelios', label: '✝️ Evangelios' },
  { id: 'epistolas', label: '📜 Epístolas' },
  { id: 'salmos', label: '📖 Salmos & Sabiduría' },
  { id: 'temas', label: '💡 Temas Teológicos' },
];

export const StudyInput: React.FC<StudyInputProps> = ({
  onStudy,
  studyStyle,
  onStyleChange,
  isLoading,
  activePassage,
  recentSearches,
  onClearRecent,
  onRemoveRecentItem,
}) => {
  const [inputVal, setInputVal] = useState('');
  const [translation, setTranslation] = useState('Reina-Valera 1960 (RVR1960)');
  const [activeCategory, setActiveCategory] = useState<string>('destacados');
  const [showAutocomplete, setShowAutocomplete] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);

  // Suggestions matching user input
  const filteredSuggestions = inputVal.trim()
    ? COMMON_SUGGESTIONS.filter((s) =>
        s.toLowerCase().includes(inputVal.toLowerCase().trim())
      ).slice(0, 5)
    : [];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputVal.trim() || isLoading) return;
    setShowAutocomplete(false);
    onStudy(inputVal.trim(), translation);
  };

  const handleSelectQuick = (passage: string) => {
    setInputVal(passage);
    setShowAutocomplete(false);
    onStudy(passage, translation);
  };

  const handleSelectRecent = (recent: RecentSearch) => {
    setInputVal(recent.passageOrTopic);
    const chosenTr = recent.translation || translation;
    if (recent.translation) {
      setTranslation(recent.translation);
    }
    setShowAutocomplete(false);
    onStudy(recent.passageOrTopic, chosenTr);
  };

  // Close autocomplete on outside click
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (inputRef.current && !inputRef.current.contains(e.target as Node)) {
        setShowAutocomplete(false);
      }
    };
    document.addEventListener('click', handleOutsideClick);
    return () => document.removeEventListener('click', handleOutsideClick);
  }, []);

  return (
    <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/90 dark:border-slate-800 shadow-sm p-4 sm:p-6 mb-6 transition-all">
      {/* Header with Title and Hint */}
      <div className="mb-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <label
          htmlFor="biblical-input"
          className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2"
        >
          <div className="w-7 h-7 rounded-lg bg-blue-600/10 text-blue-700 dark:text-blue-400 flex items-center justify-center">
            <Search className="w-4 h-4" />
          </div>
          <span>Explorador Bíblico & Homilético</span>
        </label>
        <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
          <span className="hidden sm:inline">Ej: <em className="text-blue-700 dark:text-blue-400 font-medium">Romanos 8:28-30</em> o <em className="text-blue-700 dark:text-blue-400 font-medium">La Gracia Soberana</em></span>
          <span className="hidden md:inline-flex items-center px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[10px] font-mono text-slate-400">
            ↵ Enter
          </span>
        </div>
      </div>

      <label className="mb-3 flex flex-wrap items-center gap-2 text-sm font-semibold text-slate-800 dark:text-slate-200">
        Formato del próximo estudio
        <select
          aria-label="Formato del próximo estudio"
          value={studyStyle}
          onChange={(e) => onStyleChange(e.target.value)}
          disabled={isLoading}
          className="px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
        >
          <option value="continuous">Exposición continua</option>
          <option value="classic">Clásico</option>
        </select>
      </label>
      <p className="mb-3 text-xs text-slate-500 dark:text-slate-400">El formato se aplica al generar un estudio nuevo. No modifica tus bosquejos guardados.</p>

      {/* Main Search Bar Form */}
      <form onSubmit={handleSubmit} className="relative mb-3">
        <div className="flex flex-col sm:flex-row gap-2.5">
          <div className="relative flex-1" ref={inputRef}>
            <input
              id="biblical-input"
              type="text"
              value={inputVal}
              onChange={(e) => {
                setInputVal(e.target.value);
                setShowAutocomplete(true);
              }}
              onFocus={() => setShowAutocomplete(true)}
              placeholder="Escribe un pasaje bíblico o un tema (ej. Efesios 2, Salmo 23, Justificación)..."
              disabled={isLoading}
              className="w-full pl-4 pr-10 py-3.5 rounded-2xl border border-slate-300 dark:border-slate-700 focus:border-blue-600 dark:focus:border-blue-400 focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-950/60 outline-none text-slate-900 dark:text-slate-100 text-sm sm:text-base placeholder:text-slate-400 dark:placeholder:text-slate-500 transition-all font-sans bg-slate-50/70 dark:bg-slate-800/60 focus:bg-white dark:focus:bg-slate-800"
            />
            {inputVal && !isLoading && (
              <button
                type="button"
                onClick={() => {
                  setInputVal('');
                  setShowAutocomplete(false);
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors cursor-pointer"
                title="Borrar texto"
              >
                <X className="w-4 h-4" />
              </button>
            )}

            {/* Smart Autocomplete Dropdown */}
            {showAutocomplete && filteredSuggestions.length > 0 && (
              <div className="absolute left-0 right-0 top-full mt-1.5 z-40 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden py-1 animate-fade-in">
                <div className="px-3 py-1 text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                  Sugerencias canónicas
                </div>
                {filteredSuggestions.map((sug, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => handleSelectQuick(sug)}
                    className="w-full text-left px-3.5 py-2 text-xs sm:text-sm text-slate-700 dark:text-slate-200 hover:bg-blue-50 dark:hover:bg-slate-800 hover:text-blue-700 dark:hover:text-blue-300 flex items-center justify-between transition-colors cursor-pointer"
                  >
                    <span className="flex items-center gap-2">
                      <BookOpen className="w-3.5 h-3.5 text-blue-500" />
                      {sug}
                    </span>
                    <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="flex gap-2">
            <select
              value={translation}
              onChange={(e) => setTranslation(e.target.value)}
              disabled={isLoading}
              title="Seleccionar versión bíblica de preferencia"
              className="px-3 py-3.5 rounded-2xl border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 bg-slate-50/80 dark:bg-slate-800/80 text-xs sm:text-sm font-semibold focus:border-blue-600 dark:focus:border-blue-400 focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-950 outline-none cursor-pointer"
            >
              <option value="Reina-Valera 1960 (RVR1960)">RVR 1960</option>
              <option value="Nueva Versión Internacional (NVI)">NVI</option>
              <option value="Nueva Biblia de las Américas (NBLA)">NBLA</option>
              <option value="La Biblia de las Américas (LBLA)">LBLA</option>
              <option value="Dios Habla Hoy (DHH)">DHH</option>
            </select>

            <button
              id="btn-generar-estudio"
              type="submit"
              disabled={isLoading || !inputVal.trim()}
              className="px-5 py-3.5 rounded-2xl font-bold text-xs sm:text-sm text-white bg-gradient-to-r from-blue-700 via-indigo-700 to-indigo-800 hover:from-blue-800 hover:to-indigo-900 disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 shrink-0 cursor-pointer"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Analizando...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-amber-300" />
                  <span>Estudiar Pasaje</span>
                </>
              )}
            </button>
          </div>
        </div>
      </form>

      {/* Historial Reciente con micro-acciones */}
      {recentSearches && recentSearches.length > 0 && (
        <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80 mb-3">
          <div className="flex items-center justify-between gap-2 mb-2">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700 dark:text-slate-300">
              <History className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
              <span>Consultas recientes:</span>
            </div>
            <button
              type="button"
              onClick={onClearRecent}
              title="Borrar historial reciente"
              className="text-[11px] text-slate-400 dark:text-slate-500 hover:text-red-600 dark:hover:text-red-400 flex items-center gap-1 transition-colors cursor-pointer"
            >
              <Trash2 className="w-3 h-3" />
              <span>Limpiar historial</span>
            </button>
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
            {recentSearches.map((item, idx) => {
              const isActive = activePassage.trim().toLowerCase() === item.passageOrTopic.trim().toLowerCase();
              return (
                <div
                  key={`${item.passageOrTopic}-${idx}`}
                  className="flex items-center shrink-0"
                >
                  <button
                    type="button"
                    onClick={() => handleSelectRecent(item)}
                    disabled={isLoading}
                    title={`Cargar ${item.passageOrTopic}`}
                    className={`text-xs px-3 py-1.5 rounded-xl border font-medium transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                      isActive
                        ? 'bg-blue-600 text-white border-blue-600 shadow-xs font-semibold'
                        : 'bg-slate-100/90 dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-slate-750 border-slate-200/90 dark:border-slate-700/80 text-slate-700 dark:text-slate-200 hover:text-blue-800 dark:hover:text-blue-300'
                    }`}
                  >
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
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Explorador Canónico por Categorías */}
      <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80">
        <div className="flex items-center justify-between gap-2 mb-2">
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-600 dark:text-slate-400">
            <Compass className="w-3.5 h-3.5 text-amber-500" />
            <span>Explorar pasajes canónicos y doctrinales:</span>
          </div>

          {/* Categorías Selector */}
          <div className="flex items-center gap-1 overflow-x-auto no-scrollbar">
            {CANONICAL_CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setActiveCategory(cat.id)}
                className={`text-[11px] px-2.5 py-1 rounded-lg font-semibold transition-all cursor-pointer whitespace-nowrap ${
                  activeCategory === cat.id
                    ? 'bg-blue-600 text-white shadow-2xs'
                    : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* Sugerencias Rápidas según la categoría seleccionada */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1">
          {QUICK_SUGGESTIONS.filter((item) => {
            if (activeCategory === 'destacados') return true;
            if (activeCategory === 'evangelios') return item.passage.startsWith('Mateo') || item.passage.startsWith('Juan') || item.passage.startsWith('Lucas');
            if (activeCategory === 'epistolas') return item.passage.startsWith('Romanos') || item.passage.startsWith('Efesios') || item.passage.startsWith('Filipenses') || item.passage.startsWith('Santiago');
            if (activeCategory === 'salmos') return item.passage.startsWith('Salmo') || item.passage.startsWith('Miqueas') || item.passage.startsWith('Isaías');
            if (activeCategory === 'temas') return true;
            return true;
          }).map((item) => {
            const isActive = activePassage.toLowerCase().includes(item.passage.toLowerCase());
            return (
              <button
                key={item.passage}
                type="button"
                onClick={() => handleSelectQuick(item.passage)}
                disabled={isLoading}
                title={`${item.title} (${item.category})`}
                className={`text-xs px-3 py-1.5 rounded-xl border font-medium transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0 ${
                  isActive
                    ? 'bg-blue-50 dark:bg-blue-950/80 border-blue-400 dark:border-blue-600 text-blue-900 dark:text-blue-200 shadow-xs font-semibold'
                    : 'bg-slate-50/80 dark:bg-slate-800/80 hover:bg-slate-100 dark:hover:bg-slate-800 border-slate-200/80 dark:border-slate-700/80 text-slate-700 dark:text-slate-300 hover:text-blue-900 dark:hover:text-white'
                }`}
              >
                <BookOpen className={`w-3 h-3 ${isActive ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400'}`} />
                <span>{item.passage}</span>
                <span className="text-[10px] opacity-75 font-normal">({item.title.split(' ')[0]}...)</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
