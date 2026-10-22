import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { MessageCircleQuestion, Save } from 'lucide-react';

interface ConsultSource {
  id: string;
  ref: string;
  obra: string;
  autor: string;
  licencia: string;
  url: string;
}

interface PassageConsultProps {
  passage: string;
  sections: { key: string; label: string }[];
  onSave: (sectionKey: string, text: string) => void;
}

// Panel "Consultar sobre este pasaje" (en prueba): pregunta libre sobre el pasaje,
// respuesta con citas comprobables, y guardado en apuntes solo a elección del usuario.
// Envía únicamente la referencia del pasaje y el texto de la pregunta; nunca los apuntes.
export const PassageConsult: React.FC<PassageConsultProps> = ({ passage, sections, onSave }) => {
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [sources, setSources] = useState<ConsultSource[]>([]);
  const [lastQuestion, setLastQuestion] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [targetSection, setTargetSection] = useState(sections[0]?.key || 'apuntes');
  const [saved, setSaved] = useState(false);

  async function ask(e: React.FormEvent) {
    e.preventDefault();
    const q = question.trim();
    if (!q || loading) return;
    setLoading(true);
    setError('');
    setSaved(false);
    try {
      const r = await fetch('/api/consulta', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ passage, question: q }),
      });
      const data = await r.json().catch(() => ({}));
      if (!r.ok) {
        setError(data?.error || 'No se pudo consultar. Probá de nuevo.');
        setAnswer('');
      } else {
        setAnswer(data.answer || '');
        setSources(Array.isArray(data.sources) ? data.sources : []);
        setLastQuestion(q);
        setQuestion('');
      }
    } catch {
      setError('Sin conexión: la consulta necesita Internet.');
      setAnswer('');
    } finally {
      setLoading(false);
    }
  }

  function saveToNotes() {
    if (!answer) return;
    const stamp = new Date().toLocaleString('es-AR');
    const srcLines = sources
      .map((f) => `Fuente recuperada: ${f.obra}, ${f.autor}. ${f.ref}. ${f.licencia}. ${f.url}`)
      .join('\n');
    const block = `---\nConsulta (${stamp}): ${lastQuestion}\n\n${answer}${srcLines ? '\n\n' + srcLines : ''}`;
    onSave(targetSection, block);
    setSaved(true);
  }

  return (
    <details className="mb-6 border-b border-[#cbd4c9] dark:border-[#405245] pb-3">
      <summary className="font-semibold cursor-pointer">
        Consultar sobre este pasaje (asistente, en prueba)
      </summary>
      <p className="text-sm opacity-75 mt-3 mb-3">
        La pregunta sale de este dispositivo y Google puede usarla para mejorar sus productos.
        Escribí solo preguntas generales sobre el pasaje: sin datos personales ni situaciones
        privadas de la iglesia. Tus apuntes nunca se envían. Por ahora la consulta con fuente verificada cubre Juan 6 (Comentario de Matthew Henry, dominio público, recuperado por el servidor); para otros pasajes reconoce el límite en vez de improvisar. Comprobá siempre en la fuente enlazada. Necesita Internet.
      </p>
      <form onSubmit={ask} className="space-y-2">
        <textarea
          className="library-input w-full min-h-[70px] text-base"
          placeholder={`Pregunta sobre ${passage || 'el pasaje'}…`}
          value={question}
          maxLength={1000}
          onChange={(e) => setQuestion(e.target.value)}
        />
        <button
          type="submit"
          disabled={loading || question.trim().length < 3}
          className="library-control disabled:opacity-50"
        >
          <MessageCircleQuestion size={16} /> {loading ? 'Consultando…' : 'Consultar'}
        </button>
      </form>
      {error && <p className="text-sm mt-3 text-red-700 dark:text-red-400">{error}</p>}
      {answer && (
        <div className="mt-4">
          <article className="library-reading bg-[#fffdf8] dark:bg-[#18241d] rounded-2xl px-5 py-4 shadow-sm">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{answer}</ReactMarkdown>
          </article>
          {sources.length > 0 && (
            <div className="mt-2 rounded-2xl border border-[#cbd4c9] dark:border-[#405245] px-5 py-3 text-sm">
              <p className="font-semibold mb-1">Fuente recuperada por el servidor (verificada):</p>
              {sources.map((f) => (
                <p key={f.id} className="opacity-80">
                  {f.obra}, {f.autor}. Cobertura: {f.ref}. {f.licencia}.{' '}
                  <a href={f.url} target="_blank" rel="noreferrer" className="underline">
                    Ver la fuente
                  </a>
                </p>
              ))}
            </div>
          )}
          <div className="flex flex-wrap items-center gap-2 mt-3">
            <select
              className="library-control text-sm"
              value={targetSection}
              onChange={(e) => setTargetSection(e.target.value)}
              title="Apartado donde guardar la respuesta"
            >
              {sections.map((s) => (
                <option key={s.key} value={s.key}>
                  {s.label}
                </option>
              ))}
            </select>
            <button onClick={saveToNotes} className="library-control text-sm">
              <Save size={15} /> Guardar en apuntes
            </button>
            {saved && <span className="text-sm opacity-70">Guardado ✓</span>}
          </div>
        </div>
      )}
    </details>
  );
};
