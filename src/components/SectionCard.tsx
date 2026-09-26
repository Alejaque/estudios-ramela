import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Copy, Check, BookOpen, FileText, Sprout, Target } from 'lucide-react';
import { BibleVerseModal } from './BibleVerseModal';

interface SectionCardProps {
  id: string;
  sectionNumber: 1 | 2 | 3 | 4;
  title: string;
  subtitle: string;
  content: string;
  iconName: 'book' | 'file' | 'sprout' | 'target';
  accentColor: 'blue' | 'indigo' | 'emerald' | 'amber';
}

export const SectionCard: React.FC<SectionCardProps> = ({
  id,
  sectionNumber,
  title,
  subtitle,
  content,
  iconName,
  accentColor,
}) => {
  const [copied, setCopied] = useState(false);
  const [verseRef, setVerseRef] = useState<string | null>(null);

  const handleCopy = () => {
    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getIcon = () => {
    switch (iconName) {
      case 'book':
        return <BookOpen className="w-5 h-5 text-blue-700 dark:text-blue-400" />;
      case 'file':
        return <FileText className="w-5 h-5 text-indigo-700 dark:text-indigo-400" />;
      case 'sprout':
        return <Sprout className="w-5 h-5 text-emerald-700 dark:text-emerald-400" />;
      case 'target':
        return <Target className="w-5 h-5 text-amber-600 dark:text-amber-400" />;
    }
  };

  const colorStyles = {
    blue: {
      border: 'border-blue-200 dark:border-blue-900/60',
      headerBg: 'bg-gradient-to-r from-blue-50/90 to-blue-100/40 dark:from-blue-950/40 dark:to-slate-900',
      badge: 'bg-blue-600 dark:bg-blue-500 text-white',
      iconBox: 'bg-white/90 dark:bg-slate-800',
    },
    indigo: {
      border: 'border-indigo-200 dark:border-indigo-900/60',
      headerBg: 'bg-gradient-to-r from-indigo-50/90 to-indigo-100/40 dark:from-indigo-950/40 dark:to-slate-900',
      badge: 'bg-indigo-600 dark:bg-indigo-500 text-white',
      iconBox: 'bg-white/90 dark:bg-slate-800',
    },
    emerald: {
      border: 'border-emerald-200 dark:border-emerald-900/60',
      headerBg: 'bg-gradient-to-r from-emerald-50/90 to-emerald-100/40 dark:from-emerald-950/40 dark:to-slate-900',
      badge: 'bg-emerald-600 dark:bg-emerald-500 text-white',
      iconBox: 'bg-white/90 dark:bg-slate-800',
    },
    amber: {
      border: 'border-amber-200 dark:border-amber-900/60',
      headerBg: 'bg-gradient-to-r from-amber-50/90 to-amber-100/40 dark:from-amber-950/40 dark:to-slate-900',
      badge: 'bg-amber-600 dark:bg-amber-500 text-white',
      iconBox: 'bg-white/90 dark:bg-slate-800',
    },
  }[accentColor];

  const cleanContent = content
    .replace(/^###?\s*(?:[1-4][.)]\s*)?[📖📝🌱🎯\s]*.*?\n+/i, '')
    .trim();

  // Componente para renderizar texto en negrita como versículo tocable
  const BoldAsVerse = ({ children }: { children?: React.ReactNode }) => {
    const text = String(children ?? '');
    const verseRegex = /^([1-3]?\s?[A-Za-záéíóúüñÁÉÍÓÚÜÑ]+\.?\s\d+[:\d,\-\s]*)/;
    if (verseRegex.test(text.trim())) {
      return (
        <strong
          className="cursor-pointer text-blue-700 dark:text-blue-400 underline decoration-dotted hover:text-blue-900 dark:hover:text-blue-200 transition-colors"
          onClick={() => setVerseRef(text.trim())}
          title="Tocar para leer el pasaje"
        >
          {children}
        </strong>
      );
    }
    return <strong>{children}</strong>;
  };

  return (
    <>
      {verseRef && (
        <BibleVerseModal
          reference={verseRef}
          onClose={() => setVerseRef(null)}
        />
      )}

      <div
        id={id}
        className={`bg-white dark:bg-slate-900 rounded-2xl border ${colorStyles.border} shadow-xs mb-5 overflow-hidden transition-colors`}
      >
        {/* Card Header */}
        <div className={`px-4 sm:px-6 py-3.5 ${colorStyles.headerBg} border-b ${colorStyles.border} flex items-center justify-between gap-3`}>
          <div className="flex items-center gap-3">
            <div className={`w-8 h-8 rounded-lg ${colorStyles.iconBox} shadow-2xs flex items-center justify-center shrink-0 border border-slate-200/50 dark:border-slate-700/50`}>
              {getIcon()}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className={`text-[11px] font-bold px-1.5 py-0.5 rounded ${colorStyles.badge}`}>
                  SECCIÓN {sectionNumber}
                </span>
                <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100 font-theology-serif tracking-tight">
                  {title}
                </h2>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400 font-medium">
                {subtitle}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleCopy}
            title="Copiar contenido de esta sección"
            className="p-1.5 sm:px-2.5 sm:py-1 rounded-lg text-xs font-medium text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white bg-white/80 dark:bg-slate-800 hover:bg-white dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 shadow-2xs flex items-center gap-1 transition-all cursor-pointer"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <span className="hidden sm:inline text-emerald-700 dark:text-emerald-300 font-semibold">Copiado</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Copiar</span>
              </>
            )}
          </button>
        </div>

        {/* Card Body */}
        <div className="p-4 sm:p-6">
          <div className="markdown-theology prose prose-slate dark:prose-invert max-w-none text-sm sm:text-base leading-relaxed">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{ strong: BoldAsVerse }}
            >
              {cleanContent || content}
            </ReactMarkdown>
          </div>
        </div>
      </div>
    </>
  );
};
