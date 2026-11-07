import React, { Fragment, useState } from 'react';

export interface StudyEditResult { title: string; content: string; passageText?: string; passageLabel?: string; }

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
  /** Si el estudio trae pasaje, viene precargado; si no, la seccion aparece igual para pegar uno. */
  passageText?: string;
  passageLabel?: string;
  size: number;
  onSave: (r: StudyEditResult) => void;
  onCancel: () => void;
}

export function StudyEditor({ title, content, passageText, passageLabel, size, onSave, onCancel }: Props) {
  const [t, setT] = useState(title);
  const [secs, setSecs] = useState(() => splitSections(content));
  const [pt, setPt] = useState(passageText ?? '');
  const [pl, setPl] = useState(passageLabel ?? '');
  const field = 'w-full rounded-xl border-2 border-[#8fa597] bg-white text-black p-4 leading-relaxed';
  const firstPoint = secs.findIndex((x) => /^\s*(##\s+)?I[.)\s]/.test(x.heading || ''));
  const passageAt = firstPoint > 0 ? firstPoint - 1 : -1;
  const changed = t !== title || joinSections(secs) !== joinSections(splitSections(content)) || pt !== (passageText ?? '') || pl !== (passageLabel ?? '');
  return (
    <div className="rounded-2xl border-2 border-[#315b46] bg-[#fffdf8] dark:bg-[#18241d] p-4 sm:p-6 space-y-5" style={{ fontSize: size }}>
      <div className="sticky top-[84px] z-20 flex flex-wrap gap-3 items-center bg-[#fffdf8] dark:bg-[#18241d] py-2">
        <button type="button" disabled={!changed} onClick={() => onSave({ title: t.trim() || title, content: joinSections(secs), passageText: pt, passageLabel: pl })} className="library-control" style={{ minHeight: 52, fontSize: 18, background: '#315b46', color: 'white', opacity: changed ? 1 : 0.5 }}>Guardar cambios</button>
        <button type="button" onClick={() => { if (!changed || confirm('¿Salir sin guardar los cambios?')) onCancel(); }} className="library-control" style={{ minHeight: 52, fontSize: 18 }}>Cancelar</button>
        <span className="text-sm opacity-70">Tu texto original se conserva. Las <b>negritas</b> se escriben entre dos asteriscos: **así**.</span>
      </div>
      <label className="block font-bold">Título
        <input value={t} onChange={(e) => setT(e.target.value)} className={field + ' mt-2'} style={{ fontSize: 'inherit' }} />
      </label>
      {secs.map((s, i) => (
        <Fragment key={i}>
        <label className="block font-bold">{s.heading || 'Texto inicial'}
          <textarea
            value={s.body}
            onChange={(e) => setSecs(secs.map((x, j) => (j === i ? { ...x, body: e.target.value } : x)))}
            rows={Math.min(24, Math.max(4, Math.ceil(s.body.length / 38)))}
            className={field + ' mt-2 font-serif font-normal'}
            style={{ fontSize: 'inherit' }}
          />
        </label>
        {i === passageAt && (
        <div className="rounded-xl border-2 border-dashed border-[#c9b977] p-4 space-y-4">
          <p className="font-bold">Pasaje</p>
          <label className="block font-bold">Etiqueta (referencia y versión)
            <input value={pl} onChange={(e) => setPl(e.target.value)} placeholder="Pasaje" className={field + ' mt-2'} style={{ fontSize: 'inherit' }} />
          </label>
          <label className="block font-bold">Texto del pasaje
            <textarea
              value={pt}
              onChange={(e) => setPt(e.target.value)}
              placeholder="Pegá acá el texto del pasaje"
              rows={Math.min(24, Math.max(6, Math.ceil(pt.length / 38)))}
              className={field + ' mt-2 font-serif font-normal'}
              style={{ fontSize: 'inherit' }}
            />
          </label>
          <p className="text-sm opacity-70">{passageText === undefined && !pt
            ? 'Este estudio todavía no tiene pasaje propio: pegalo acá y va a aparecer como bloque "Pasaje" en el apunte y en Saltos del púlpito. Ajustá la etiqueta con la referencia y versión correctas.'
            : 'Podés borrarlo y pegar otro texto; ajustá la etiqueta para que diga la referencia y versión correctas. Si lo dejás vacío, el bloque Pasaje se oculta hasta que pegues uno nuevo.'} Se guarda en este dispositivo (no se sincroniza con otros); tu texto original se conserva.</p>
        </div>
        )}
        </Fragment>
      ))}
      {passageAt === -1 && (
        <div className="rounded-xl border-2 border-dashed border-[#c9b977] p-4 space-y-4">
          <p className="font-bold">Pasaje</p>
          <label className="block font-bold">Etiqueta (referencia y versión)
            <input value={pl} onChange={(e) => setPl(e.target.value)} placeholder="Pasaje" className={field + ' mt-2'} style={{ fontSize: 'inherit' }} />
          </label>
          <label className="block font-bold">Texto del pasaje
            <textarea
              value={pt}
              onChange={(e) => setPt(e.target.value)}
              placeholder="Pegá acá el texto del pasaje"
              rows={Math.min(24, Math.max(6, Math.ceil(pt.length / 38)))}
              className={field + ' mt-2 font-serif font-normal'}
              style={{ fontSize: 'inherit' }}
            />
          </label>
          <p className="text-sm opacity-70">{passageText === undefined && !pt
            ? 'Este estudio todavía no tiene pasaje propio: pegalo acá y va a aparecer como bloque "Pasaje" en el apunte y en Saltos del púlpito. Ajustá la etiqueta con la referencia y versión correctas.'
            : 'Podés borrarlo y pegar otro texto; ajustá la etiqueta para que diga la referencia y versión correctas. Si lo dejás vacío, el bloque Pasaje se oculta hasta que pegues uno nuevo.'} Se guarda en este dispositivo (no se sincroniza con otros); tu texto original se conserva.</p>
        </div>
      )}
    </div>
  );
}
