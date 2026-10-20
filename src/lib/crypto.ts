// マスターパスワードから鍵を作り、AES-GCMで暗号化する。
// 鍵はメモリ上にのみ保持し、どこにも保存しない。

const PBKDF2_ITERATIONS = 600_000;

export interface EncryptedEnvelope {
  format: 'my-subsucanri';
  v: 1;
  kdf: { name: 'PBKDF2'; hash: 'SHA-256'; iterations: number; salt: string };
  iv: string;
  ciphertext: string;
}

export interface Vault {
  key: CryptoKey;
  salt: Uint8Array;
  iterations: number;
}

function toBase64(bytes: Uint8Array): string {
  let s = '';
  for (const b of bytes) s += String.fromCharCode(b);
  return btoa(s);
}

function fromBase64(text: string): Uint8Array {
  const s = atob(text);
  const bytes = new Uint8Array(s.length);
  for (let i = 0; i < s.length; i++) bytes[i] = s.charCodeAt(i);
  return bytes;
}

async function deriveKey(password: string, salt: Uint8Array, iterations: number): Promise<CryptoKey> {
  const material = await crypto.subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, [
    'deriveKey',
  ]);
  return crypto.subtle.deriveKey(
    { name: 'PBKDF2', hash: 'SHA-256', salt, iterations },
    material,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt'],
  );
}

export async function createVault(password: string): Promise<Vault> {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  return { key: await deriveKey(password, salt, PBKDF2_ITERATIONS), salt, iterations: PBKDF2_ITERATIONS };
}

export async function encrypt(vault: Vault, data: unknown): Promise<EncryptedEnvelope> {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const plain = new TextEncoder().encode(JSON.stringify(data));
  const cipher = new Uint8Array(await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, vault.key, plain));
  return {
    format: 'my-subsucanri',
    v: 1,
    kdf: { name: 'PBKDF2', hash: 'SHA-256', iterations: vault.iterations, salt: toBase64(vault.salt) },
    iv: toBase64(iv),
    ciphertext: toBase64(cipher),
  };
}

export class WrongPasswordError extends Error {
  constructor() {
    super('パスワードが違います');
  }
}

/** パスワードが違う場合は WrongPasswordError を投げる */
export async function decrypt<T>(envelope: EncryptedEnvelope, password: string): Promise<{ data: T; vault: Vault }> {
  if (envelope?.format !== 'my-subsucanri' || envelope.v !== 1) {
    throw new Error('このアプリのデータではありません');
  }
  const salt = fromBase64(envelope.kdf.salt);
  const key = await deriveKey(password, salt, envelope.kdf.iterations);
  let plain: ArrayBuffer;
  try {
    plain = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: fromBase64(envelope.iv) }, key, fromBase64(envelope.ciphertext));
  } catch {
    throw new WrongPasswordError();
  }
  return {
    data: JSON.parse(new TextDecoder().decode(plain)) as T,
    vault: { key, salt, iterations: envelope.kdf.iterations },
  };
}
