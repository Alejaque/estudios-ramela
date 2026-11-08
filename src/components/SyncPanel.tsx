import React, { useEffect, useRef, useState } from 'react';
import {
  SyncState, Conflict, TrashEntry, loadSyncState, clearSyncState, activateSpace,
  createSpace, redeemCode, createPairCode, listConflicts, resolveConflict, syncNow,
  applyRemoteItem, loadTrash, addToTrash, removeFromTrash, itemLabel, itemPreview,
} from '../sync';

// Panel "Sincronización entre dispositivos". Todo se guarda primero en el dispositivo;
// la nube (cuenta Cloudflare del usuario, plan gratis) replica entre tablet, celular y PC.
// Nunca pisa: los cambios que chocan se muestran uno al lado del otro para elegir,
// y la versión descartada queda en "Versiones descartadas" por si hace falta recuperarla.
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
  const [trash, setTrash] = useState<TrashEntry[]>(() => loadTrash());
  const [showTrash, setShowTrash] = useState(false);
  const stRef = useRef(st); stRef.current = st;
  const busyRef = useRef(busy); busyRef.current = busy;

  async function refreshConflicts(s: SyncState) {
    try { const cf = await listConflicts(s); setConflicts(cf.json.conflicts || []); } catch { /* sin conexión */ }
  }
  useEffect(() => { if (st) refreshConflicts(st); }, [st?.space_id]);

  async function doSync(s?: SyncState) {
    const cur = s || stRef.current; if (!cur || busyRef.current) return;
    setBusy(true);
    const r = await syncNow(cur);
    setBusy(false);
    setSt(r.state); setMsg(r.msg);
    if (r.ok) { onSynced?.(); setTrash(loadTrash()); }
    await refreshConflicts(r.state);
  }
  const doSyncRef = useRef(doSync); doSyncRef.current = doSync;

  // Reconexión automática: al volver la señal (o al volver a la app) sincroniza solo.
  useEffect(() => {
    if (!st) return;
    const onOnline = () => { setMsg('Volvió la conexión. Sincronizando…'); doSyncRef.current(); };
    const onVisible = () => { if (document.visibilityState === 'visible') doSyncRef.current(); };
    window.addEventListener('online', onOnline);
    document.addEventListener('visibilitychange', onVisible);
    return () => { window.removeEventListener('online', onOnline); document.removeEventListener('visibilitychange', onVisible); };
  }, [st?.space_id]);

  async function doCreate() {
    if (!name.trim() || busy) return;
    setBusy(true); setMsg('');
    const r = await createSpace(name.trim());
    setBusy(false);
    if (r.status !== 201 || !r.json.device_key) { setMsg(r.json.error || 'No se pudo crear. Probá de nuevo.'); return; }
    setRecovery(r.json.recovery_phrase);
    const s = activateSpace(r.json.space_id, r.json.device_id, r.json.device_key, name.trim(), true);
    setSt(s); setFlow('none');
    busyRef.current = false; // setBusy(false) aún no corrió: destrabar la primera sincronización
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
    busyRef.current = false; // idem: destrabar la primera sincronización
    doSync(s);
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
    const r = await resolveConflict(st, cf.id, action);
    setBusy(false); busyRef.current = false; // destrabar el doSync de abajo
    if (!r.json.ok) { setMsg('No se pudo resolver. Probá de nuevo.'); return; }
    // La versión descartada no se pierde: queda en "Versiones descartadas".
    const discarded = action === 'keep_mine' ? cf.server_value : (cf.client_deleted ? '' : cf.client_value);
    if (discarded) addToTrash({
      collection: cf.collection, key: cf.key, value: discarded,
      discarded_at: new Date().toISOString(),
      reason: action === 'keep_mine' ? 'Se conservó la versión de este dispositivo' : 'Se conservó la versión de la nube',
    });
    if (action === 'keep_server') {
      // Aplicar en este dispositivo lo que quedó en la nube (si la nube lo tiene; si allá se borró, se borra acá).
      if (cf.server_value) applyRemoteItem(cf.collection, cf.key, cf.server_value);
      else { const { applyRemoteDelete } = await import('../sync'); applyRemoteDelete(cf.collection, cf.key); }
      onSynced?.();
    }
    // keep_mine: la nube ya quedó con mi versión; el próximo pull iguala las marcas.
    setTrash(loadTrash());
    doSync();
  }
  function restoreTrash(idx: number) {
    const e = trash[idx]; if (!e) return;
    applyRemoteItem(e.collection, e.key, e.value);
    removeFromTrash(idx);
    setTrash(loadTrash());
    setMsg('Versión recuperada en este dispositivo. Se sube a la nube en la próxima sincronización.');
    onSynced?.();
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
      <p className="mb-2 opacity-75">Vinculado como <strong>{st.device_name}</strong>{st.is_primary ? ' (principal)' : ''}. Se sincroniza solo al volver la señal o al abrir la app.</p>
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
          <p className="font-semibold">Hay {conflicts.length} {conflicts.length === 1 ? 'cambio' : 'cambios'} hecho en dos dispositivos a la vez. Compará las dos versiones y elegí cuál queda; la otra queda guardada en "Versiones descartadas" por si la necesitás.</p>
          {conflicts.map(cf => {
            const mine = cf.client_deleted ? null : itemPreview(cf.collection, cf.client_value);
            const theirs = cf.server_value ? itemPreview(cf.collection, cf.server_value) : null;
            return (
              <div key={cf.id} className="mt-2 rounded border p-3">
                <p className="mb-2 font-semibold">{itemLabel(cf.collection, cf.key, cf.client_value || cf.server_value)}</p>
                <div className="grid gap-2 sm:grid-cols-2">
                  <div className="rounded border p-2">
                    <p className="mb-1 text-xs opacity-75">En este dispositivo ({cf.client_device_name || st.device_name}){mine?.when ? ' · ' + new Date(mine.when).toLocaleString('es-AR') : ''}</p>
                    {mine
                      ? <pre className="max-h-40 overflow-auto whitespace-pre-wrap text-xs">{mine.body}</pre>
                      : <p className="text-xs italic opacity-75">Lo borraste en este dispositivo.</p>}
                    <button className="library-control mt-2 w-full" disabled={busy} onClick={() => doResolve(cf, 'keep_mine')}>
                      {cf.client_deleted ? 'Confirmar el borrado' : 'Conservar esta versión'}
                    </button>
                  </div>
                  <div className="rounded border p-2">
                    <p className="mb-1 text-xs opacity-75">En la nube ({cf.server_device_name || 'otro dispositivo'}){theirs?.when ? ' · ' + new Date(theirs.when).toLocaleString('es-AR') : ''}</p>
                    {theirs
                      ? <pre className="max-h-40 overflow-auto whitespace-pre-wrap text-xs">{theirs.body}</pre>
                      : <p className="text-xs italic opacity-75">Se borró desde el otro dispositivo.</p>}
                    <button className="library-control mt-2 w-full" disabled={busy} onClick={() => doResolve(cf, 'keep_server')}>
                      {theirs ? 'Conservar esta versión' : 'Confirmar el borrado'}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
      {trash.length > 0 && (
        <div className="mt-3">
          <button className="underline text-sm py-2" onClick={() => setShowTrash(!showTrash)}>
            Versiones descartadas ({trash.length}){showTrash ? ' — ocultar' : ''}
          </button>
          {showTrash && (
            <div className="mt-1">
              <p className="mb-2 opacity-75 text-xs">Versiones que no elegiste al resolver diferencias. Podés recuperar cualquiera.</p>
              {trash.map((e, i) => {
                const p = itemPreview(e.collection, e.value);
                return (
                  <div key={i} className="mt-2 rounded border p-2">
                    <p className="text-xs opacity-75">{itemLabel(e.collection, e.key, e.value)} · descartada el {new Date(e.discarded_at).toLocaleString('es-AR')}</p>
                    <pre className="mt-1 max-h-28 overflow-auto whitespace-pre-wrap text-xs">{p.body}</pre>
                    <button className="library-control mt-2" onClick={() => restoreTrash(i)}>Recuperar esta versión</button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
      {msg && <p role="status" className="mt-2">{msg}</p>}
    </details>
  );
}
