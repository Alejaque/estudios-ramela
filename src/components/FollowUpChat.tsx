import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import {
  Send,
  MessageSquare,
  Clock,
  Users,
  Lightbulb,
  Languages,
  Check,
  Copy,
  Trash2,
  HelpCircle,
  Sparkles,
} from 'lucide-react';
import { ChatMessage } from '../types';

interface FollowUpChatProps {
  messages: ChatMessage[];
  onSendMessage: (text: string) => void;
  isLoading: boolean;
  onClearChat?: () => void;
}

const QUICK_PROMPTS = [
  {
    icon: Languages,
    label: 'Profundizar en Griego/Hebreo',
    text: 'Por favor, profundiza en el análisis gramatical y morfológico de las palabras clave en los idiomas originales de este pasaje, explicando cómo enriquecen la exégesis pastoral.',
  },
  {
    icon: Clock,
    label: 'Adaptar a Prédica de 20 min',
    text: '¿Podrías sintetizar este bosquejo expositivo en una versión concisa y potente de 20 minutos con introducción impactante, 2 o 3 puntos esenciales y aplicación directa?',
  },
  {
    icon: Lightbulb,
    label: '2 Ilustraciones Contemporáneas',
    text: 'Sugiere dos ilustraciones actuales, cotidianas y profundas (una para la introducción y otra para el punto central) que conecten con la congregación de hoy.',
  },
  {
    icon: Users,
    label: 'Preguntas para Grupos en Casa',
    text: 'Genera 4 a 5 preguntas de discusión y discipulado basadas en este estudio para una reunión de grupo pequeño o célula, enfocadas en la transformación práctica.',
  },
  {
    icon: HelpCircle,
    label: 'Objeciones y Dudas Comunes',
    text: '¿Cuáles son las dudas teológicas u objeciones escépticas más frecuentes que las personas presentan frente a este pasaje y cómo responderlas bíblicamente con gracia y firmeza?',
  },
];

export const FollowUpChat: React.FC<FollowUpChatProps> = ({
  messages,
  onSendMessage,
  isLoading,
  onClearChat,
}) => {
  const [inputText, setInputText] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || isLoading) return;
    onSendMessage(inputText.trim());
    setInputText('');
  };

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/90 dark:border-slate-800 p-5 sm:p-7 mb-6 transition-all shadow-sm">
      {/* Title & Guidance */}
      <div className="flex items-center justify-between gap-2 mb-2">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-blue-600/10 text-blue-700 dark:text-blue-400 flex items-center justify-center">
            <MessageSquare className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100 font-theology-serif leading-tight">
              Interacción Homilética & Consultas al Asistente
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Profundiza en términos, solicita ilustraciones o adapta el sermón a distintos públicos.
            </p>
          </div>
        </div>

        {messages.length > 0 && onClearChat && (
          <button
            type="button"
            onClick={onClearChat}
            title="Limpiar conversación"
            className="text-xs text-slate-400 hover:text-red-500 flex items-center gap-1 transition-colors cursor-pointer px-2 py-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Limpiar chat</span>
          </button>
        )}
      </div>

      {/* Quick Interaction Pills */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 my-4">
        {QUICK_PROMPTS.map((qp, idx) => {
          const Icon = qp.icon;
          return (
            <button
              key={idx}
              type="button"
              onClick={() => onSendMessage(qp.text)}
              disabled={isLoading}
              className="text-left p-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/60 hover:bg-blue-50/60 dark:hover:bg-slate-750 hover:border-blue-300 dark:hover:border-blue-600 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:text-blue-900 dark:hover:text-white transition-all flex items-center gap-2.5 shadow-2xs cursor-pointer disabled:opacity-50"
            >
              <div className="w-7 h-7 rounded-lg bg-blue-600/10 dark:bg-blue-500/20 text-blue-700 dark:text-blue-300 flex items-center justify-center shrink-0">
                <Icon className="w-4 h-4" />
              </div>
              <span className="truncate">{qp.label}</span>
            </button>
          );
        })}
      </div>

      {/* History of follow-up messages */}
      {messages.length > 0 && (
        <div className="space-y-4 mb-4 max-h-[500px] overflow-y-auto pr-1">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`p-4 sm:p-5 rounded-2xl text-sm leading-relaxed transition-all ${
                msg.role === 'user'
                  ? 'bg-blue-600 text-white ml-6 sm:ml-16 shadow-xs'
                  : 'bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 mr-4 sm:mr-12 shadow-xs'
              }`}
            >
              <div className="flex items-center justify-between mb-2 text-xs font-semibold">
                <span className={msg.role === 'user' ? 'text-blue-100' : 'text-blue-700 dark:text-blue-300'}>
                  {msg.role === 'user' ? 'Tú (Líder / Maestro)' : 'Asistente Teológico'}
                </span>
                {msg.role === 'assistant' && (
                  <button
                    type="button"
                    onClick={() => handleCopy(msg.id, msg.content)}
                    className="p-1 hover:text-slate-900 dark:hover:text-white text-slate-400 dark:text-slate-400 rounded cursor-pointer transition-colors"
                    title="Copiar respuesta"
                  >
                    {copiedId === msg.id ? (
                      <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>
                )}
              </div>

              {msg.role === 'user' ? (
                <p className="whitespace-pre-wrap font-sans">{msg.content}</p>
              ) : (
                <div className="markdown-theology prose prose-slate dark:prose-invert max-w-none text-xs sm:text-sm">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {msg.content}
                  </ReactMarkdown>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Follow-up input form */}
      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="Escribe una pregunta o ajuste pastoral para este estudio..."
          disabled={isLoading}
          className="flex-1 px-4 py-3 rounded-2xl border border-slate-300 dark:border-slate-700 focus:border-blue-600 dark:focus:border-blue-400 focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-950 outline-none text-xs sm:text-sm text-slate-900 dark:text-slate-100 bg-slate-50/70 dark:bg-slate-800/80 placeholder:text-slate-400 dark:placeholder:text-slate-500 transition-all font-sans"
        />
        <button
          type="submit"
          disabled={isLoading || !inputText.trim()}
          className="px-5 py-3 rounded-2xl bg-gradient-to-r from-blue-700 to-indigo-700 hover:from-blue-800 hover:to-indigo-800 text-white text-xs sm:text-sm font-bold flex items-center gap-2 disabled:opacity-50 cursor-pointer shadow-xs hover:shadow transition-all shrink-0"
        >
          <Send className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Consultar</span>
        </button>
      </form>
    </div>
  );
};
