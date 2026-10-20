import { useState, type FormEvent } from 'react';
import { LockIcon } from '../components/Icons';
import { WrongPasswordError } from '../lib/crypto';
import { AUTO_LOCK_MINUTES } from '../lib/types';

interface Props {
  mode: 'setup' | 'unlock';
  onSubmit: (password: string) => Promise<void>;
}

export function LockScreen({ mode, onSubmit }: Props) {
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [understood, setUnderstood] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [shake, setShake] = useState(0);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    if (mode === 'setup') {
      if (password.length < 8) return setError('8文字以上にしてください');
      if (password !== confirm) return setError('確認用のパスワードが一致しません');
    }
    setBusy(true);
    try {
      await onSubmit(password);
    } catch (err) {
      setError(err instanceof WrongPasswordError ? 'パスワードが違います' : '開けませんでした');
      setShake((n) => n + 1);
      setBusy(false);
    }
  };

  return (
    <main className="lock">
      <div className="lock-badge" key={shake} data-shake={shake > 0}>
        <LockIcon size={44} />
      </div>
      <div className="lock-title">
        <h1>my subscriptions</h1>
        <p className="muted">
          {mode === 'setup' ? 'はじめに、マスターパスワードを決めてください' : 'マスターパスワードを入力してください'}
        </p>
      </div>
      <form className="lock-form" onSubmit={submit}>
        <input
          type="password"
          className="input input-lg"
          aria-label="マスターパスワード"
          placeholder="マスターパスワード"
          autoComplete={mode === 'setup' ? 'new-password' : 'current-password'}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoFocus
        />
        {mode === 'setup' && (
          <>
            <input
              type="password"
              className="input input-lg"
              aria-label="確認用にもう一度"
              placeholder="確認用にもう一度"
              autoComplete="new-password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
            />
            <label className="check">
              <input type="checkbox" checked={understood} onChange={(e) => setUnderstood(e.target.checked)} />
              <span>忘れるとデータは二度と開けないことを理解しました</span>
            </label>
          </>
        )}
        {error && (
          <p className="error" role="alert">
            {error}
          </p>
        )}
        <button className="btn btn-dark btn-lg" disabled={busy || !password || (mode === 'setup' && !understood)}>
          {busy ? 'ひらいています…' : mode === 'setup' ? 'はじめる' : 'ひらく'}
        </button>
      </form>
      <p className="muted small center">
        データはこの端末の中だけに暗号化して保存されます。
        <br />
        {AUTO_LOCK_MINUTES}分操作しないと自動でロックされます。
      </p>
    </main>
  );
}
