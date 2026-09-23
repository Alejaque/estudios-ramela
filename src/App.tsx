import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { StudyInput } from './components/StudyInput';
import { StudyDisplay } from './components/StudyDisplay';
import { FollowUpChat } from './components/FollowUpChat';
import { SavedModal } from './components/SavedModal';
import { PulpitModal } from './components/PulpitModal';
import { PersonalNotes } from './components/PersonalNotes';
import { CoverHero } from './components/CoverHero';
import { PWAInstallButton } from './components/PWAInstallButton';
import { OfflineIndicator } from './components/OfflineIndicator';
import { INITIAL_FEATURED_STUDY } from './data/sampleStudies';
import { ChatMessage, SavedStudy, RecentSearch } from './types';
import { AlertCircle, RotateCcw, ExternalLink } from 'lucide-react';

function formatUserErrorMessage(err: string): string {
  if (!err) return 'Ocurrió un inconveniente al conectar con el asistente bíblico.';
  if (
    err.includes('402') ||
    err.includes('prepayment') ||
    err.includes('créditos') ||
    err.includes('creditos') ||
    err.includes('depleted') ||
    err.includes('billing#prepay')
  ) {
    return 'Los créditos prepagos o saldo de tu cuenta en Google AI Studio se han agotado. Puedes recargar saldo o revisar la facturación de tu proyecto en ai.studio/projects, o bien cambiar la clave en el menú de Configuración.';
  }
  if (
    err.includes('503') ||
    err.includes('high demand') ||
    err.includes('UNAVAILABLE') ||
    err.includes('alta demanda') ||
    err.includes('Spikes in demand')
  ) {
    return 'El servidor de IA está experimentando una alta demanda temporal en Google Cloud. Por favor pulsa "Reintentar" para generar tu estudio.';
  }
  if (err.includes('429')) {
    return 'Límite momentáneo de solicitudes por minuto alcanzado. Por favor espera unos momentos y pulsa "Reintentar".';
  }
  if (err.includes('RESOURCE_EXHAUSTED')) {
    return 'Cuota o saldo alcanzado en tu cuenta de AI Studio. Por favor verifica tus créditos en ai.studio/projects o espera a que se renueve tu cuota.';
  }
  if (err.startsWith('{') && err.endsWith('}')) {
    try {
      const parsed = JSON.parse(err);
      if (parsed.error?.message) return formatUserErrorMessage(parsed.error.message);
    } catch {
      // ignore
    }
  }
  return err;
}

