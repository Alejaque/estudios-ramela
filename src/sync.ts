// Cliente de sincronización entre dispositivos (tablet, celular, PC).
// Servicio propio: estudios-ramela-sync.ramelafutbol.workers.dev (cuenta Cloudflare del usuario, plan gratis).
// Local primero: todo sigue guardándose en este dispositivo; la nube replica. Sin señal, la app funciona igual.

const API = 'https://estudios-ramela-sync.ramelafutbol.workers.dev';

export type SyncState = {
  space_id: string;
  device_id: string;
  device_key: string;
  device_name: string;
  is_primary: boolean;
  last_rev: number;
  hashes: Record<string, string>; // "coll|key" -> hash del valor en la última sincronización
};

export type Conflict = {
  id: string; collection: string; key: string;
  server_value: string; client_value: string;
  server_device: string; client_device: string; created_at: string;
};

const STATE_KEY = 'er_sync_state';

export function loadSyncState(): SyncState | null {
  try { const raw = localStorage.getItem(STATE_KEY); return raw ? JSON.parse(raw) : null; } catch { return null; }
}
function saveSyncState(s: SyncState) { localStorage.setItem(STATE_KEY, JSON.stringify(s)); }
export function clearSyncState() { localStorage.removeItem(STATE_KEY); }

// Hash simple y estable para detectar cambios locales.
function hash(s: string): string {
  let h = 5381; for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) >>> 0;
  return h.toString(36) + ':' + s.length;
}

export type LocalItem = { collection: string; key: string; value: string; updated_at?: string };

function readJSON<T>(k: string, fallback: T): T {
  try { const raw = localStorage.getItem(k); return raw ? JSON.parse(raw) : fallback; } catch { return fallback; }
}

// Junta el contenido propio del usuario guardado en este dispositivo.
export function collectLocalItems(): LocalItem[] {
  const items: LocalItem[] = [];
  const edits = readJSON<Record<string, { editedAt?: string }>>('study_edits', {});
  for (const [id, v] of Object.entries(edits)) items.push({ collection: 'study_edits', key: id, value: JSON.stringify(v), updated_at: v.editedAt });
  const drafts = readJSON<{ id: string; createdAt?: string }[]>('biblical_drafts', []);
  for (const d of drafts) items.push({ collection: 'biblical_drafts', key: d.id, value: JSON.stringify(d), updated_at: d.createdAt });
  const imported = readJSON<{ id: string; createdAt?: string }[]>('reviewed_library_imports', []);
  for (const d of imported) items.push({ collection: 'reviewed_library_imports', key: d.id, value: JSON.stringify(d), updated_at: d.createdAt });
  const personal = readJSON<{ id: string; updatedAt?: string; createdAt?: string }[]>('personal_studies', []);
  for (const p of personal) items.push({ collection: 'personal_studies', key: p.id, value: JSON.stringify(p), updated_at: p.updatedAt || p.createdAt });
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i)!;
    if (k.startsWith('biblical_notes_')) items.push({ collection: 'biblical_notes', key: k, value: localStorage.getItem(k) || '' });
  }
  const avatar = localStorage.getItem('alejandro_ramela_custom_avatar');
  if (avatar) items.push({ collection: 'meta', key: 'avatar', value: avatar });
  return items;
}

// Escribe un ítem recibido de la nube en el almacenamiento local, sin tocar lo demás.
export function applyRemoteItem(collection: string, key: string, value: string) {
  if (collection === 'study_edits') {
    const m = readJSON<Record<string, unknown>>('study_edits', {}); m[key] = JSON.parse(value);
    localStorage.setItem('study_edits', JSON.stringify(m));
  } else if (collection === 'biblical_drafts' || collection === 'reviewed_library_imports' || collection === 'personal_studies') {
    const lsKey = collection;
    const arr = readJSON<{ id: string }[]>(lsKey, []);
    const obj = JSON.parse(value);
    const i = arr.findIndex(x => x.id === obj.id);
    if (i >= 0) arr[i] = obj; else arr.push(obj);
    localStorage.setItem(lsKey, JSON.stringify(arr));
  } else if (collection === 'biblical_notes') {
    localStorage.setItem(key, value);
  } else if (collection === 'meta' && key === 'avatar') {
    localStorage.setItem('alejandro_ramela_custom_avatar', value);
  }
}

async function call<T>(path: string, opts: RequestInit = {}, key?: string): Promise<{ status: number; json: T }> {
  const res = await fetch(API + path, {
    ...opts,
    headers: { 'Content-Type': 'application/json', ...(key ? { Authorization: `Bearer ${key}` } : {}), ...(opts.headers || {}) },
  });
  return { status: res.status, json: await res.json().catch(() => ({} as T)) };
}

