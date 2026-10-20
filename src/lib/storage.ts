import type { EncryptedEnvelope } from './crypto';

// 暗号化済みのデータだけをIndexedDBに保存する
const DB_NAME = 'my-subsucanri';
const STORE = 'vault';
const KEY = 'data';

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => req.result.createObjectStore(STORE);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function run<T>(mode: IDBTransactionMode, fn: (store: IDBObjectStore) => IDBRequest): Promise<T> {
  const db = await openDb();
  try {
    return await new Promise<T>((resolve, reject) => {
      const req = fn(db.transaction(STORE, mode).objectStore(STORE));
      req.onsuccess = () => resolve(req.result as T);
      req.onerror = () => reject(req.error);
    });
  } finally {
    db.close();
  }
}

export function loadEnvelope(): Promise<EncryptedEnvelope | undefined> {
  return run('readonly', (s) => s.get(KEY));
}

export async function saveEnvelope(envelope: EncryptedEnvelope): Promise<void> {
  await run('readwrite', (s) => s.put(envelope, KEY));
}

/** ブラウザに勝手に消されにくくするよう永続化を依頼する */
export async function requestPersistence(): Promise<void> {
  try {
    await navigator.storage?.persist?.();
  } catch {
    // 非対応ブラウザでは何もしない
  }
}
