import React, { useState, useEffect } from 'react';
import type { SavedStudy } from '../types';
import { StudyEditor, type StudyEditResult } from './StudyEditor';

const EMPTY_OUTLINE = '## Introducción\n\n\n## Proposición\n\n\n## Contexto\n\n\n## I. Punto principal\n\n\n## Conclusión\n\n\n## Llamado a la acción\n\n\n## Oración\n';

export function NewManualStudy({ onSave, onCancel }: {
  onSave: (study: SavedStudy) => string | null;
  onCancel: () => void;
}) {
  const [reference, setReference] = useState('');
  const [version, setVersion] = useState('');
  const [error, setError] = useState('');
  useEffect(() => { const warn = (e: BeforeUnloadEvent) => { e.preventDefault(); e.returnValue = ''; }; window.addEventListener('beforeunload', warn); return () => window.removeEventListener('beforeunload', warn); }, []);
  function save(edit: StudyEditResult) {
    if (!edit.title.trim() || !reference.trim()) {
      setError('Completá el título y la referencia del pasaje antes de guardar.');
      return;
    }
    const study: SavedStudy = {
      id: 'manual-' + crypto.randomUUID(),
      title: edit.title.trim(), passageOrTopic: reference.trim(),
      translation: version.trim() || undefined,
      content: edit.content, createdAt: new Date().toISOString(),
      passageText: edit.passageText,
      passageLabel: edit.passageLabel?.trim() || `Pasaje: ${reference.trim()}${version.trim() ? ' · ' + version.trim() : ''}`,
      manual: true,
    };
    const failure = onSave(study);
    if (failure) setError(failure);
  }
  return <section lang="es-AR" spellCheck={true} autoCorrect="off" className="min-w-0 lg:col-span-2 w-full max-w-4xl mx-auto" aria-label="Nuevo estudio en blanco">
    <h2 className="font-serif text-3xl mb-3">Nuevo estudio en blanco</h2>
    <p className="mb-4">Lo escribís vos, sin IA. Se guarda como un estudio nuevo en tu biblioteca, sin reemplazar los anteriores. Las citas que escribas, como Juan 6:35, se podrán abrir también en Púlpito.</p>
    <label className="block font-bold mb-4">Referencia del pasaje
      <input autoFocus value={reference} onChange={e => setReference(e.target.value)} placeholder="Por ejemplo: Juan 6:30-40" className="library-control w-full bg-transparent mt-2" />
    </label>
    <label className="block font-bold mb-4">Versión del texto que pegues (opcional)
      <input value={version} onChange={e => setVersion(e.target.value)} placeholder="Indicá la versión solo si pegás su texto" className="library-control w-full bg-transparent mt-2" />
    </label>
    <p className="text-sm mb-4">No se agrega texto bíblico automáticamente. Podés pegar tu pasaje en su campo; las citas se consultan con la Biblia disponible en este equipo.</p>
    {error && <p role="alert" className="p-4 mb-4 rounded-xl bg-[#f1e7c8] text-black">{error}</p>}
    <StudyEditor title="" content={EMPTY_OUTLINE} size={22} manual saveLabel="Guardar estudio nuevo" alwaysSave confirmCancel={false} onSave={save} onCancel={() => { if (confirm('¿Cerrar el estudio nuevo sin guardarlo?')) onCancel(); }} />
  </section>;
}