export async function createSpace(deviceName: string) {
  return call<{ space_id: string; device_id: string; device_key: string; recovery_phrase: string; error?: string }>(
    '/spaces', { method: 'POST', body: JSON.stringify({ name: 'Mis estudios', device_name: deviceName }) });
}
export async function redeemCode(code: string, deviceName: string) {
  return call<{ space_id: string; device_id: string; device_key: string; error?: string }>(
    '/pair-codes/redeem', { method: 'POST', body: JSON.stringify({ code, device_name: deviceName }) });
}
export async function createPairCode(st: SyncState) {
  return call<{ code: string; expires_at: string; error?: string }>(
    `/spaces/${st.space_id}/pair-codes`, { method: 'POST' }, st.device_key);
}
export async function listConflicts(st: SyncState) {
  return call<{ conflicts: Conflict[] }>(`/spaces/${st.space_id}/conflicts`, {}, st.device_key);
}
export async function resolveConflict(st: SyncState, id: string, action: 'keep_mine' | 'keep_server') {
  return call<{ ok: boolean }>(`/spaces/${st.space_id}/conflicts/${id}?action=${action}`, { method: 'POST', body: '{}' }, st.device_key);
}
export function activateSpace(spaceId: string, deviceId: string, deviceKey: string, deviceName: string, isPrimary: boolean): SyncState {
  const st: SyncState = { space_id: spaceId, device_id: deviceId, device_key: deviceKey, device_name: deviceName, is_primary: isPrimary, last_rev: 0, hashes: {} };
  saveSyncState(st);
  return st;
}

// Sincroniza: sube lo que cambió en este dispositivo y baja lo que cambió en otros.
// Nunca pisa: lo que diverge queda como conflicto para que el usuario decida.
export async function syncNow(st: SyncState): Promise<{ ok: boolean; msg: string; state: SyncState; conflicts: number }> {
  try {
    const local = collectLocalItems();
    // No re-subir ítems con conflicto pendiente: el usuario decide primero (evita conflictos duplicados).
    const pending = await listConflicts(st);
    const pendingKeys = new Set((pending.json.conflicts || []).map(cf => cf.collection + '|' + cf.key));
    const changed = local.filter(it => st.hashes[it.collection + '|' + it.key] !== hash(it.value) && !pendingKeys.has(it.collection + '|' + it.key));
    if (changed.length) {
      const push = await call<{ applied?: { collection: string; key: string }[]; conflicts?: unknown[]; error?: string }>(
        `/spaces/${st.space_id}/items`,
        { method: 'POST', body: JSON.stringify({ changes: changed.map(c => ({ ...c, base_rev: st.last_rev })) }) },
        st.device_key);
      if (push.status === 401) return { ok: false, msg: 'Este dispositivo fue desvinculado. Volvé a vincularlo.', state: st, conflicts: 0 };
      if (push.status !== 200) return { ok: false, msg: 'No se pudo subir. Probá de nuevo en un rato.', state: st, conflicts: 0 };
    }
    const pull = await call<{ items?: { collection: string; key: string; value: string; rev: number }[]; rev?: number; error?: string }>(
      `/spaces/${st.space_id}/items?since=${st.last_rev}`, {}, st.device_key);
    if (pull.status !== 200) return { ok: false, msg: 'No se pudo bajar. Probá de nuevo en un rato.', state: st, conflicts: 0 };
    const pushedKeys = new Set(changed.map(c => c.collection + '|' + c.key));
    for (const it of pull.json.items || []) {
      // Si este dispositivo también cambió ese ítem, su versión local ya está arriba o en conflicto: no tocar.
      if (pushedKeys.has(it.collection + '|' + it.key)) continue;
      applyRemoteItem(it.collection, it.key, it.value);
    }
    const after = collectLocalItems();
    const hashes: Record<string, string> = {};
    for (const it of after) hashes[it.collection + '|' + it.key] = hash(it.value);
    const next: SyncState = { ...st, last_rev: pull.json.rev ?? st.last_rev, hashes };
    saveSyncState(next);
    const cf = await listConflicts(next);
    return { ok: true, msg: 'Sincronizado', state: next, conflicts: (cf.json.conflicts || []).length };
  } catch {
    return { ok: false, msg: 'Sin conexión. Se sincroniza solo cuando haya señal.', state: st, conflicts: 0 };
  }
}
