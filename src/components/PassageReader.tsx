import React, { useEffect, useState } from 'react';
import { BookOpen, ExternalLink, X } from 'lucide-react';

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
  const [open1960, setOpen1960] = useState(false);
  const gwUrl = `https://www.biblegateway.com/passage/?search=${encodeURIComponent(passage)}&version=RVR1960&interface=print`;

  useEffect(() => {
    setText('');
    setReference('');
    setMsg('');
    setState('idle');
    setOpen1960(false);
  }, [passage]);

  useEffect(() => {
    if (!open1960) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen1960(false);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open1960]);

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
        Versión: <strong>Reina-Valera 1909</strong> (dominio público). No es la RVR1960: el texto y
        algunas palabras difieren. La RVR1960 sigue disponible en «Pasaje en RVR1960», abajo.
        Necesita Internet.
      </p>
      <button type="button" onClick={() => setOpen1960(true)} className="library-control mb-3 mr-2">
        <BookOpen size={16} /> Leer {passage} en RVR1960 (ventana)
      </button>
      {open1960 && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-2 sm:p-6" role="dialog" aria-modal="true" aria-label={`${passage} en RVR1960`}>
          <div className="bg-[#fffdf8] dark:bg-[#18241d] rounded-2xl shadow-xl w-full max-w-3xl h-[85vh] flex flex-col overflow-hidden">
            <div className="flex items-center justify-between gap-2 px-4 py-2 border-b border-[#cbd4c9] dark:border-[#405245]">
              <span className="font-semibold text-sm">{passage} · RVR1960 (vía BibleGateway)</span>
              <div className="flex items-center gap-3">
                <a href={gwUrl} target="_blank" rel="noreferrer" className="text-sm underline inline-flex items-center gap-1">
                  Abrir aparte <ExternalLink size={13} />
                </a>
                <button type="button" onClick={() => setOpen1960(false)} aria-label="Cerrar" className="library-control">
                  <X size={16} /> Cerrar
                </button>
              </div>
            </div>
            <iframe title={`${passage} RVR1960`} src={gwUrl} className="flex-1 w-full bg-white" referrerPolicy="no-referrer" />
            <p className="text-xs opacity-70 px-4 py-2">Texto de BibleGateway; necesita Internet. Si no carga, usá «Abrir aparte».</p>
          </div>
        </div>
      )}
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
