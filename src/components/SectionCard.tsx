import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Copy, Check, BookOpen, FileText, Sprout, Target, Sparkles } from 'lucide-react';
import { BibleVerseModal } from './BibleVerseModal';

interface SectionCardProps {
  id: string;
  sectionNumber: 1 | 2 | 3 | 4;
  title: string;
  subtitle: string;
  content: string;
  iconName: 'book' | 'file' | 'sprout' | 'target';
  accentColor: 'blue' | 'indigo' | 'emerald' | 'amber';
  fontFamily?: 'serif' | 'sans';
  fontSize?: number;
}

export const SectionCard: React.FC<SectionCardProps> = ({
  id,
  sectionNumber,
  title,
  subtitle,
  content,
  iconName,
  accentColor,
  fontFamily = 'serif',
  fontSize = 16,
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
      border: 'border-blue-200/90 dark:border-blue-900/60',
      headerBg: 'bg-gradient-to-r from-blue-50/90 via-indigo-50/40 to-transparent dark:from-blue-950/40 dark:via-slate-900 dark:to-slate-900',
      badge: 'bg-blue-600 text-white',
      iconBox: 'bg-blue-600/10 text-blue-700 dark:text-blue-400',
      indicator: 'bg-blue-600',
    },
    indigo: {
      border: 'border-indigo-200/90 dark:border-indigo-900/60',
      headerBg: 'bg-gradient-to-r from-indigo-50/90 via-purple-50/40 to-transparent dark:from-indigo-950/40 dark:via-slate-900 dark:to-slate-900',
      badge: 'bg-indigo-600 text-white',
      iconBox: 'bg-indigo-600/10 text-indigo-700 dark:text-indigo-400',
      indicator: 'bg-indigo-600',
    },
    emerald: {
      border: 'border-emerald-200/90 dark:border-emerald-900/60',
      headerBg: 'bg-gradient-to-r from-emerald-50/90 via-teal-50/40 to-transparent dark:from-emerald-950/40 dark:via-slate-900 dark:to-slate-900',
      badge: 'bg-emerald-600 text-white',
      iconBox: 'bg-emerald-600/10 text-emerald-700 dark:text-emerald-400',
      indicator: 'bg-emerald-600',
    },
    amber: {
      border: 'border-amber-200/90 dark:border-amber-900/60',
      headerBg: 'bg-gradient-to-r from-amber-50/90 via-orange-50/40 to-transparent dark:from-amber-950/40 dark:via-slate-900 dark:to-slate-900',
      badge: 'bg-amber-600 text-white',
      iconBox: 'bg-amber-600/10 text-amber-700 dark:text-amber-400',
      indicator: 'bg-amber-600',
    },
  }[accentColor];

  const cleanContent = content
    .replace(/^###?\s*(?:[1-4][.)]\s*)?[📖📝🌱🎯\s]*.*?\n+/i, '')
    .trim();

  // Bold text as clickable Bible verse
  const BoldAsVerse = ({ children }: { children?: React.ReactNode }) => {
    const text = String(children ?? '');
    const verseRegex = /^([1-3]?\s?[A-Za-záéíóúüñÁÉÍÓÚÜÑ]+\.?\s\d+[:\d,\-\s]*)/;
    if (verseRegex.test(text.trim())) {
      return (
        <strong
          className="cursor-pointer text-blue-700 dark:text-blue-400 underline decoration-dotted decoration-blue-400 hover:text-blue-900 dark:hover:text-blue-200 transition-colors inline-flex items-center gap-1 group"
          onClick={() => setVerseRef(text.trim())}
          title="Tocar para leer el pasaje bíblico completo"
        >
          <span>{children}</span>
          <span className="text-[10px] font-normal opacity-0 group-hover:opacity-100 transition-opacity bg-blue-100 dark:bg-blue-900 px-1 rounded">
            leer 📖
          </span>
        </strong>
      );
    }
    return <strong className="font-semibold text-slate-900 dark:text-slate-100">{children}</strong>;
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
        className={`bg-white dark:bg-slate-900 rounded-3xl border ${colorStyles.border} shadow-sm mb-6 overflow-hidden transition-all`}
      >
        {/* Card Header */}
        <div className={`px-5 sm:px-7 py-4 ${colorStyles.headerBg} border-b ${colorStyles.border} flex items-center justify-between gap-3`}>
          <div className="flex items-center gap-3.5">
            <div className={`w-10 h-10 rounded-2xl ${colorStyles.iconBox} shadow-xs flex items-center justify-center shrink-0 border border-white/50 dark:border-slate-800`}>
              {getIcon()}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider ${colorStyles.badge}`}>
                  Sección {sectionNumber}
                </span>
                <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100 font-theology-serif tracking-tight">
                  {title}
                </h3>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400 font-medium mt-0.5">
                {subtitle}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleCopy}
            title="Copiar contenido de esta sección"
            className="p-2 sm:px-3 sm:py-1.5 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 hover:text-slate-900 dark:hover:text-white bg-white/90 dark:bg-slate-800 hover:bg-white dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 shadow-xs flex items-center gap-1.5 transition-all cursor-pointer"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <span className="hidden sm:inline text-emerald-700 dark:text-emerald-300 font-bold">Copiado</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
                <span className="hidden sm:inline">Copiar sección</span>
              </>
            )}
          </button>
        </div>

        {/* Card Body */}
        <div
          className="p-5 sm:p-7"
          style={{
            fontSize: `${fontSize}px`,
          }}
        >
          <div
            className={`markdown-theology prose prose-slate dark:prose-invert max-w-none leading-relaxed ${
              fontFamily === 'serif' ? 'font-theology-serif' : 'font-sans'
            }`}
          >
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
