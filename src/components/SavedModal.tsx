import React from 'react';
import { X, Trash2, ExternalLink, Download, FileText, Calendar, BookOpen } from 'lucide-react';
import { SavedStudy } from '../types';

interface SavedModalProps {
  isOpen: boolean;
  onClose: () => void;
  savedStudies: SavedStudy[];
  onSelectStudy: (study: SavedStudy) => void;
  onDeleteStudy: (id: string) => void;
}

export const SavedModal: React.FC<SavedModalProps> = ({
  isOpen,
  onClose,
  savedStudies,
  onSelectStudy,
  onDeleteStudy,
}) => {
  if (!isOpen) return null;

  const handleDownloadAll = () => {
    const jsonStr = JSON.stringify(savedStudies, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `estudios-biblicos-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6 animate-fade-in">
      <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-2xl w-full max-h-[85vh] flex flex-col shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/60">
          <div className="flex items-center gap-2.5">
            <BookOpen className="w-5 h-5 text-blue-700 dark:text-blue-400" />
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 font-theology-serif">
              Mis Bosquejos y Estudios Guardados ({savedStudies.length})
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto flex-1 space-y-3">
          {savedStudies.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
              <p className="text-sm font-medium text-slate-600 dark:text-slate-300">Aún no has guardado ningún bosquejo.</p>
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                Haz clic en el botón "Guardar Bosquejo" en cualquier estudio generado.
              </p>
            </div>
          ) : (
            savedStudies.map((study) => (
              <div
                key={study.id}
                className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-blue-300 dark:hover:border-blue-700 bg-white dark:bg-slate-800/60 hover:bg-blue-50/20 dark:hover:bg-slate-800 transition-all flex items-start justify-between gap-4"
              >
                <div className="flex-1 cursor-pointer" onClick={() => onSelectStudy(study)}>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-bold text-sm sm:text-base text-slate-900 dark:text-slate-100 font-theology-serif hover:text-blue-700 dark:hover:text-blue-400">
                      {study.passageOrTopic}
                    </span>
                    {study.translation && (
                      <span className="text-[11px] px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 font-medium">
                        {study.translation.split(' ')[0]}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 mb-2">
                    {study.content.replace(/[#*`_]/g, '').slice(0, 150)}...
                  </p>
                  <div className="flex items-center gap-2 text-[11px] text-slate-400 dark:text-slate-500">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>{new Date(study.createdAt).toLocaleDateString('es-ES', { dateStyle: 'medium' })}</span>
                  </div>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => onSelectStudy(study)}
                    title="Cargar estudio"
                    className="p-2 rounded-lg text-blue-700 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-slate-700 transition-colors cursor-pointer"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => onDeleteStudy(study.id)}
                    title="Eliminar de guardados"
                    className="p-2 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-slate-50 dark:bg-slate-800/60 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <span className="text-xs text-slate-500 dark:text-slate-400">
            Almacenado localmente en tu dispositivo
          </span>
          {savedStudies.length > 0 && (
            <button
              onClick={handleDownloadAll}
              className="px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-xs font-medium hover:bg-white dark:hover:bg-slate-700 flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              Exportar todo (JSON)
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
