import { describe, expect, it } from 'vitest';
import { createVault, decrypt, encrypt, WrongPasswordError } from './crypto';

describe('crypto', () => {
  it('同じパスワードで復号できる', async () => {
    const vault = await createVault('correct horse');
    const envelope = await encrypt(vault, { hello: 'サブスク' });
    expect(envelope.ciphertext).not.toContain('サブスク');
    const { data } = await decrypt<{ hello: string }>(envelope, 'correct horse');
    expect(data.hello).toBe('サブスク');
  });

  it('違うパスワードでは復号できない', async () => {
    const vault = await createVault('correct horse');
    const envelope = await encrypt(vault, { a: 1 });
    await expect(decrypt(envelope, 'wrong')).rejects.toBeInstanceOf(WrongPasswordError);
  });

  it('暗号化のたびにIVが変わる', async () => {
    const vault = await createVault('pw');
    const a = await encrypt(vault, { a: 1 });
    const b = await encrypt(vault, { a: 1 });
    expect(a.iv).not.toBe(b.iv);
  });
});
