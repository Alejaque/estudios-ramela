import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import {
  Bookmark,
  BookmarkCheck,
  Copy,
  Check,
  Maximize2,
  BookOpen,
  FileText,
  Sprout,
  Target,
  Layers,
  FileDown,
} from 'lucide-react';
import { SectionCard } from './SectionCard';
import { parseBiblicalStudySections } from '../utils/sectionParser';
import { exportStudyToPdf } from '../utils/pdfExport';

interface StudyDisplayProps {
  passageOrTopic: string;
  translation: string;
  content: string;
  isStreaming: boolean;
  isSaved: boolean;
  onSave: () => void;
  onOpenPulpit: () => void;
}

export const StudyDisplay: React.FC<StudyDisplayProps> = ({
  passageOrTopic,
  translation,
  content,
  isStreaming,
  isSaved,
  onSave,
  onOpenPulpit,
}) => {
  const [activeTab, setActiveTab] = useState<'all' | '1' | '2' | '3' | '4'>('all');
  const [copiedAll, setCopiedAll] = useState(false);
  const [isExportingPdf, setIsExportingPdf] = useState(false);

  const sections = parseBiblicalStudySections(content);
  const hasParsedSections = Boolean(
    sections.section1 || sections.section2 || sections.section3 || sections.section4
  );

  const handleCopyAll = () => {
    navigator.clipboard.writeText(content);
    setCopiedAll(true);
    setTimeout(() => setCopiedAll(false), 2000);
  };

  const handleExportPdf = () => {
    setIsExportingPdf(true);
    try {
      let personalNotes: string | undefined;
      try {
        const storageKey = `biblical_notes_${passageOrTopic.trim().toLowerCase()}`;
        const savedRaw = localStorage.getItem(storageKey);
        if (savedRaw) {
          const parsed = JSON.parse(savedRaw);
          personalNotes = parsed.text;
        }
      } catch {
        // ignore
      }

      exportStudyToPdf({
        passageOrTopic,
        translation,
        content,
        personalNotes,
      });
    } catch (err) {
      console.error('Error generating PDF:', err);
    } finally {
      setIsExportingPdf(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Top Banner & Control Bar */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-colors">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300 uppercase tracking-wide">
              Estudio Expositivo
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">{translation}</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100 font-theology-serif mt-1">
            {passageOrTopic}
          </h2>
        </div>

        {/* Action buttons */}
        <div className="flex items-center flex-wrap gap-2">
          <button
            type="button"
            onClick={onSave}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 border transition-all cursor-pointer ${
              isSaved
                ? 'bg-emerald-50 dark:bg-emerald-950/80 border-emerald-300 dark:border-emerald-700 text-emerald-800 dark:text-emerald-300'
                : 'bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200'
            }`}
          >
            {isSaved ? (
              <>
                <BookmarkCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <span>Guardado</span>
              </>
            ) : (
              <>
                <Bookmark className="w-3.5 h-3.5" />
                <span>Guardar Bosquejo</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={handleCopyAll}
            className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 flex items-center gap-1.5 transition-all cursor-pointer"
          >
            {copiedAll ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <span className="text-emerald-700 dark:text-emerald-300 font-bold">¡Copiado Todo!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Copiar Todo</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={handleExportPdf}
            disabled={isExportingPdf}
            title="Descargar estudio y bosquejo en PDF para imprimir o llevar al púlpito"
            className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-blue-50 dark:bg-blue-950/80 hover:bg-blue-100 dark:hover:bg-blue-900 border border-blue-200 dark:border-blue-800 text-blue-900 dark:text-blue-200 flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-60"
          >
            <FileDown className="w-3.5 h-3.5 text-blue-700 dark:text-blue-400" />
            <span>{isExportingPdf ? 'Generando...' : 'Exportar PDF'}</span>
          </button>

          <button
            type="button"
            onClick={onOpenPulpit}
            className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-indigo-50 dark:bg-indigo-950/80 hover:bg-indigo-100 dark:hover:bg-indigo-900 border border-indigo-200 dark:border-indigo-800 text-indigo-900 dark:text-indigo-200 flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <Maximize2 className="w-3.5 h-3.5 text-indigo-700 dark:text-indigo-400" />
            <span>Atril / Púlpito</span>
          </button>
        </div>
      </div>

      {/* 4 Interactive Section Filter Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
        <button
          type="button"
          onClick={() => setActiveTab('all')}
          className={`px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all shrink-0 cursor-pointer ${
            activeTab === 'all'
              ? 'bg-slate-900 dark:bg-blue-600 text-white shadow-sm'
              : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>Vista Completa (4 Secciones)</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('1')}
          className={`px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all shrink-0 cursor-pointer ${
            activeTab === '1'
              ? 'bg-blue-700 dark:bg-blue-600 text-white shadow-sm'
              : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-blue-50/50 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800'
          }`}
        >
          <BookOpen className="w-3.5 h-3.5" />
          <span>1. 📖 Contexto & Exégesis</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('2')}
          className={`px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all shrink-0 cursor-pointer ${
            activeTab === '2'
              ? 'bg-indigo-700 dark:bg-indigo-600 text-white shadow-sm'
              : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-indigo-50/50 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800'
          }`}
        >
          <FileText className="w-3.5 h-3.5" />
          <span>2. 📝 Bosquejo Expositivo</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('3')}
          className={`px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all shrink-0 cursor-pointer ${
            activeTab === '3'
              ? 'bg-emerald-700 dark:bg-emerald-600 text-white shadow-sm'
              : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-emerald-50/50 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800'
          }`}
        >
          <Sprout className="w-3.5 h-3.5" />
          <span>3. 🌱 Aplicación Práctica</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('4')}
          className={`px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all shrink-0 cursor-pointer ${
            activeTab === '4'
              ? 'bg-amber-700 dark:bg-amber-600 text-white shadow-sm'
              : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-amber-50/50 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800'
          }`}
        >
          <Target className="w-3.5 h-3.5" />
          <span>4. 🎯 Llamado a la Acción</span>
        </button>
      </div>

      {/* Streaming indicator */}
      {isStreaming && (
        <div className="p-3 bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-900 rounded-xl flex items-center gap-2 text-xs text-blue-800 dark:text-blue-300 font-medium">
          <div className="w-3 h-3 rounded-full bg-blue-600 dark:bg-blue-400 animate-ping" />
          <span>El asistente está redactando el análisis exegético y homilético...</span>
        </div>
      )}

      {/* Study Content Body */}
      {hasParsedSections ? (
        <div>
          {sections.preamble && (
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 sm:p-5 mb-4 text-sm text-slate-700 dark:text-slate-200">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {sections.preamble}
              </ReactMarkdown>
            </div>
          )}

          {/* Section 1 */}
          {(activeTab === 'all' || activeTab === '1') && sections.section1 && (
            <SectionCard
              id="seccion-1-exegesis"
              sectionNumber={1}
              title="Contexto, Exégesis y Lenguas Originales"
              subtitle="Método histórico-gramatical, trasfondo literario, raíces Strong y pasajes paralelos"
              content={sections.section1}
              iconName="book"
              accentColor="blue"
            />
          )}

          {/* Section 2 */}
          {(activeTab === 'all' || activeTab === '2') && sections.section2 && (
            <SectionCard
              id="seccion-2-bosquejo"
              sectionNumber={2}
              title="Bosquejo Expositivo (Sencillo y Profundo)"
              subtitle="Introducción, Proposición (Gran Idea), Desarrollo homilético y Reflexión Teológica"
              content={sections.section2}
              iconName="file"
              accentColor="indigo"
            />
          )}

          {/* Section 3 */}
          {(activeTab === 'all' || activeTab === '3') && sections.section3 && (
            <SectionCard
              id="seccion-3-aplicacion"
              sectionNumber={3}
              title="Aplicación Práctica Cotidiana"
              subtitle="Desafíos reales de la vida cristiana centrados en el Evangelio y la gracia de Cristo"
              content={sections.section3}
              iconName="sprout"
              accentColor="emerald"
            />
          )}

          {/* Section 4 */}
          {(activeTab === 'all' || activeTab === '4') && sections.section4 && (
            <SectionCard
              id="seccion-4-cta"
              sectionNumber={4}
              title="Llamado a la Acción (CTA)"
              subtitle="Pregunta retórica y desafío pastoral para poner por obra inmediatamente durante la semana"
              content={sections.section4}
              iconName="target"
              accentColor="amber"
            />
          )}
        </div>
      ) : (
        /* Fallback if headers were not parsed or during live initial streaming */
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 sm:p-6 shadow-xs">
          <div className="markdown-theology prose prose-slate dark:prose-invert max-w-none text-sm sm:text-base leading-relaxed">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {content}
            </ReactMarkdown>
          </div>
        </div>
      )}
    </div>
  );
};
