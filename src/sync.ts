// Cliente de sincronización entre dispositivos (tablet, celular, PC).
// Servicio propio: estudios-ramela-sync.ramelafutbol.workers.dev (cuenta Cloudflare del usuario, plan gratis).
// Local primero: todo sigue guardándose en este dispositivo; la nube replica. Sin señal, la app funciona igual.
// Los ítems son individuales (un estudio, una nota, un borrador): un conflicto en uno nunca toca a los demás.
// Nada se pisa sin decisión del usuario: lo divergente queda como conflicto y la versión descartada
// se guarda en "Versiones descartadas" (er_sync_trash), recuperable y parte de la copia de seguridad.

const API = (location.hostname === 'localhost' ? 'http://localhost:8788' : 'https://estudios-ramela-sync.ramelafutbol.workers.dev');

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
  server_value: string; client_value: string; client_deleted?: number;
  server_device_name?: string; client_device_name?: string; created_at: string;
};

export type TrashEntry = {
  collection: string; key: string; value: string; discarded_at: string; reason: string;
};

const STATE_KEY = 'er_sync_state';
const TRASH_KEY = 'er_sync_trash';

export function loadSyncState(): SyncState | null {
  try { const raw = localStorage.getItem(STATE_KEY); return raw ? JSON.parse(raw) : null; } catch { return null; }
}
function saveSyncState(s: SyncState) { localStorage.setItem(STATE_KEY, JSON.stringify(s)); }
export function clearSyncState() { localStorage.removeItem(STATE_KEY); }

// Papelera de versiones descartadas al resolver conflictos. Recuperable, se incluye en la copia de seguridad.
export function loadTrash(): TrashEntry[] {
  try { const raw = localStorage.getItem(TRASH_KEY); return raw ? JSON.parse(raw) : []; } catch { return []; }
}
export function addToTrash(e: TrashEntry) {
  const t = loadTrash();
  t.unshift(e);
  try { localStorage.setItem(TRASH_KEY, JSON.stringify(t.slice(0, 100))); } catch { /* espacio lleno: se conservan las más nuevas */ }
}
export function removeFromTrash(idx: number) {
  const t = loadTrash(); t.splice(idx, 1);
  localStorage.setItem(TRASH_KEY, JSON.stringify(t));
}

// Hash simple y estable para detectar cambios locales.
function hash(s: string): string {
  let h = 5381; for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) >>> 0;
  return h.toString(36) + ':' + s.length;
}

export type LocalItem = { collection: string; key: string; value: string; updated_at?: string };

function readJSON<T>(k: string, fallback: T): T {
  try { const raw = localStorage.getItem(k); return raw ? JSON.parse(raw) : fallback; } catch { return fallback; }
}

// Junta el contenido propio del usuario guardado en este dispositivo (ítem por ítem).
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

