import React, { useEffect, useRef, useState } from 'react';
import { getPersonalMeta, importPersonalModule, clearPersonalModule, PersonalModuleMeta } from '../utils/personalBible';

// Panel "Mi Biblia personal": carga un módulo MyBible (.SQLite3) que ya está
// en el dispositivo del usuario. El archivo se lee y guarda solo localmente;
// nunca se envía a Internet.
export function PersonalBiblePanel() {
  const [meta, setMeta] = useState<PersonalModuleMeta | null>(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { getPersonalMeta().then(setMeta); }, []);

  async function onFile(f: File) {
    setBusy(true); setMsg('');
    try {
      const m = await importPersonalModule(f);
      setMeta(m);
      setMsg(`Listo: ${m.name} · ${m.bookCount} libros · ${m.verseCount.toLocaleString('es-AR')} versículos. Ya funciona sin conexión al tocar una cita.`);
    } catch (e: any) {
      setMsg(e?.message || 'No se pudo leer el archivo.');
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  }

  async function onClear() {
    if (!confirm('¿Quitar tu Biblia personal de este dispositivo? Tus estudios no se tocan.')) return;
    setBusy(true);
    await clearPersonalModule();
    setMeta(null); setMsg('Biblia personal quitada. Las citas vuelven a mostrar Reina-Valera 1909 sin conexión.');
    setBusy(false);
  }

  return (
    <details className="mt-5 text-sm">
      <summary className="cursor-pointer py-3">Mi Biblia personal</summary>
      <p className="mb-3 opacity-75">
        Si tenés un módulo de Biblia de MyBible (archivo .SQLite3) en este dispositivo, podés cargarlo acá:
        al tocar una cita, el pasaje se muestra con tu versión, sin conexión. El archivo se guarda solo en este
        dispositivo; no se sube a Internet.
      </p>
      {meta ? (
        <div className="mb-3">
          <p><strong>{meta.name}</strong>{meta.language ? ` · ${meta.language}` : ''} · {meta.bookCount} libros · {meta.verseCount.toLocaleString('es-AR')} versículos</p>
          <p className="opacity-60 text-xs mt-1">Cargada desde {meta.fileName} el {new Date(meta.importedAt).toLocaleString('es-AR')}</p>
          <button className="library-control mt-3" disabled={busy} onClick={onClear}>Quitar mi Biblia personal</button>
        </div>
      ) : (
        <input
          ref={inputRef}
          aria-label="Cargar módulo MyBible"
          type="file"
          accept=".SQLite3,.sqlite3,.sqlite,.db"
          disabled={busy}
          onChange={e => { const f = e.target.files?.[0]; if (f) onFile(f); }}
        />
      )}
      {busy && <p className="mt-2">Leyendo el archivo…</p>}
      {msg && <p className="mt-2">{msg}</p>}
    </details>
  );
}
