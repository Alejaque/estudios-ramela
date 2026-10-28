import React, { useState } from 'react';

export interface StudyEditResult { title: string; content: string; }

function splitSections(content: string) {
  const parts = content.split(/\n(?=## )/);
  return parts.map((p) => {
    if (p.startsWith('## ')) {
      const nl = p.indexOf('\n');
      return nl === -1 ? { heading: p.slice(3), body: '' } : { heading: p.slice(3, nl), body: p.slice(nl + 1).replace(/^\n+/, '') };
    }
    return { heading: '', body: p };
  });
}

function joinSections(secs: { heading: string; body: string }[]) {
  return secs
    .map((s) => (s.heading ? `## ${s.heading}\n\n${s.body.replace(/\s+$/, '')}` : s.body.replace(/\s+$/, '')))
    .filter((s, i) => s !== '' || i === 0)
    .join('\n\n');
}

interface Props {
  title: string;
  content: string;
  size: number;
  onSave: (r: StudyEditResult) => void;
  onCancel: () => void;
}

export function StudyEditor({ title, content, size, onSave, onCancel }: Props) {
  const [t, setT] = useState(title);
  const [secs, setSecs] = useState(() => splitSections(content));
  const field = 'w-full rounded-xl border-2 border-[#8fa597] bg-white text-black p-4 leading-relaxed';
  const changed = t !== title || joinSections(secs) !== joinSections(splitSections(content));
  return (
    <div className="rounded-2xl border-2 border-[#315b46] bg-[#fffdf8] dark:bg-[#18241d] p-4 sm:p-6 space-y-5" style={{ fontSize: size }}>
      <div className="sticky top-[84px] z-20 flex flex-wrap gap-3 items-center bg-[#fffdf8] dark:bg-[#18241d] py-2">
        <button type="button" disabled={!changed} onClick={() => onSave({ title: t.trim() || title, content: joinSections(secs) })} className="library-control" style={{ minHeight: 52, fontSize: 18, background: '#315b46', color: 'white', opacity: changed ? 1 : 0.5 }}>Guardar cambios</button>
        <button type="button" onClick={() => { if (!changed || confirm('¿Salir sin guardar los cambios?')) onCancel(); }} className="library-control" style={{ minHeight: 52, fontSize: 18 }}>Cancelar</button>
        <span className="text-sm opacity-70">Tu texto original se conserva. Las <b>negritas</b> se escriben entre dos asteriscos: **así**.</span>
      </div>
      <label className="block font-bold">Título
        <input value={t} onChange={(e) => setT(e.target.value)} className={field + ' mt-2'} style={{ fontSize: 'inherit' }} />
      </label>
      {secs.map((s, i) => (
        <label key={i} className="block font-bold">{s.heading || 'Texto inicial'}
          <textarea
            value={s.body}
            onChange={(e) => setSecs(secs.map((x, j) => (j === i ? { ...x, body: e.target.value } : x)))}
            rows={Math.min(24, Math.max(4, Math.ceil(s.body.length / 38)))}
            className={field + ' mt-2 font-serif font-normal'}
            style={{ fontSize: 'inherit' }}
          />
        </label>
      ))}
    </div>
  );
}
