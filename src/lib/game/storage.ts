import type { Conversation } from "./types";
import { DEFAULT_CONVERSATIONS } from "./defaults";

const KEY = "ayp.conversations.v1";

export function loadConversations(): Conversation[] {
  if (typeof window === "undefined") return DEFAULT_CONVERSATIONS;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return DEFAULT_CONVERSATIONS;
    const parsed = JSON.parse(raw) as Conversation[];
    return Array.isArray(parsed) && parsed.length ? parsed : DEFAULT_CONVERSATIONS;
  } catch {
    return DEFAULT_CONVERSATIONS;
  }
}

export function saveConversations(list: Conversation[]) {
  window.localStorage.setItem(KEY, JSON.stringify(list));
}

/* ---------- Audio clips (IndexedDB, keyed by dialogue line id) ---------- */

const DB = "ayp-audio";
const STORE = "clips";

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB, 1);
    req.onupgradeneeded = () => req.result.createObjectStore(STORE);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function tx<T>(mode: IDBTransactionMode, fn: (s: IDBObjectStore) => IDBRequest<T>) {
  const db = await openDb();
  return new Promise<T>((resolve, reject) => {
    const t = db.transaction(STORE, mode);
    const req = fn(t.objectStore(STORE));
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export const saveClip = (lineId: string, blob: Blob) => tx("readwrite", (s) => s.put(blob, lineId));
export const getClip = (lineId: string) => tx<Blob | undefined>("readonly", (s) => s.get(lineId));
export const deleteClip = (lineId: string) => tx("readwrite", (s) => s.delete(lineId));
export const listClipIds = async () =>
  (await tx<IDBValidKey[]>("readonly", (s) => s.getAllKeys())).map(String);
