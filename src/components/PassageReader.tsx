import React, { useEffect, useState } from 'react';
import { BookOpen, ExternalLink } from 'lucide-react';

interface PassageReaderProps {
  passage: string;
}

// Lectura del pasaje dentro del estudio personal.
// Versión: Reina-Valera 1909 (dominio público). NO es la RVR1960: se rotula siempre así.
// La RVR1960 sigue disponible como enlace externo hasta contar con una fuente con permiso.
export const PassageReader: React.FC<PassageReaderProps> = ({ passage }) => {
  const [text, setText] = useState('');
  const [reference, setReference] = useState('');
  const [state, setState] = useState<'idle' | 'loading' | 'ok' | 'error'>('idle');
  const [msg, setMsg] = useState('');
  const gwUrl = `https://www.biblegateway.com/passage/?search=${encodeURIComponent(passage)}&version=RVR1960&interface=print`;

  useEffect(() => {
    setText('');
    setReference('');
    setMsg('');
    setState('idle');
  }, [passage]);

  async function load() {
    setState('loading');
    setMsg('');
    try {
      const r = await fetch(`/api/bible?version=rvr1909&ref=${encodeURIComponent(passage)}`);
      const data = await r.json().catch(() => ({}));
      if (!r.ok || !data?.text) {
        setState('error');
        setMsg(
          r.status === 400
            ? 'No reconocí esa referencia. Escribila como "Filipenses 4:10-13".'
            : 'No se pudo cargar el pasaje. Probá de nuevo.',
        );
        return;
      }
      setText(String(data.text));
      setReference(String(data.reference || passage));
      setState('ok');
    } catch {
      setState('error');
      setMsg('Sin conexión: leer el pasaje necesita Internet.');
    }
  }

  return (
    <details className="mb-6 border-b border-[#cbd4c9] dark:border-[#405245] pb-3" open>
      <summary className="font-semibold cursor-pointer">Leer el pasaje aquí</summary>
      <p className="text-sm opacity-75 mt-3 mb-3">
        Para la <strong>RVR1960</strong> usá el enlace externo (texto de BibleGateway; se abre en
        otra pestaña). El botón «Leer» muestra la <strong>Reina-Valera 1909</strong> (dominio
        público), que NO es la RVR1960: algunas palabras difieren. Ambos necesitan Internet.
      </p>
      <a
        href={gwUrl}
        target="_blank"
        rel="noreferrer"
        className="library-control mb-3 mr-2 inline-flex items-center gap-1"
      >
        <BookOpen size={16} /> {passage} en RVR1960 <ExternalLink size={13} />
      </a>
      {state !== 'ok' && (
        <button
          type="button"
          onClick={load}
          disabled={state === 'loading'}
          className="library-control disabled:opacity-50"
        >
          <BookOpen size={16} /> {state === 'loading' ? 'Cargando…' : `Leer ${passage}`}
        </button>
      )}
      {msg && <p className="text-sm mt-3 text-red-700 dark:text-red-400">{msg}</p>}
      {state === 'ok' && (
        <article className="library-reading bg-[#fffdf8] dark:bg-[#18241d] rounded-2xl px-5 py-4 shadow-sm">
          <p className="font-semibold mb-2">
            {reference} · Reina-Valera 1909
          </p>
          <p className="whitespace-pre-wrap">{text}</p>
        </article>
      )}
    </details>
  );
};