export default function App() {
  const [passageOrTopic, setPassageOrTopic] = useState(INITIAL_FEATURED_STUDY.passageOrTopic);
  const [translation, setTranslation] = useState(INITIAL_FEATURED_STUDY.translation);
  const [content, setContent] = useState(INITIAL_FEATURED_STUDY.content);
  const [isLoading, setIsLoading] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Recent Consulted Passages (History of the last 5 passages in localStorage)
  const [recentHistory, setRecentHistory] = useState<RecentSearch[]>(() => {
    try {
      const saved = localStorage.getItem('biblical_studies_recent_history');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.slice(0, 5);
        }
      }
    } catch (e) {
      console.error('Error loading recent history:', e);
    }
    return [
      {
        passageOrTopic: INITIAL_FEATURED_STUDY.passageOrTopic,
        translation: INITIAL_FEATURED_STUDY.translation,
        timestamp: new Date().toISOString(),
      },
    ];
  });

  const saveToRecentHistory = (passage: string, trans: string) => {
    setRecentHistory((prev) => {
      const filtered = prev.filter(
        (item) => item.passageOrTopic.trim().toLowerCase() !== passage.trim().toLowerCase()
      );
      const updated: RecentSearch[] = [
        {
          passageOrTopic: passage.trim(),
          translation: trans,
          timestamp: new Date().toISOString(),
        },
        ...filtered,
      ].slice(0, 5);

      try {
        localStorage.setItem('biblical_studies_recent_history', JSON.stringify(updated));
      } catch (e) {
        console.error('Error persisting recent history:', e);
      }
      return updated;
    });
  };

  const handleClearRecentHistory = () => {
    setRecentHistory([]);
    try {
      localStorage.removeItem('biblical_studies_recent_history');
    } catch (e) {
      console.error('Error clearing recent history:', e);
    }
  };

  // Dark mode state with localStorage persistence
  const [isDark, setIsDark] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('biblical_study_theme');
      if (saved !== null) {
        return saved === 'dark';
      }
      return typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches;
    } catch {
      return false;
    }
  });

  // Keep html element and localStorage in sync with isDark
  useEffect(() => {
    try {
      localStorage.setItem('biblical_study_theme', isDark ? 'dark' : 'light');
    } catch (e) {
      console.error('Error saving theme preference:', e);
    }

    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDark]);

  const handleToggleDarkMode = () => {
    setIsDark((prev) => !prev);
  };

  // Follow-up interaction chat
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);

  // Saved studies list
  const [savedStudies, setSavedStudies] = useState<SavedStudy[]>(() => {
    try {
      const saved = localStorage.getItem('biblical_studies_saved');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Modals
  const [isSavedModalOpen, setIsSavedModalOpen] = useState(false);
  const [isPulpitOpen, setIsPulpitOpen] = useState(false);

  // Speech synthesis
  const [isSpeaking, setIsSpeaking] = useState(false);
  const canSpeak = typeof window !== 'undefined' && 'speechSynthesis' in window;

  // Persist saved studies
  useEffect(() => {
    try {
      localStorage.setItem('biblical_studies_saved', JSON.stringify(savedStudies));
    } catch (e) {
      console.error('Error saving to localStorage:', e);
    }
  }, [savedStudies]);

  // Speech cleanup on unmount
  useEffect(() => {
    return () => {
      if (canSpeak) {
        window.speechSynthesis.cancel();
      }
    };
  }, [canSpeak]);

  const handleToggleSpeech = () => {
    if (!canSpeak) return;
    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }

    const cleanText = content.replace(/[#*`_>\[\]\(\)]/g, ' ');
    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.lang = 'es-ES';
    utterance.rate = 0.95;
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);
    window.speechSynthesis.speak(utterance);
    setIsSpeaking(true);
  };

  // Main study generation with stream + automatic JSON fallback
  const handleGenerateStudy = async (targetPassage: string, chosenTranslation: string) => {
    if (isSpeaking && canSpeak) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }

    setPassageOrTopic(targetPassage);
    setTranslation(chosenTranslation);
    saveToRecentHistory(targetPassage, chosenTranslation);
    setErrorMsg(null);
    setIsLoading(true);
    setIsStreaming(true);
    setContent('');
    setChatMessages([]);

    let accumulatedText = '';
    let streamFailed = false;

    try {
      const response = await fetch('/api/study/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          passageOrTopic: targetPassage,
          translationPreference: chosenTranslation,
        }),
      });

      if (!response.ok) {
        streamFailed = true;
      } else if (response.body) {
        const reader = response.body.getReader();
        const decoder = new TextDecoder('utf-8');
        let buffer = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            const trimmed = line.trim();
            if (trimmed.startsWith('data: ')) {
              const jsonStr = trimmed.slice(6);
              try {
                const data = JSON.parse(jsonStr);
                if (data.text) {
                  accumulatedText += data.text;
                  setContent(accumulatedText);
                }
                if (data.error) {
                  streamFailed = true;
                  throw new Error(data.error);
                }
              } catch (parseErr: any) {
                if (parseErr.message && !parseErr.message.includes('JSON')) {
                  throw parseErr;
                }
              }
            }
          }
        }
      }
    } catch (streamErr: any) {
      console.warn('Stream interrupted or failed, attempting direct fallback:', streamErr);
      streamFailed = true;
    }

    // If stream did not produce complete content, use robust JSON fallback endpoint
    if (streamFailed || !accumulatedText.trim()) {
      try {
        const fallbackRes = await fetch('/api/study', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            passageOrTopic: targetPassage,
            translationPreference: chosenTranslation,
          }),
        });

        const data = await fallbackRes.json();
        if (!fallbackRes.ok || data.error) {
          throw new Error(data.error || `Error del servidor (${fallbackRes.status})`);
        }

        if (data.text) {
          accumulatedText = data.text;
          setContent(accumulatedText);
        } else {
          throw new Error('No se recibió texto del análisis teológico.');
        }
      } catch (fallbackErr: any) {
        console.error('Direct fallback also failed:', fallbackErr);
        setErrorMsg(
          fallbackErr?.message || 'Ocurrió un error al procesar el pasaje bíblico. Por favor intenta de nuevo.'
        );
      }
    }

    setIsLoading(false);
    setIsStreaming(false);
  };

  // Follow-up message handling with stream + automatic JSON fallback
  const handleSendFollowUp = async (userText: string) => {
    if (isLoading) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: userText,
      timestamp: new Date().toISOString(),
    };

    const newMessages = [...chatMessages, userMsg];
    setChatMessages(newMessages);
    setIsLoading(true);

    const assistantMsgId = (Date.now() + 1).toString();
    const assistantMsgPlaceholder: ChatMessage = {
      id: assistantMsgId,
      role: 'assistant',
      content: 'Analizando y preparando respuesta homilética...',
      timestamp: new Date().toISOString(),
    };

    setChatMessages([...newMessages, assistantMsgPlaceholder]);

    const history = [
      {
        role: 'user',
        content: `Estudio base de: "${passageOrTopic}" (${translation})`,
      },
      {
        role: 'assistant',
        content,
      },
      ...chatMessages.map((m) => ({
        role: m.role,
        content: m.content,
      })),
    ];

    let accumulatedText = '';
    let streamFailed = false;

    try {
      const response = await fetch('/api/study/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          passageOrTopic,
          translationPreference: translation,
          messages: history,
          userPrompt: userText,
        }),
      });

      if (!response.ok || !response.body) {
        streamFailed = true;
      } else {
        const reader = response.body.getReader();
        const decoder = new TextDecoder('utf-8');
        let buffer = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            const trimmed = line.trim();
            if (trimmed.startsWith('data: ')) {
              const jsonStr = trimmed.slice(6);
              try {
                const data = JSON.parse(jsonStr);
                if (data.text) {
                  accumulatedText += data.text;
                  setChatMessages((prev) =>
                    prev.map((msg) =>
                      msg.id === assistantMsgId ? { ...msg, content: accumulatedText } : msg
                    )
                  );
                }
                if (data.error) {
                  streamFailed = true;
                  throw new Error(data.error);
                }
              } catch (parseErr: any) {
                if (parseErr.message && !parseErr.message.includes('JSON')) {
                  throw parseErr;
                }
              }
            }
          }
        }
      }
    } catch (e) {
      streamFailed = true;
    }

    // Direct JSON fallback for follow-up
    if (streamFailed || !accumulatedText.trim()) {
      try {
        const fallbackRes = await fetch('/api/study', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            passageOrTopic,
            translationPreference: translation,
            messages: history,
            userPrompt: userText,
          }),
        });

        const data = await fallbackRes.json();
        if (data.text) {
          accumulatedText = data.text;
          setChatMessages((prev) =>
            prev.map((msg) =>
              msg.id === assistantMsgId ? { ...msg, content: accumulatedText } : msg
            )
          );
        } else {
          throw new Error(data.error || 'No se pudo generar respuesta.');
        }
      } catch (err: any) {
        setChatMessages((prev) =>
          prev.map((msg) =>
            msg.id === assistantMsgId
              ? {
                  ...msg,
                  content: `*Error al procesar la consulta: ${err?.message || 'Por favor vuelve a intentar'}*`,
                }
              : msg
          )
        );
      }
    }

    setIsLoading(false);
  };

  // Save / Toggle Bookmark
  const isCurrentSaved = savedStudies.some(
    (s) => s.passageOrTopic.toLowerCase() === passageOrTopic.toLowerCase()
  );

  const handleToggleSave = () => {
    if (isCurrentSaved) {
      setSavedStudies((prev) =>
        prev.filter((s) => s.passageOrTopic.toLowerCase() !== passageOrTopic.toLowerCase())
      );
    } else {
      const newSaved: SavedStudy = {
        id: Date.now().toString(),
        title: passageOrTopic,
        passageOrTopic,
        content,
        translation,
        createdAt: new Date().toISOString(),
      };
      setSavedStudies((prev) => [newSaved, ...prev]);
    }
  };

  const handleSelectSavedStudy = (study: SavedStudy) => {
    setPassageOrTopic(study.passageOrTopic);
    if (study.translation) setTranslation(study.translation);
    setContent(study.content);
    setChatMessages([]);
    setIsSavedModalOpen(false);
  };

  const handleDeleteSavedStudy = (id: string) => {
    setSavedStudies((prev) => prev.filter((s) => s.id !== id));
  };

  return (
    <div
      id="root-theology-app"
      className={`min-h-screen flex flex-col font-sans transition-colors duration-200 ${
        isDark ? 'dark bg-slate-950 text-slate-100' : 'bg-slate-100/60 text-slate-800'
      }`}
    >
      {/* Top Bar Header */}
      <Header
        onOpenSaved={() => setIsSavedModalOpen(true)}
        savedCount={savedStudies.length}
        onOpenPulpitMode={() => setIsPulpitOpen(true)}
        isSpeaking={isSpeaking}
        onToggleSpeech={handleToggleSpeech}
        canSpeak={canSpeak}
        isDark={isDark}
        onToggleDarkMode={handleToggleDarkMode}
      />

      {/* Android Install Banner for mobile users */}
      <PWAInstallButton variant="banner" />

      {/* Main Container */}
      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 py-6">
        {/* Portada Principal: Estudios Alejandro Ramela */}
        <CoverHero />

        {/* Input Bar with Recent History and Quick Suggestions */}
        <StudyInput
          onStudy={handleGenerateStudy}
          isLoading={isLoading}
          activePassage={passageOrTopic}
          recentSearches={recentHistory}
          onClearRecent={handleClearRecentHistory}
        />

        {/* Error notification with Retry action */}
        {errorMsg && (
          <div className="mb-6 p-4 rounded-xl bg-amber-50 dark:bg-amber-950/50 border border-amber-300 dark:border-amber-800 text-amber-900 dark:text-amber-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs animate-fade-in">
            <div className="flex items-start gap-3 flex-1">
              <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
              <div className="text-sm">
                <p className="font-semibold mb-0.5">Aviso en el análisis bíblico</p>
                <p className="text-amber-800 dark:text-amber-300 leading-relaxed">
                  {formatUserErrorMessage(errorMsg)}
                </p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2 self-end sm:self-center shrink-0">
              {(errorMsg.includes('402') ||
                errorMsg.includes('créditos') ||
                errorMsg.includes('prepayment') ||
                errorMsg.includes('saldo') ||
                errorMsg.includes('RESOURCE_EXHAUSTED')) && (
                <a
                  href="https://ai.studio/projects"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-slate-950 font-semibold text-xs shadow-xs transition-all flex items-center gap-1.5"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Gestionar Créditos</span>
                </a>
              )}
              {passageOrTopic && (
                <button
                  type="button"
                  onClick={() => handleGenerateStudy(passageOrTopic, translation)}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Reintentar</span>
                </button>
              )}
              <button
                type="button"
                onClick={() => setErrorMsg(null)}
                className="text-amber-700 dark:text-amber-300 hover:text-amber-900 dark:hover:text-amber-100 text-xs px-2.5 py-1.5 rounded-lg border border-amber-300 dark:border-amber-700 hover:bg-amber-100 dark:hover:bg-amber-900/40 transition-colors cursor-pointer"
              >
                Cerrar
              </button>
            </div>
          </div>
        )}

        {/* Structured 4-Section Study Display */}
        {content ? (
          <>
            <StudyDisplay
              passageOrTopic={passageOrTopic}
              translation={translation}
              content={content}
              isStreaming={isStreaming}
              isSaved={isCurrentSaved}
              onSave={handleToggleSave}
              onOpenPulpit={() => setIsPulpitOpen(true)}
            />

            {/* Personal Notes & Reflections for Current Passage */}
            <PersonalNotes passageOrTopic={passageOrTopic} />

            {/* Follow-up Interactive Homiletical Chat */}
            <div className="mt-8">
              <FollowUpChat
                messages={chatMessages}
                onSendMessage={handleSendFollowUp}
                isLoading={isLoading}
              />
            </div>
          </>
        ) : (
          !isLoading && (
            <div className="text-center py-16 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-8 shadow-xs">
              <p className="text-slate-600 dark:text-slate-400 text-sm">
                Ingresa un pasaje bíblico o un tema doctrinal para comenzar el estudio exegético y bosquejo homilético.
              </p>
            </div>
          )
        )}
      </main>

      {/* Saved Studies Modal */}
      <SavedModal
        isOpen={isSavedModalOpen}
        onClose={() => setIsSavedModalOpen(false)}
        savedStudies={savedStudies}
        onSelectStudy={handleSelectSavedStudy}
        onDeleteStudy={handleDeleteSavedStudy}
      />

      {/* Pulpit / Teleprompter Preaching Modal */}
      <PulpitModal
        isOpen={isPulpitOpen}
        onClose={() => setIsPulpitOpen(false)}
        passageOrTopic={passageOrTopic}
        translation={translation}
        content={content}
      />

      {/* Connectivity Status Indicator */}
      <OfflineIndicator />
    </div>
  );
}
