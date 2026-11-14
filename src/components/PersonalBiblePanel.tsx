import React, { useEffect, useRef, useState } from 'react';
import { listPersonalModules, importPersonalModule, removePersonalModule, setActiveModule, PersonalModuleMeta } from '../utils/personalBible';

// Panel "Mi Biblia personal": carga módulos MyBible (.SQLite3) que ya están
// en el dispositivo del usuario. Se puede tener más de uno (p.ej. RVR1960 y
// PDT) y elegir cuál usan las citas. Los archivos se leen y guardan solo
// localmente; nunca se envían a Internet.
export function PersonalBiblePanel() {
  const [modules, setModules] = useState<PersonalModuleMeta[]>([]);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  async function reload() { setModules(await listPersonalModules()); }
  useEffect(() => { reload(); }, []);

  async function onFile(f: File) {
    setBusy(true); setMsg('');
    try {
      const m = await importPersonalModule(f);
      await reload();
      setMsg(`Listo: ${m.name} · ${m.bookCount} libros · ${m.verseCount.toLocaleString('es-AR')} versículos. Ya funciona sin conexión al tocar una cita.`);
    } catch (e: any) {
      setMsg(e?.message || 'No se pudo leer el archivo.');
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  }

  async function onUse(m: PersonalModuleMeta) {
    if (!m.id) return;
    setBusy(true); setMsg('');
    await setActiveModule(m.id);
    await reload();
    setMsg(`Las citas ahora se muestran con ${m.name}.`);
    setBusy(false);
  }

  async function onRemove(m: PersonalModuleMeta) {
    if (!m.id) return;
    if (!confirm(`¿Quitar "${m.name}" de este dispositivo? Tus estudios no se tocan.`)) return;
    setBusy(true); setMsg('');
    await removePersonalModule(m.id);
    await reload();
    setMsg('Biblia personal quitada.' + (modules.length <= 1 ? ' Las citas vuelven a mostrar Reina-Valera 1909 sin conexión.' : ''));
    setBusy(false);
  }

  return (
    <details className="mt-5 text-sm">
      <summary className="cursor-pointer py-3">Mi Biblia personal</summary>
      <p className="mb-3 opacity-75">
        Si tenés módulos de Biblia de MyBible (archivos .SQLite3) en este dispositivo, podés cargarlos acá:
        al tocar una cita, el pasaje se muestra con tu versión, sin conexión. Los archivos se guardan solo en este
        dispositivo; no se suben a Internet.
      </p>
      {modules.map(m => (
        <div key={m.id} className="mb-3 border rounded-xl p-3 border-[#cbd4c9] dark:border-[#405245]">
          <p><strong>{m.name}</strong>{m.language ? ` · ${m.language}` : ''} · {m.bookCount} libros · {m.verseCount.toLocaleString('es-AR')} versículos</p>
          <p className="opacity-60 text-xs mt-1">Cargada desde {m.fileName} el {new Date(m.importedAt).toLocaleString('es-AR')}</p>
          <div className="flex flex-wrap gap-2 mt-3">
            {m.active
              ? <span className="library-control" aria-current="true">En uso</span>
              : <button className="library-control" disabled={busy} onClick={() => onUse(m)}>Usar esta Biblia</button>}
            <button className="library-control" disabled={busy} onClick={() => onRemove(m)}>Quitar</button>
          </div>
        </div>
      ))}
      <label className="library-control cursor-pointer inline-flex">
        {modules.length ? 'Cargar otro módulo' : 'Seleccionar archivo'}
        <input
          ref={inputRef}
          aria-label="Cargar módulo MyBible"
          className="hidden"
          type="file"
          accept=".SQLite3,.sqlite3,.sqlite,.db"
          disabled={busy}
          onChange={e => { const f = e.target.files?.[0]; if (f) onFile(f); }}
        />
      </label>
      {busy && <p className="mt-2">Leyendo el archivo…</p>}
      {msg && <p className="mt-2">{msg}</p>}
    </details>
  );
}
