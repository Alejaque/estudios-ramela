import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Send, MessageSquare, Clock, Users, Lightbulb, Languages, Check, Copy } from 'lucide-react';
import { ChatMessage } from '../types';

interface FollowUpChatProps {
  messages: ChatMessage[];
  onSendMessage: (text: string) => void;
  isLoading: boolean;
}

const QUICK_PROMPTS = [
  {
    icon: Languages,
    label: 'Profundizar en Griego/Hebreo',
    text: 'Por favor, profundiza en el análisis gramatical y morfológico de las palabras clave en los idiomas originales de este pasaje, explicando cómo enriquecen la exégesis.',
  },
  {
    icon: Clock,
    label: 'Adaptar a prédica de 20 min',
    text: '¿Podrías sintetizar este bosquejo expositivo en una versión concisa y potente de 20 minutos para un servicio dominical o entre semana?',
  },
  {
    icon: Lightbulb,
    label: '2 Ilustraciones Contemporáneas',
    text: 'Sugiere dos ilustraciones actuales, cotidianas y profundas (una para la introducción y otra para el punto principal) que conecten con la congregación.',
  },
  {
    icon: Users,
    label: 'Preguntas para Grupos en Casa',
    text: 'Genera 4 a 5 preguntas de discusión y discipulado basadas en este estudio para una reunión de grupo en casa (célula) centradas en la aplicación práctica.',
  },
];

export const FollowUpChat: React.FC<FollowUpChatProps> = ({
  messages,
  onSendMessage,
  isLoading,
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
    <div className="bg-slate-50/80 dark:bg-slate-900/80 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 sm:p-6 mb-6 transition-colors">
      {/* Title & guidance */}
      <div className="flex items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-5 h-5 text-blue-700 dark:text-blue-400" />
          <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-slate-100 font-theology-serif">
            Interacción Homilética y Profundización
          </h3>
        </div>
        <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
          Ajustes, consultas y profundización
        </span>
      </div>

      <p className="text-xs text-slate-600 dark:text-slate-400 mb-4">
        Puedes pedir ajustes al bosquejo, profundizar en términos específicos, solicitar ilustraciones o adaptar el sermón a distintos públicos.
      </p>

      {/* Quick interaction pills */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-4">
        {QUICK_PROMPTS.map((qp, idx) => {
          const Icon = qp.icon;
          return (
            <button
              key={idx}
              type="button"
              onClick={() => onSendMessage(qp.text)}
              disabled={isLoading}
              className="text-left p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/80 hover:bg-blue-50/60 dark:hover:bg-slate-700 hover:border-blue-300 dark:hover:border-blue-600 text-xs font-medium text-slate-700 dark:text-slate-200 hover:text-blue-900 dark:hover:text-white transition-all flex items-center gap-2 shadow-2xs cursor-pointer disabled:opacity-50"
            >
              <div className="w-6 h-6 rounded-md bg-blue-100/70 dark:bg-blue-950 text-blue-800 dark:text-blue-300 flex items-center justify-center shrink-0">
                <Icon className="w-3.5 h-3.5" />
              </div>
              <span className="truncate">{qp.label}</span>
            </button>
          );
        })}
      </div>

      {/* History of follow-up messages */}
      {messages.length > 0 && (
        <div className="space-y-3 mb-4 max-h-96 overflow-y-auto pr-1">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`p-4 rounded-xl text-sm leading-relaxed ${
                msg.role === 'user'
                  ? 'bg-blue-600 text-white ml-6 sm:ml-12 shadow-xs'
                  : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 mr-4 sm:mr-8 shadow-xs'
              }`}
            >
              <div className="flex items-center justify-between mb-1.5 opacity-80 text-xs font-semibold">
                <span>{msg.role === 'user' ? 'Tú (Líder / Maestro)' : 'Asistente Teológico'}</span>
                {msg.role === 'assistant' && (
                  <button
                    type="button"
                    onClick={() => handleCopy(msg.id, msg.content)}
                    className="p-1 hover:text-slate-900 dark:hover:text-white text-slate-500 dark:text-slate-400 rounded cursor-pointer"
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
          placeholder="Escribe una pregunta o ajuste (ej. 'Profundiza en el versículo 9', 'Agrega un gancho para jóvenes')..."
          disabled={isLoading}
          className="flex-1 px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 focus:border-blue-600 dark:focus:border-blue-400 focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-950 outline-none text-xs sm:text-sm text-slate-800 dark:text-slate-100 bg-white dark:bg-slate-800 placeholder:text-slate-400 dark:placeholder:text-slate-500"
        />
        <button
          type="submit"
          disabled={isLoading || !inputText.trim()}
          className="px-4 py-2.5 rounded-xl bg-blue-700 hover:bg-blue-800 dark:bg-blue-600 dark:hover:bg-blue-500 text-white text-xs sm:text-sm font-semibold flex items-center gap-1.5 disabled:opacity-50 cursor-pointer shadow-xs transition-colors"
        >
          <Send className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Enviar</span>
        </button>
      </form>
    </div>
  );
};