// Quita un ítem local porque otro dispositivo lo borró (lápida recibida de la nube).
export function applyRemoteDelete(collection: string, key: string) {
  if (collection === 'study_edits') {
    const m = readJSON<Record<string, unknown>>('study_edits', {});
    if (key in m) { delete m[key]; localStorage.setItem('study_edits', JSON.stringify(m)); }
  } else if (collection === 'biblical_drafts' || collection === 'reviewed_library_imports' || collection === 'personal_studies') {
    const arr = readJSON<{ id: string }[]>(collection, []);
    localStorage.setItem(collection, JSON.stringify(arr.filter(x => x.id !== key)));
  } else if (collection === 'biblical_notes') {
    localStorage.removeItem(key);
  } else if (collection === 'meta' && key === 'avatar') {
    localStorage.removeItem('alejandro_ramela_custom_avatar');
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
export async function recoverWithPhrase(phrase: string, deviceName: string) {
  return call<{ space_id: string; device_id: string; device_key: string; is_primary?: boolean; error?: string }>(
    '/recovery', { method: 'POST', body: JSON.stringify({ phrase, device_name: deviceName }) });
}
export type DeviceInfo = { id: string; name: string; is_primary: number; created_at: string; revoked: number };
export async function listDevices(st: SyncState) {
  return call<{ devices: DeviceInfo[] }>(`/spaces/${st.space_id}/devices`, {}, st.device_key);
}
export async function revokeDevice(st: SyncState, deviceId: string) {
  return call<{ ok?: boolean; error?: string }>(`/spaces/${st.space_id}/devices/${deviceId}`, { method: 'DELETE' }, st.device_key);
}
export async function promoteDevice(st: SyncState, deviceId: string) {
  return call<{ ok?: boolean; error?: string }>(`/spaces/${st.space_id}/devices/${deviceId}/promote`, { method: 'POST', body: '{}' }, st.device_key);
}
export async function rotatePhrase(st: SyncState) {
  return call<{ recovery_phrase?: string; error?: string }>(`/spaces/${st.space_id}/recovery-phrase`, { method: 'POST', body: '{}' }, st.device_key);
}
export async function createPairCode(st: SyncState) {
  return call<{ code: string; expires_at: string; error?: string }>(
    `/spaces/${st.space_id}/pair-codes`, { method: 'POST' }, st.device_key);
}
export async function listConflicts(st: SyncState) {
  return call<{ conflicts: Conflict[] }>(`/spaces/${st.space_id}/conflicts`, {}, st.device_key);
}
export async function resolveConflict(st: SyncState, id: string, action: 'keep_mine' | 'keep_server') {
  return call<{ ok: boolean; server_deleted?: number }>(`/spaces/${st.space_id}/conflicts/${id}?action=${action}`, { method: 'POST', body: '{}' }, st.device_key);
}
export function activateSpace(spaceId: string, deviceId: string, deviceKey: string, deviceName: string, isPrimary: boolean): SyncState {
  const st: SyncState = { space_id: spaceId, device_id: deviceId, device_key: deviceKey, device_name: deviceName, is_primary: isPrimary, last_rev: 0, hashes: {} };
  saveSyncState(st);
  return st;
}

// Etiqueta legible de un ítem para mostrar en conflictos y papelera.
export function itemLabel(collection: string, key: string, value?: string): string {
  if (collection === 'biblical_notes') return 'Nota de ' + key.replace('biblical_notes_', '');
  if (value) {
    try { const o = JSON.parse(value); if (o && typeof o.title === 'string' && o.title) return o.title; } catch { /* texto plano */ }
  }
  if (collection === 'study_edits') return 'Estudio editado';
  if (collection === 'personal_studies') return 'Estudio personal';
  if (collection === 'biblical_drafts') return 'Borrador';
  if (collection === 'reviewed_library_imports') return 'Estudio importado';
  if (collection === 'meta') return 'Imagen de perfil';
  return collection + ': ' + key;
}

// Resumen legible del contenido de un ítem para la comparación de versiones.
export function itemPreview(collection: string, value: string): { title: string; body: string; when: string } {
  let title = '', body = value, when = '';
  try {
    const o = JSON.parse(value);
    if (o && typeof o === 'object') {
      title = typeof o.title === 'string' ? o.title : '';
      body = typeof o.content === 'string' ? o.content : JSON.stringify(o, null, 1);
      when = (o.editedAt || o.updatedAt || o.createdAt || '') as string;
    }
  } catch { /* valor de texto plano (nota) */ }
  return { title, body, when };
}

// Sincroniza: sube lo que cambió (o se borró) en este dispositivo y baja lo que cambió en otros.
// Nunca pisa: lo que diverge queda como conflicto por ítem para que el usuario decida.
export async function syncNow(st: SyncState): Promise<{ ok: boolean; msg: string; state: SyncState; conflicts: number }> {
  try {
    const local = collectLocalItems();
    // No re-subir ítems con conflicto pendiente: el usuario decide primero (evita conflictos duplicados).
    const pending = await listConflicts(st);
    if (pending.status === 401) return { ok: false, msg: 'Este dispositivo fue desvinculado. Volvé a vincularlo.', state: st, conflicts: 0 };
    const pendingKeys = new Set((pending.json.conflicts || []).map(cf => cf.collection + '|' + cf.key));

    const localKeys = new Set(local.map(it => it.collection + '|' + it.key));
    // Cambios: ítems locales cuyo contenido difiere de la última sincronización.
    const changed = local.filter(it => st.hashes[it.collection + '|' + it.key] !== hash(it.value) && !pendingKeys.has(it.collection + '|' + it.key));
    // Borrados locales: ítems que estaban sincronizados y ya no están en este dispositivo.
    const deleted = Object.keys(st.hashes)
      .filter(k => !localKeys.has(k) && !pendingKeys.has(k))
      .map(k => { const [collection, ...rest] = k.split('|'); return { collection, key: rest.join('|'), deleted: true as const }; });

    if (changed.length || deleted.length) {
      const push = await call<{ applied?: { collection: string; key: string }[]; conflicts?: unknown[]; error?: string }>(
        `/spaces/${st.space_id}/items`,
        { method: 'POST', body: JSON.stringify({ changes: [...changed.map(c => ({ ...c, base_rev: st.last_rev })), ...deleted.map(d => ({ ...d, base_rev: st.last_rev }))] }) },
        st.device_key);
      if (push.status === 401) return { ok: false, msg: 'Este dispositivo fue desvinculado. Volvé a vincularlo.', state: st, conflicts: 0 };
      if (push.status !== 200) return { ok: false, msg: 'No se pudo subir. Probá de nuevo en un rato.', state: st, conflicts: 0 };
    }
    const pull = await call<{ items?: { collection: string; key: string; value: string; rev: number; deleted: number }[]; rev?: number; me?: { is_primary: boolean }; error?: string }>(
      `/spaces/${st.space_id}/items?since=${st.last_rev}`, {}, st.device_key);
    if (pull.status !== 200) return { ok: false, msg: 'No se pudo bajar. Probá de nuevo en un rato.', state: st, conflicts: 0 };
    const pushedKeys = new Set([...changed.map(c => c.collection + '|' + c.key), ...deleted.map(d => d.collection + '|' + d.key)]);
    for (const it of pull.json.items || []) {
      // Si este dispositivo también tocó ese ítem, su versión local ya está arriba o en conflicto: no tocar.
      if (pushedKeys.has(it.collection + '|' + it.key)) continue;
      if (pendingKeys.has(it.collection + '|' + it.key)) continue;
      if (it.deleted) {
        // Otro dispositivo lo borró. Si acá no cambió desde la última sincronización, se borra también;
        // si cambió, queda intacto y el próximo envío generará un conflicto para que el usuario decida.
        const localIt = local.find(x => x.collection === it.collection && x.key === it.key);
        if (!localIt) continue;
        if (st.hashes[it.collection + '|' + it.key] === hash(localIt.value)) applyRemoteDelete(it.collection, it.key);
        continue;
      }
      applyRemoteItem(it.collection, it.key, it.value);
    }
    const after = collectLocalItems();
    const hashes: Record<string, string> = {};
    for (const it of after) hashes[it.collection + '|' + it.key] = hash(it.value);
    // Si la nube dice que este dispositivo dejó de ser principal (recuperación o promoción
    // desde otro aparato), la pantalla se actualiza sola en esta sincronización.
    const next: SyncState = { ...st, last_rev: pull.json.rev ?? st.last_rev, hashes, is_primary: pull.json.me ? pull.json.me.is_primary : st.is_primary };
    saveSyncState(next);
    const cf = await listConflicts(next);
    return { ok: true, msg: 'Sincronizado', state: next, conflicts: (cf.json.conflicts || []).length };
  } catch {
    return { ok: false, msg: 'Sin conexión. Se sincroniza solo cuando haya señal.', state: st, conflicts: 0 };
  }
}
