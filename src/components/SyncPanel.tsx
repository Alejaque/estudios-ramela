import React, { useEffect, useState } from 'react';
import {
  SyncState, Conflict, loadSyncState, clearSyncState, activateSpace,
  createSpace, redeemCode, createPairCode, listConflicts, resolveConflict, syncNow,
} from '../sync';

// Panel "Sincronización entre dispositivos". Todo se guarda primero en el dispositivo;
// la nube (cuenta Cloudflare del usuario, plan gratis) replica entre tablet, celular y PC.
export function SyncPanel({ onSynced }: { onSynced?: () => void }) {
  const [st, setSt] = useState<SyncState | null>(() => loadSyncState());
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');
  const [flow, setFlow] = useState<'none' | 'main' | 'code'>('none');
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [recovery, setRecovery] = useState('');
  const [pairCode, setPairCode] = useState<{ code: string; expires_at: string } | null>(null);
  const [conflicts, setConflicts] = useState<Conflict[]>([]);

  useEffect(() => { if (st) listConflicts(st).then(r => setConflicts(r.json.conflicts || [])).catch(() => {}); }, [st]);

  async function doCreate() {
    if (!name.trim() || busy) return;
    setBusy(true); setMsg('');
    const r = await createSpace(name.trim());
    setBusy(false);
    if (r.status !== 201 || !r.json.device_key) { setMsg(r.json.error || 'No se pudo crear. Probá de nuevo.'); return; }
    setRecovery(r.json.recovery_phrase);
    const s = activateSpace(r.json.space_id, r.json.device_id, r.json.device_key, name.trim(), true);
    setSt(s); setFlow('none');
    doSync(s);
  }
  async function doRedeem() {
    if (!code.trim() || !name.trim() || busy) return;
    setBusy(true); setMsg('');
    const r = await redeemCode(code.trim(), name.trim());
    setBusy(false);
    if (r.status !== 201 || !r.json.device_key) { setMsg(r.json.error || 'Código vencido, usado o inexistente'); return; }
    const s = activateSpace(r.json.space_id, r.json.device_id, r.json.device_key, name.trim(), false);
    setSt(s); setFlow('none');
    doSync(s);
  }
  async function doSync(s?: SyncState) {
    const cur = s || st; if (!cur || busy) return;
    setBusy(true);
    const r = await syncNow(cur);
    setBusy(false);
    setSt(r.state); setMsg(r.msg);
    if (r.ok) onSynced?.();
    const cf = await listConflicts(r.state); setConflicts(cf.json.conflicts || []);
  }
  async function doPair() {
    if (!st || busy) return;
    setBusy(true);
    const r = await createPairCode(st);
    setBusy(false);
    if (r.json.code) { setPairCode({ code: r.json.code, expires_at: r.json.expires_at }); }
    else setMsg(r.json.error || 'No se pudo generar el código');
  }
  async function doResolve(cf: Conflict, action: 'keep_mine' | 'keep_server') {
    if (!st || busy) return;
    setBusy(true);
    await resolveConflict(st, cf.id, action);
    setBusy(false);
    // Después de "conservar la mía", forzar re-subida: borrar el hash local para que se detecte el cambio.
    if (action === 'keep_server') {
      // Aplicar el valor de la nube en este dispositivo.
      const { applyRemoteItem } = await import('../sync');
      applyRemoteItem(cf.collection, cf.key, cf.server_value);
    } else {
      const s = { ...st, hashes: { ...st.hashes } };
      delete s.hashes[cf.collection + '|' + cf.key];
      localStorage.setItem('er_sync_state', JSON.stringify(s));
      setSt(s);
    }
    doSync();
  }
  function unlink() {
    if (!confirm('¿Desvincular este dispositivo? Tus estudios quedan guardados acá; solo deja de sincronizar.')) return;
    clearSyncState(); setSt(null); setPairCode(null); setConflicts([]); setMsg('');
  }

  if (!st) {
    return (
      <details className="mt-5 text-sm">
        <summary className="cursor-pointer py-3">Sincronización entre dispositivos</summary>
        <p className="mb-3 opacity-75">Vinculá la tablet, el celular y la PC para ver tus estudios, ediciones y notas en todos. Todo sigue guardado en cada aparato y funciona sin señal; se sincroniza cuando hay internet.</p>
        {flow === 'none' && (
          <div className="flex flex-col gap-3">
            <button className="library-control" onClick={() => setFlow('main')}>Empezar en este dispositivo (soy el principal)</button>
            <button className="library-control" onClick={() => setFlow('code')}>Tengo un código de otro dispositivo</button>
          </div>
        )}
        {flow !== 'none' && (
          <div className="flex flex-col gap-3">
            <label className="flex flex-col gap-1">Nombre de este dispositivo
              <input className="library-control" placeholder={flow === 'main' ? 'Ej.: Tablet' : 'Ej.: Celular'} value={name} onChange={e => setName(e.target.value)} />
            </label>
            {flow === 'code' && (
              <label className="flex flex-col gap-1">Código que generó el otro dispositivo
                <input className="library-control" placeholder="Ej.: AB12CD" value={code} onChange={e => setCode(e.target.value.toUpperCase())} />
              </label>
            )}
            <button className="library-control" disabled={busy} onClick={flow === 'main' ? doCreate : doRedeem}>
              {busy ? 'Vinculando…' : 'Vincular'}
            </button>
            <button className="library-control" onClick={() => { setFlow('none'); setMsg(''); }}>Volver</button>
          </div>
        )}
        {msg && <p role="status" className="mt-2">{msg}</p>}
      </details>
    );
  }

  return (
    <details className="mt-5 text-sm">
      <summary className="cursor-pointer py-3">Sincronización entre dispositivos</summary>
      <p className="mb-2 opacity-75">Vinculado como <strong>{st.device_name}</strong>{st.is_primary ? ' (principal)' : ''}.</p>
      {recovery && (
        <div className="mb-3 rounded border border-yellow-500 p-3">
          <p className="font-semibold">Anotá esta frase en papel y guardala:</p>
          <p className="my-2 select-all text-center text-lg font-bold tracking-widest">{recovery}</p>
          <p className="mb-2 opacity-75">Es la única forma de recuperar tu sincronización si perdés todos los dispositivos. No se muestra de nuevo.</p>
          <button className="library-control" onClick={() => setRecovery('')}>Ya la anoté en papel</button>
        </div>
      )}
      <div className="flex flex-col gap-3">
        <button className="library-control" disabled={busy} onClick={() => doSync()}>{busy ? 'Sincronizando…' : 'Sincronizar ahora'}</button>
        {st.is_primary && (
          <button className="library-control" disabled={busy} onClick={doPair}>Generar código para vincular otro dispositivo</button>
        )}
        <button className="library-control" onClick={unlink}>Desvincular este dispositivo</button>
      </div>
      {pairCode && (
        <div className="mt-3 rounded border border-green-600 p-3">
          <p className="font-semibold">Código para el otro dispositivo (dura 10 minutos, se usa una sola vez):</p>
          <p className="my-2 select-all text-center text-lg font-bold tracking-widest">{pairCode.code}</p>
        </div>
      )}
      {conflicts.length > 0 && (
        <div className="mt-3">
          <p className="font-semibold">Hay {conflicts.length} {conflicts.length === 1 ? 'cambio' : 'cambios'} hecho en dos dispositivos. Elegí cuál conservar (no se pierde nada sin tu decisión):</p>
          {conflicts.map(cf => (
            <div key={cf.id} className="mt-2 rounded border p-3">
              <p className="mb-2 opacity-75">{cf.collection === 'biblical_notes' ? 'Nota' : cf.collection === 'study_edits' ? 'Estudio editado' : cf.collection}: <strong>{cf.key.replace('biblical_notes_', '')}</strong></p>
              <div className="flex flex-col gap-2">
                <button className="library-control" disabled={busy} onClick={() => doResolve(cf, 'keep_mine')}>Conservar la versión de este dispositivo</button>
                <button className="library-control" disabled={busy} onClick={() => doResolve(cf, 'keep_server')}>Conservar la versión de la nube</button>
              </div>
            </div>
          ))}
        </div>
      )}
      {msg && <p role="status" className="mt-2">{msg}</p>}
    </details>
  );
}
