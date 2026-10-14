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
  Clock,
  Type,
  Share2,
} from 'lucide-react';
import { SectionCard } from './SectionCard';
import { parseBiblicalStudySections } from '../utils/sectionParser';
import { ensureOutlineTransition } from '../utils/outlineTransition';
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
  const [fontSize, setFontSize] = useState<number>(16);
  const [fontFamily, setFontFamily] = useState<'serif' | 'sans'>('serif');
  const [sharedToast, setSharedToast] = useState(false);

  // Garantiza la "Oración de Transición y Vista Previa" (Punto I, II y III)
  // inmediatamente después de la Proposición, también en bosquejos generados
  // por IA o guardados que aún no la traigan.
  const displayContent = ensureOutlineTransition(content);
  const sections = parseBiblicalStudySections(displayContent);
  const hasParsedSections = Boolean(
    sections.section1 || sections.section2 || sections.section3 || sections.section4
  );

  // Stats
  const wordCount = displayContent.trim() ? displayContent.trim().split(/\s+/).length : 0;
  // Estimate ~120 words per minute for expository preaching
  const estimatedPreachingMinutes = Math.max(1, Math.round(wordCount / 120));

  const handleCopyAll = () => {
    navigator.clipboard.writeText(displayContent);
    setCopiedAll(true);
    setTimeout(() => setCopiedAll(false), 2000);
  };

  const handleShare = async () => {
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({
          title: `Estudio Bíblico: ${passageOrTopic}`,
          text: `Estudio exegético y bosquejo expositivo sobre ${passageOrTopic} - Estudios Alejandro Ramela`,
          url: window.location.href,
        });
      } catch {
        // user cancelled or share failed
      }
    } else {
      navigator.clipboard.writeText(`${passageOrTopic}\n\n${displayContent}`);
      setSharedToast(true);
      setTimeout(() => setSharedToast(false), 2000);
    }
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
        content: displayContent,
        personalNotes,
      });
    } catch (err) {
      console.error('Error generating PDF:', err);
    } finally {
      setIsExportingPdf(false);
    }
  };

  return (
    <div className="space-y-5">
      {/* Top Banner & Control Bar */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/90 dark:border-slate-800 shadow-sm p-4 sm:p-6 transition-all">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center flex-wrap gap-2 mb-1.5">
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300 uppercase tracking-wide">
                Exégesis & Bosquejo
              </span>
              <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                {translation}
              </span>
              <span className="text-slate-300 dark:text-slate-700">•</span>
              <span className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-amber-500" />
                <span>~{estimatedPreachingMinutes} min de prédica ({wordCount} palabras)</span>
              </span>
            </div>

            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-slate-100 font-theology-serif tracking-tight">
              {passageOrTopic}
            </h2>
          </div>

          {/* Action buttons & Reading Controls */}
          <div className="flex items-center flex-wrap gap-2">
            {/* Reading font size */}
            <div className="flex items-center rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 p-0.5 text-xs">
              <button
                type="button"
                onClick={() => setFontSize((s) => Math.max(14, s - 1))}
                title="Disminuir tamaño de letra"
                className="px-2 py-1 hover:bg-white dark:hover:bg-slate-700 rounded-lg text-slate-600 dark:text-slate-300 font-semibold cursor-pointer"
              >
                A-
              </button>
              <span className="px-1 text-[11px] text-slate-400">{fontSize}px</span>
              <button
                type="button"
                onClick={() => setFontSize((s) => Math.min(22, s + 1))}
                title="Aumentar tamaño de letra"
                className="px-2 py-1 hover:bg-white dark:hover:bg-slate-700 rounded-lg text-slate-600 dark:text-slate-300 font-semibold cursor-pointer"
              >
                A+
              </button>
            </div>

            {/* Font Family Toggle */}
            <button
              type="button"
              onClick={() => setFontFamily((f) => (f === 'serif' ? 'sans' : 'serif'))}
              title={`Cambiar a fuente ${fontFamily === 'serif' ? 'Sans-serif' : 'Serif Clásica'}`}
              className="px-2.5 py-1.5 rounded-xl text-xs font-semibold bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 flex items-center gap-1 cursor-pointer"
            >
              <Type className="w-3.5 h-3.5 text-slate-500" />
              <span className="hidden sm:inline">{fontFamily === 'serif' ? 'Serif' : 'Sans'}</span>
            </button>

            {/* Save Bookmark */}
            <button
              type="button"
              onClick={onSave}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 border transition-all cursor-pointer ${
                isSaved
                  ? 'bg-emerald-50 dark:bg-emerald-950/80 border-emerald-400 dark:border-emerald-700 text-emerald-800 dark:text-emerald-300 shadow-xs'
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
                  <Bookmark className="w-3.5 h-3.5 text-slate-500" />
                  <span>Guardar</span>
                </>
              )}
            </button>

            {/* Copy All */}
            <button
              type="button"
              onClick={handleCopyAll}
              className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 flex items-center gap-1.5 transition-all cursor-pointer"
            >
              {copiedAll ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  <span className="text-emerald-700 dark:text-emerald-300 font-bold">¡Copiado!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-slate-500" />
                  <span>Copiar Todo</span>
                </>
              )}
            </button>

            {/* Export PDF */}
            <button
              type="button"
              onClick={handleExportPdf}
              disabled={isExportingPdf}
              title="Descargar estudio y bosquejo en PDF formateado para imprimir o predicar"
              className="px-3 py-1.5 rounded-xl text-xs font-bold bg-blue-50 dark:bg-blue-950/80 hover:bg-blue-100 dark:hover:bg-blue-900 border border-blue-200 dark:border-blue-800 text-blue-900 dark:text-blue-200 flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-60"
            >
              <FileDown className="w-3.5 h-3.5 text-blue-700 dark:text-blue-400" />
              <span>{isExportingPdf ? 'Exportando...' : 'PDF'}</span>
            </button>

            {/* Share */}
            <button
              type="button"
              onClick={handleShare}
              title="Compartir bosquejo"
              className="p-2 sm:px-2.5 sm:py-1.5 rounded-xl text-xs font-medium bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 flex items-center gap-1 cursor-pointer"
            >
              <Share2 className="w-3.5 h-3.5 text-slate-500" />
              <span className="hidden md:inline">{sharedToast ? '¡Copiado!' : 'Compartir'}</span>
            </button>

            {/* Modo Púlpito */}
            <button
              type="button"
              onClick={onOpenPulpit}
              title="Abrir teleprompter / atril para predicar en la iglesia"
              className="px-3 py-1.5 rounded-xl text-xs font-bold bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white shadow-xs hover:shadow flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <Maximize2 className="w-3.5 h-3.5 text-amber-300" />
              <span>Modo Púlpito</span>
            </button>
          </div>
        </div>
      </div>

      {/* 4 Interactive Section Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
        <button
          type="button"
          onClick={() => setActiveTab('all')}
          className={`px-3.5 py-2.5 rounded-2xl text-xs font-bold flex items-center gap-2 transition-all shrink-0 cursor-pointer ${
            activeTab === 'all'
              ? 'bg-slate-900 dark:bg-blue-600 text-white shadow-sm ring-2 ring-slate-900/10'
              : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200/90 dark:border-slate-800'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>Vista Completa (4 Secciones)</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('1')}
          className={`px-3.5 py-2.5 rounded-2xl text-xs font-bold flex items-center gap-2 transition-all shrink-0 cursor-pointer ${
            activeTab === '1'
              ? 'bg-blue-700 text-white shadow-sm ring-2 ring-blue-700/20'
              : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-blue-50/50 dark:hover:bg-slate-800 border border-slate-200/90 dark:border-slate-800'
          }`}
        >
          <BookOpen className="w-3.5 h-3.5 text-blue-400" />
          <span>1. 📖 Contexto & Exégesis</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('2')}
          className={`px-3.5 py-2.5 rounded-2xl text-xs font-bold flex items-center gap-2 transition-all shrink-0 cursor-pointer ${
            activeTab === '2'
              ? 'bg-indigo-700 text-white shadow-sm ring-2 ring-indigo-700/20'
              : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-indigo-50/50 dark:hover:bg-slate-800 border border-slate-200/90 dark:border-slate-800'
          }`}
        >
          <FileText className="w-3.5 h-3.5 text-indigo-400" />
          <span>2. 📝 Bosquejo Expositivo</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('3')}
          className={`px-3.5 py-2.5 rounded-2xl text-xs font-bold flex items-center gap-2 transition-all shrink-0 cursor-pointer ${
            activeTab === '3'
              ? 'bg-emerald-700 text-white shadow-sm ring-2 ring-emerald-700/20'
              : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-emerald-50/50 dark:hover:bg-slate-800 border border-slate-200/90 dark:border-slate-800'
          }`}
        >
          <Sprout className="w-3.5 h-3.5 text-emerald-400" />
          <span>3. 🌱 Aplicación Práctica</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('4')}
          className={`px-3.5 py-2.5 rounded-2xl text-xs font-bold flex items-center gap-2 transition-all shrink-0 cursor-pointer ${
            activeTab === '4'
              ? 'bg-amber-700 text-white shadow-sm ring-2 ring-amber-700/20'
              : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-amber-50/50 dark:hover:bg-slate-800 border border-slate-200/90 dark:border-slate-800'
          }`}
        >
          <Target className="w-3.5 h-3.5 text-amber-400" />
          <span>4. 🎯 Llamado a la Acción</span>
        </button>
      </div>

      {/* Streaming indicator */}
      {isStreaming && (
        <div className="p-4 bg-blue-50/90 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-900 rounded-2xl flex items-center gap-3 text-xs sm:text-sm text-blue-900 dark:text-blue-300 font-semibold animate-pulse">
          <div className="w-3 h-3 rounded-full bg-blue-600 dark:bg-blue-400 animate-ping" />
          <span>El asistente está estructurando el análisis exegético y homilético...</span>
        </div>
      )}

      {/* Study Content Body */}
      {hasParsedSections ? (
        <div>
          {sections.preamble && (
            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/90 dark:border-slate-800 p-5 sm:p-6 mb-5 text-sm text-slate-700 dark:text-slate-200">
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
              fontFamily={fontFamily}
              fontSize={fontSize}
            />
          )}

          {/* Section 2 */}
          {(activeTab === 'all' || activeTab === '2') && sections.section2 && (
            <SectionCard
              id="seccion-2-bosquejo"
              sectionNumber={2}
              title="Bosquejo Expositivo (Sencillo y Profundo)"
              subtitle="Introducción, Proposición (Gran Idea), Oración de Transición y Vista Previa (Punto I, II y III), Desarrollo homilético y Reflexión Teológica"
              content={sections.section2}
              iconName="file"
              accentColor="indigo"
              fontFamily={fontFamily}
              fontSize={fontSize}
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
              fontFamily={fontFamily}
              fontSize={fontSize}
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
              fontFamily={fontFamily}
              fontSize={fontSize}
            />
          )}
        </div>
      ) : (
        /* Fallback if headers were not parsed or during live initial streaming */
        <div
          className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/90 dark:border-slate-800 p-5 sm:p-7 shadow-xs"
          style={{ fontSize: `${fontSize}px` }}
        >
          <div
            className={`markdown-theology prose prose-slate dark:prose-invert max-w-none leading-relaxed ${
              fontFamily === 'serif' ? 'font-theology-serif' : 'font-sans'
            }`}
          >
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {displayContent}
            </ReactMarkdown>
          </div>
        </div>
      )}
    </div>
  );
};
