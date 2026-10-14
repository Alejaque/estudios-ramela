import React, { useState } from 'react';
import {
  X,
  Trash2,
  ExternalLink,
  Download,
  Upload,
  FileText,
  Calendar,
  BookOpen,
  Search,
  Sparkles,
} from 'lucide-react';
import { SavedStudy } from '../types';
import { MASTER_CURATED_STUDIES } from '../data/sampleStudies';
import { useModalBackButton } from '../hooks/useModalBackButton';

interface SavedModalProps {
  isOpen: boolean;
  onClose: () => void;
  savedStudies: SavedStudy[];
  onSelectStudy: (study: SavedStudy) => void;
  onDeleteStudy: (id: string) => void;
  onImportStudies?: (studies: SavedStudy[]) => void;
}

export const SavedModal: React.FC<SavedModalProps> = ({
  isOpen,
  onClose,
  savedStudies,
  onSelectStudy,
  onDeleteStudy,
  onImportStudies,
}) => {
  const [searchFilter, setSearchFilter] = useState('');

  // "Atrás" del celular cierra el modal y vuelve al estudio, no sale de la app.
  useModalBackButton(isOpen, onClose);

  if (!isOpen) return null;

  const filteredStudies = savedStudies.filter((s) => {
    const q = searchFilter.toLowerCase().trim();
    if (!q) return true;
    return (
      s.passageOrTopic.toLowerCase().includes(q) ||
      (s.title && s.title.toLowerCase().includes(q)) ||
      s.content.toLowerCase().includes(q)
    );
  });

  const handleDownloadAll = () => {
    const jsonStr = JSON.stringify(savedStudies, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `estudios-alejandro-ramela-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && onImportStudies) {
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const parsed = JSON.parse(event.target?.result as string);
          if (Array.isArray(parsed)) {
            onImportStudies(parsed);
          }
        } catch (err) {
          console.error('Error importing studies:', err);
        }
      };
      reader.readAsText(file);
    }
  };

  const handleLoadMasterCurated = () => {
    if (onImportStudies) {
      const formatted: SavedStudy[] = MASTER_CURATED_STUDIES.map((m) => ({
        id: m.id,
        title: m.title,
        passageOrTopic: m.passageOrTopic,
        content: m.content,
        translation: m.translation,
        createdAt: new Date().toISOString(),
      }));
      onImportStudies(formatted);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6 animate-fade-in">
      <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-2xl w-full max-h-[85vh] flex flex-col shadow-2xl border border-slate-200/90 dark:border-slate-800 overflow-hidden transition-all">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-gradient-to-r from-blue-50/80 to-transparent dark:from-slate-800/80 dark:to-slate-900">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-600/10 text-blue-700 dark:text-blue-400 flex items-center justify-center">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100 font-theology-serif">
                Mis Bosquejos & Estudios Guardados
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {savedStudies.length} {savedStudies.length === 1 ? 'bosquejo guardado' : 'bosquejos guardados'} en este dispositivo
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            title="Cerrar"
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search Bar inside Modal */}
        {savedStudies.length > 0 && (
          <div className="p-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                placeholder="Filtrar por pasaje, tema o palabra clave..."
                className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs sm:text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 outline-none focus:border-blue-500"
              />
            </div>
          </div>
        )}

        {/* Content list */}
        <div className="p-5 sm:p-6 overflow-y-auto flex-1 space-y-3">
          {savedStudies.length === 0 ? (
            <div className="text-center py-10 space-y-4">
              <div className="w-16 h-16 rounded-3xl bg-blue-50 dark:bg-slate-800 text-blue-600 dark:text-blue-400 flex items-center justify-center mx-auto shadow-sm">
                <FileText className="w-8 h-8" />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-700 dark:text-slate-200">
                  Aún no has guardado ningún bosquejo.
                </p>
                <p className="text-xs text-slate-400 dark:text-slate-500 mt-1 max-w-sm mx-auto">
                  Guarda cualquier estudio generado haciendo clic en "Guardar", o carga la biblioteca maestra pre-elaborada.
                </p>
              </div>

              {onImportStudies && (
                <button
                  type="button"
                  onClick={handleLoadMasterCurated}
                  className="px-4 py-2.5 rounded-2xl bg-gradient-to-r from-blue-700 to-indigo-700 hover:from-blue-800 hover:to-indigo-800 text-white text-xs font-bold shadow-md hover:shadow-lg transition-all inline-flex items-center gap-2 cursor-pointer"
                >
                  <Sparkles className="w-4 h-4 text-amber-300" />
                  <span>Cargar 6 Estudios Maestros de Alejandro Ramela</span>
                </button>
              )}
            </div>
          ) : filteredStudies.length === 0 ? (
            <div className="text-center py-8 text-xs text-slate-400">
              No se encontraron estudios que coincidan con "{searchFilter}".
            </div>
          ) : (
            filteredStudies.map((study) => (
              <div
                key={study.id}
                className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-blue-400 dark:hover:border-blue-600 bg-white dark:bg-slate-800/60 hover:bg-blue-50/20 dark:hover:bg-slate-800 transition-all flex items-start justify-between gap-4 shadow-2xs group"
              >
                <div className="flex-1 cursor-pointer" onClick={() => onSelectStudy(study)}>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-bold text-sm sm:text-base text-slate-900 dark:text-slate-100 font-theology-serif group-hover:text-blue-700 dark:group-hover:text-blue-400 transition-colors">
                      {study.passageOrTopic}
                    </span>
                    {study.translation && (
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                        {study.translation.split(' ')[0]}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 mb-2 leading-relaxed">
                    {study.content.replace(/[#*`_>]/g, '').slice(0, 140)}...
                  </p>
                  <div className="flex items-center gap-2 text-[11px] text-slate-400 dark:text-slate-500">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>{new Date(study.createdAt).toLocaleDateString('es-ES', { dateStyle: 'medium' })}</span>
                  </div>
                </div>

                <div className="flex items-center gap-1 shrink-0 self-center">
                  <button
                    onClick={() => onSelectStudy(study)}
                    title="Cargar estudio"
                    className="p-2 rounded-xl text-blue-700 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-slate-700 transition-colors cursor-pointer"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => onDeleteStudy(study.id)}
                    title="Eliminar de guardados"
                    className="p-2 rounded-xl text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer with Backup / Restore */}
        <div className="px-6 py-3.5 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2 text-xs">
          <span className="text-slate-500 dark:text-slate-400 text-[11px]">
            Guardado local en tu navegador
          </span>
          <div className="flex items-center gap-2">
            {onImportStudies && (
              <label className="px-2.5 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-700 flex items-center gap-1 cursor-pointer">
                <Upload className="w-3.5 h-3.5" />
                <span>Importar</span>
                <input
                  type="file"
                  accept=".json"
                  className="hidden"
                  onChange={handleImportFile}
                />
              </label>
            )}
            {savedStudies.length > 0 && (
              <button
                type="button"
                onClick={handleDownloadAll}
                className="px-2.5 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-700 flex items-center gap-1 cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Exportar JSON</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
