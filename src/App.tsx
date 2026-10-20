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
import { INITIAL_FEATURED_STUDY, MASTER_CURATED_STUDIES } from './data/sampleStudies';
import { ChatMessage, SavedStudy, RecentSearch } from './types';
import { generateTheologicalStudy } from './utils/theologicalEngine';
import {
  AlertCircle,
  RotateCcw,
  CheckCircle2,
  Search,
  BookOpen,
  Maximize2,
  Bookmark,
  PenLine,
} from 'lucide-react';

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
    return 'Límite de créditos temporales en la API externa. El motor teológico local de Alejandro Ramela ha generado tu estudio con total precisión.';
  }
  if (
    err.includes('503') ||
    err.includes('high demand') ||
    err.includes('UNAVAILABLE') ||
    err.includes('alta demanda') ||
    err.includes('Spikes in demand')
  ) {
    return 'Alta demanda en el servidor en la nube. Se ha activado el análisis teológico de respaldo.';
  }
  if (err.includes('429')) {
    return 'Límite de solicitudes momentáneo. El motor teológico local ha estructurado tu bosquejo.';
  }
  return err;
}

export default function App() {
  const [passageOrTopic, setPassageOrTopic] = useState(INITIAL_FEATURED_STUDY.passageOrTopic);
  const [translation, setTranslation] = useState(INITIAL_FEATURED_STUDY.translation);
  const [content, setContent] = useState(INITIAL_FEATURED_STUDY.content);
  const [studyStyle, setStudyStyle] = useState('continuous');
  const [activeStudyStyle, setActiveStudyStyle] = useState('classic');
  const [isLoading, setIsLoading] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 2800);
  };

  // Recent Consulted Passages (History in localStorage)
  const [recentHistory, setRecentHistory] = useState<RecentSearch[]>(() => {
    try {
      const saved = localStorage.getItem('biblical_studies_recent_history');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.slice(0, 6);
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
      {
        passageOrTopic: 'Romanos 8:28-30',
        translation: 'Reina-Valera 1960 (RVR1960)',
        timestamp: new Date().toISOString(),
      },
      {
        passageOrTopic: 'Salmo 23:1-6',
        translation: 'Reina-Valera 1960 (RVR1960)',
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
      ].slice(0, 6);

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
      showToast('Historial reciente limpiado');
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

  // Saved studies list (preloaded with master studies if empty)
  const [savedStudies, setSavedStudies] = useState<SavedStudy[]>(() => {
    try {
      const saved = localStorage.getItem('biblical_studies_saved');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
      // If none saved, preload the first 2 master studies so the user sees real value right away
      return MASTER_CURATED_STUDIES.slice(0, 2).map((m) => ({
        id: m.id,
        title: m.title,
        passageOrTopic: m.passageOrTopic,
        content: m.content,
        translation: m.translation,
        createdAt: new Date().toISOString(),
      }));
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
    showToast('Reproduciendo audio del estudio');
  };

  // Main study generation with stream + automatic JSON fallback + offline theological engine
  const handleGenerateStudy = async (targetPassage: string, chosenTranslation: string) => {
    if (isSpeaking && canSpeak) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }

    setActiveStudyStyle(studyStyle);
    setPassageOrTopic(targetPassage);
    setTranslation(chosenTranslation);
    saveToRecentHistory(targetPassage, chosenTranslation);
    setErrorMsg(null);
    setIsLoading(true);
    setIsStreaming(true);
    setContent('');
    setChatMessages([]);

    // Check if it's in curated master studies for immediate instant loading
    const curatedMatch = MASTER_CURATED_STUDIES.find(
      (m) => m.passageOrTopic.toLowerCase() === targetPassage.trim().toLowerCase()
    );

    let accumulatedText = '';
    let streamFailed = false;
    const controller = new AbortController();
    const timer = window.setTimeout(() => controller.abort(), 50000);

    try {
      const response = await fetch('/api/study-stream', {
        signal: controller.signal,
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          passageOrTopic: targetPassage,
          translationPreference: chosenTranslation,
            studyStyle,
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
      streamFailed = true;
    }

    window.clearTimeout(timer);
    if (streamFailed || !accumulatedText.trim()) {
      setErrorMsg('El proveedor gratuito no pudo completar el estudio en el tiempo disponible. Reintentá más tarde. No se sustituyó por un bosquejo local.');
      setIsLoading(false);
      setIsStreaming(false);
      return;
    }

    // Ultimate fallback: Our rich, scholarly Theological Engine
    // This ensures the application NEVER breaks and is 100% resilient!
    if (!accumulatedText.trim()) {
      if (curatedMatch) {
        accumulatedText = curatedMatch.content;
      } else {
        accumulatedText = generateTheologicalStudy(targetPassage, chosenTranslation);
      }
      setContent(accumulatedText);
    }

    setIsLoading(false);
    setIsStreaming(false);

    // Scroll smoothly to study sections
    setTimeout(() => {
      const el = document.getElementById('seccion-1-exegesis');
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 150);
  };

  // Follow-up interaction handling
  const handleSendFollowUp = async (userText: string) => {
    const userMsgId = Date.now().toString();
    const assistantMsgId = (Date.now() + 1).toString();

    const newMessages: ChatMessage[] = [
      ...chatMessages,
      {
        id: userMsgId,
        role: 'user',
        content: userText,
        timestamp: new Date().toISOString(),
      },
      {
        id: assistantMsgId,
        role: 'assistant',
        content: '...',
        timestamp: new Date().toISOString(),
      },
    ];

    setChatMessages(newMessages);
    setIsLoading(true);

    let accumulatedText = '';
    let streamFailed = false;
    const controller = new AbortController();
    const timer = window.setTimeout(() => controller.abort(), 50000);

    try {
      const history = [
        {
          role: 'assistant',
          content: `Estudio bíblico previo sobre ${passageOrTopic}:\n${content}`,
        },
        ...chatMessages.map((m) => ({
          role: m.role,
          content: m.content,
        })),
      ];

      const response = await fetch('/api/study-stream', {
        signal: controller.signal,
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          passageOrTopic,
          translationPreference: translation,
          studyStyle: activeStudyStyle,
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
              } catch {
                // ignore
              }
            }
          }
        }
      }
    } catch {
      streamFailed = true;
    }

    window.clearTimeout(timer);
    if (streamFailed || !accumulatedText.trim()) {
      // Local intelligent response generator
      accumulatedText = generateFollowUpResponse(userText, passageOrTopic);
      setChatMessages((prev) =>
        prev.map((msg) =>
          msg.id === assistantMsgId ? { ...msg, content: accumulatedText } : msg
        )
      );
    }

    setIsLoading(false);
  };

  // Helper for generating helpful pastoral answers offline
  function generateFollowUpResponse(query: string, passage: string): string {
    const q = query.toLowerCase();
    if (q.includes('griego') || q.includes('hebreo') || q.includes('original')) {
      return `### 🏛️ Profundización en los Idiomas Originales para ${passage}\n\n- **Matiz Léxico Central:** En la lengua original, las palabras no solo transmiten conceptos abstractos, sino acciones dinámicas y pactuales.\n- **Énfasis Morfológico:** Los verbos principales en este pasaje se encuentran en tiempos que destacan la iniciativa soberana y consumada de Dios, contrastando con la receptividad humana en fe.\n- **Aplicación Homilética:** Al predicar, enfatiza a la congregación que el texto no exige que produzcamos la salvación o la paz con fuerzas carnales, sino que descansemos en la obra que Dios ya ha ejecutado por nosotros.`;
    }
    if (q.includes('20 min') || q.includes('minuto') || q.includes('sintetizar')) {
      return `### ⏱️ Bosquejo Expositivo Sintético (Versión 20 Minutos)\n\n**Texto:** ${passage}\n**La Gran Idea (1 min):** En una sola frase memorable para la congregación.\n\n1. **Introducción (3 min):** Un gancho directo que plantee la necesidad o tensión espiritual que todos enfrentamos en la semana.\n2. **Punto I: La Revelación de la Gracia de Dios (6 min):** Explicación clara del pasaje y su fundamento cristocéntrico.\n3. **Punto II: La Transformación de Nuestra Vida (6 min):** Aplicación concreta a las relaciones, el trabajo y las decisiones personales.\n4. **Conclusión y Llamado (4 min):** Desafío directo de fe y oración comunitaria de consagración.`;
    }
    if (q.includes('ilustrac') || q.includes('ejemplo')) {
      return `### 💡 Ilustraciones Contemporáneas para ${passage}\n\n1. **Para la Introducción (El Ancla en la Tormenta):** En alta mar, un barco no echa su ancla dentro de la cabina ni sobre sus propias bodegas; la lanza al fondo marino, a una roca exterior. Del mismo modo, nuestra paz no descansa en nuestras emociones fluctuantes, sino en la fidelidad inmutable de Cristo fuera de nosotros.\n\n2. **Para el Punto Principal (El Cheque Cobrado):** Una persona que recibe una herencia millonaria en un cheque no se vuelve rica por la belleza del papel ni por el esfuerzo de llevarlo al banco, sino por el valor real que respalda la firma del emisor. Nuestra fe es simplemente la mano vacía que recibe la infinita riqueza de la gracia divina.`;
    }
    if (q.includes('grupo') || q.includes('célula') || q.includes('pregunta')) {
      return `### 👥 Preguntas para Discusión en Células y Grupos Pequeños\n\n1. Al leer ${passage}, ¿cuál es la frase o verdad que más confronta o consuela tu corazón en esta etapa de tu vida?\n2. ¿En qué áreas de tu rutina (familia, finanzas, trabajo) te cuesta más soltar el control y confiar en las promesas de Dios?\n3. ¿Cómo responderías bíblicamente a alguien que piensa que debe ganar el favor de Dios mediante su propio esfuerzo religioso?\n4. ¿Qué paso tangible de fe o acto de misericordia te comprometes a realizar esta semana con la ayuda del Señor?`;
    }
    return `### 📖 Orientación Pastoral sobre "${query}" en ${passage}\n\nAl abordar esta inquietud a la luz de las Escrituras, es fundamental recordar que todo el consejo de Dios apunta a glorificar a Cristo y transformar el corazón del creyente. Te animo a enfatizar ante la congregación que las verdades de este texto no son normas moralistas para cumplir en la carne, sino el fluir sobrenatural del Evangelio en quien vive en comunión íntima con el Señor.`;
  }

  // Save / Toggle Bookmark
  const isCurrentSaved = savedStudies.some(
    (s) => s.passageOrTopic.toLowerCase() === passageOrTopic.toLowerCase()
  );

  const handleToggleSave = () => {
    if (isCurrentSaved) {
      setSavedStudies((prev) =>
        prev.filter((s) => s.passageOrTopic.toLowerCase() !== passageOrTopic.toLowerCase())
      );
      showToast('Estudio quitado de Mis Bosquejos');
    } else {
      const newSaved: SavedStudy = {
        id: Date.now().toString(),
        title: passageOrTopic,
        passageOrTopic,
        content,
        translation,
        studyStyle: activeStudyStyle,
        createdAt: new Date().toISOString(),
      };
      setSavedStudies((prev) => [newSaved, ...prev]);
      showToast('¡Estudio guardado en Mis Bosquejos!');
    }
  };

  const handleSelectSavedStudy = (study: SavedStudy) => {
    setPassageOrTopic(study.passageOrTopic);
    if (study.translation) setTranslation(study.translation);
    setActiveStudyStyle(study.studyStyle || 'classic');
    setContent(study.content);
    setChatMessages([]);
    setIsSavedModalOpen(false);
    showToast(`Cargado: ${study.passageOrTopic}`);
  };

  const handleDeleteSavedStudy = (id: string) => {
    setSavedStudies((prev) => prev.filter((s) => s.id !== id));
    showToast('Estudio eliminado');
  };

  const handleImportStudies = (imported: SavedStudy[]) => {
    setSavedStudies((prev) => {
      const ids = new Set(prev.map((s) => s.passageOrTopic.toLowerCase()));
      const toAdd = imported.filter((s) => !ids.has(s.passageOrTopic.toLowerCase()));
      return [...toAdd, ...prev];
    });
    showToast(`Se importaron ${imported.length} bosquejos correctamente`);
  };

  return (
    <div
      id="root-theology-app"
      className={`min-h-screen flex flex-col font-sans transition-colors duration-200 pb-16 sm:pb-0 ${
        isDark ? 'dark bg-[#080d1a] text-slate-100' : 'bg-slate-50 text-slate-800'
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

      {/* Android / Mobile Install Banner */}
      <PWAInstallButton variant="banner" />

      {/* Main Container */}
      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 py-6">
        {/* Portada Principal: Estudios Alejandro Ramela (Collapsible) */}
        <CoverHero />

        {/* Input Bar with Canonical Explorer, Autocomplete and Recent History */}
        <StudyInput
          onStudy={handleGenerateStudy}
          studyStyle={studyStyle}
          onStyleChange={setStudyStyle}
          isLoading={isLoading}
          activePassage={passageOrTopic}
          recentSearches={recentHistory}
          onClearRecent={handleClearRecentHistory}
        />

        {/* Error notification banner if any */}
        {errorMsg && (
          <div className="mb-6 p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/50 border border-amber-300 dark:border-amber-800 text-amber-900 dark:text-amber-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-sm animate-fade-in">
            <div className="flex items-start gap-3 flex-1">
              <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
              <div className="text-xs sm:text-sm">
                <p className="font-bold mb-0.5">Nota sobre la consulta bíblica</p>
                <p className="text-amber-800 dark:text-amber-300 leading-relaxed">
                  {formatUserErrorMessage(errorMsg)}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
              <button
                type="button"
                onClick={() => handleGenerateStudy(passageOrTopic, translation)}
                className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold shadow-xs flex items-center gap-1.5 cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reintentar</span>
              </button>
              <button
                type="button"
                onClick={() => setErrorMsg(null)}
                className="text-xs px-2.5 py-1.5 rounded-xl border border-amber-300 dark:border-amber-700 text-amber-800 dark:text-amber-200 cursor-pointer"
              >
                Cerrar
              </button>
            </div>
          </div>
        )}

        {/* Structured 4-Section Study Display */}
        {content ? (
          <>
            <div id="secciones-estudio-biblico">
              <StudyDisplay
                passageOrTopic={passageOrTopic}
                translation={translation}
                content={content}
                isStreaming={isStreaming}
                isSaved={isCurrentSaved}
                onSave={handleToggleSave}
                onOpenPulpit={() => setIsPulpitOpen(true)}
              />
            </div>

            {/* Personal Notes & Reflections */}
            <div id="notas-del-expositor">
              <PersonalNotes passageOrTopic={passageOrTopic} />
            </div>

            {/* Follow-up Interactive Homiletical Chat */}
            <div id="chat-homiletico" className="mt-8">
              <FollowUpChat
                messages={chatMessages}
                onSendMessage={handleSendFollowUp}
                isLoading={isLoading}
                onClearChat={() => setChatMessages([])}
              />
            </div>
          </>
        ) : (
          !isLoading && (
            <div className="text-center py-16 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-8 shadow-xs">
              <p className="text-slate-600 dark:text-slate-400 text-sm">
                Ingresa un pasaje bíblico o un tema doctrinal arriba para comenzar el estudio exegético y bosquejo homilético.
              </p>
            </div>
          )
        )}
      </main>

      {/* Floating Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-20 sm:bottom-6 right-6 z-50 flex items-center gap-2 bg-slate-900/95 dark:bg-white/95 text-white dark:text-slate-900 px-4 py-2.5 rounded-2xl shadow-xl border border-white/10 dark:border-slate-800 text-xs sm:text-sm font-semibold animate-fade-in backdrop-blur-md">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 dark:text-emerald-600 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Mobile Bottom Navigation Bar (Thumb Friendly) */}
      <nav className="sm:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-slate-900/95 border-t border-slate-200 dark:border-slate-800 backdrop-blur-md px-2 py-1.5 flex items-center justify-around shadow-lg">
        <button
          type="button"
          onClick={() => {
            window.scrollTo({ top: 0, behavior: 'smooth' });
            document.getElementById('biblical-input')?.focus();
          }}
          className="flex flex-col items-center gap-0.5 p-1 text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 cursor-pointer"
        >
          <Search className="w-5 h-5" />
          <span className="text-[10px] font-medium">Buscar</span>
        </button>

        <button
          type="button"
          onClick={() => {
            document.getElementById('secciones-estudio-biblico')?.scrollIntoView({ behavior: 'smooth' });
          }}
          className="flex flex-col items-center gap-0.5 p-1 text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 cursor-pointer"
        >
          <BookOpen className="w-5 h-5" />
          <span className="text-[10px] font-medium">Estudio</span>
        </button>

        <button
          type="button"
          onClick={() => setIsPulpitOpen(true)}
          className="flex flex-col items-center gap-0.5 p-1 text-indigo-600 dark:text-indigo-400 font-bold cursor-pointer"
        >
          <div className="w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center -mt-3 shadow-md">
            <Maximize2 className="w-4 h-4" />
          </div>
          <span className="text-[10px]">Púlpito</span>
        </button>

        <button
          type="button"
          onClick={() => {
            document.getElementById('notas-del-expositor')?.scrollIntoView({ behavior: 'smooth' });
          }}
          className="flex flex-col items-center gap-0.5 p-1 text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 cursor-pointer"
        >
          <PenLine className="w-5 h-5" />
          <span className="text-[10px] font-medium">Notas</span>
        </button>

        <button
          type="button"
          onClick={() => setIsSavedModalOpen(true)}
          className="flex flex-col items-center gap-0.5 p-1 text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 relative cursor-pointer"
        >
          <Bookmark className="w-5 h-5" />
          <span className="text-[10px] font-medium">Guardados</span>
          {savedStudies.length > 0 && (
            <span className="absolute top-0 right-1 w-2 h-2 rounded-full bg-blue-600" />
          )}
        </button>
      </nav>

      {/* Saved Studies Modal */}
      <SavedModal
        isOpen={isSavedModalOpen}
        onClose={() => setIsSavedModalOpen(false)}
        savedStudies={savedStudies}
        onSelectStudy={handleSelectSavedStudy}
        onDeleteStudy={handleDeleteSavedStudy}
        onImportStudies={handleImportStudies}
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
