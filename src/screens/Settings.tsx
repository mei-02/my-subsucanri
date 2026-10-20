import { useRef, useState, type FormEvent } from 'react';
import { useFeedback } from '../components/Feedback';
import { TrashIcon } from '../components/Icons';
import { WrongPasswordError } from '../lib/crypto';
import { getTheme, setTheme, type Theme } from '../lib/theme';
import { AUTO_LOCK_MINUTES, newId, type AppData, type NamedItem, type Settings as SettingsData } from '../lib/types';
import { useApp } from '../state';

export function Settings() {
  const { data, update, lock, exportBackup } = useApp();
  const { toast } = useFeedback();

  const saveSetting = (key: keyof SettingsData, raw: string) => {
    const value = Number(raw);
    if (!(value > 0) || value === data.settings[key]) return;
    update((d) => ({ ...d, settings: { ...d.settings, [key]: value } })).then(() => toast('保存しました'));
  };

  return (
    <main className="screen with-nav">
      <h1 className="title">設定</h1>

      <h2 className="group-title">表示</h2>
      <ThemePicker />

      <h2 className="group-title">お金の表示</h2>
      <div className="card list-card">
        <NumberRow label="1ドルあたり" unit="円" value={data.settings.usdRate} onSave={(v) => saveSetting('usdRate', v)} />
        <NumberRow label="換算に使うランチ1回" unit="円" value={data.settings.lunchPrice} onSave={(v) => saveSetting('lunchPrice', v)} />
      </div>

      <h2 className="group-title">カテゴリ</h2>
      <NamedListEditor
        items={data.categories}
        usedIds={new Set(data.subscriptions.map((s) => s.categoryId))}
        placeholder="新しいカテゴリ"
        onChange={(categories) => update((d) => ({ ...d, categories }))}
      />

      <h2 className="group-title">支払方法</h2>
      <NamedListEditor
        items={data.paymentMethods}
        usedIds={new Set(data.subscriptions.map((s) => s.paymentMethodId))}
        placeholder="例：楽天カード"
        onChange={(paymentMethods) => update((d) => ({ ...d, paymentMethods }))}
      />

      <h2 className="group-title">セキュリティ</h2>
      <div className="card list-card">
        <div className="kv">
          <span>自動ロック</span>
          <strong>{AUTO_LOCK_MINUTES}分</strong>
        </div>
        <ChangePassword />
        <button className="kv kv-button" onClick={lock}>
          <span>今すぐロック</span>
        </button>
      </div>

      <h2 className="group-title">バックアップ</h2>
      <div className="card form-card">
        <p className="muted xsmall">
          暗号化したファイルとして保存します。開くにはマスターパスワードが必要です。iCloud Drive や Google ドライブに置いておくと、機種変更のときに使えます。
        </p>
        <div className="grid-2">
          <button className="btn btn-primary" onClick={() => exportBackup().then(() => toast('書き出しました'))}>
            書き出す
          </button>
          <ImportButton />
        </div>
      </div>

      <p className="muted xsmall center">
        データはこの端末の中だけに暗号化して保存されています。
      </p>
      <Debug data={data} />
    </main>
  );
}

const THEMES: { value: Theme; label: string }[] = [
  { value: 'auto', label: '自動' },
  { value: 'light', label: 'ライト' },
  { value: 'dark', label: 'ダーク' },
];

function ThemePicker() {
  const [theme, setThemeState] = useState<Theme>(getTheme);
  return (
    <div className="segment three" role="radiogroup" aria-label="表示テーマ">
      {THEMES.map((t) => (
        <button
          key={t.value}
          role="radio"
          aria-checked={theme === t.value}
          className={theme === t.value ? 'on' : ''}
          onClick={() => {
            setTheme(t.value);
            setThemeState(t.value);
          }}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}

function NumberRow({ label, unit, value, onSave }: { label: string; unit: string; value: number; onSave: (v: string) => void }) {
  const [text, setText] = useState(String(value));
  return (
    <label className="kv">
      <span>{label}</span>
      <span className="row gap-1-5">
        <input
          className="input small-input"
          inputMode="decimal"
          value={text}
          onChange={(e) => setText(e.target.value.replace(/[^0-9.]/g, ''))}
          onBlur={() => onSave(text)}
        />
        <span>{unit}</span>
      </span>
    </label>
  );
}

function NamedListEditor({
  items,
  usedIds,
  placeholder,
  onChange,
}: {
  items: NamedItem[];
  usedIds: Set<string>;
  placeholder: string;
  onChange: (items: NamedItem[]) => void;
}) {
  const { toast } = useFeedback();
  const [draft, setDraft] = useState('');

  const add = (e: FormEvent) => {
    e.preventDefault();
    if (!draft.trim()) return;
    onChange([...items, { id: newId(), name: draft.trim() }]);
    setDraft('');
  };

  return (
    <div className="card list-card">
      {items.map((item) => (
        <div key={item.id} className="kv">
          <input
            className="input-plain grow"
            aria-label="名前"
            defaultValue={item.name}
            onBlur={(e) => {
              const name = e.target.value.trim();
              if (name && name !== item.name) onChange(items.map((i) => (i.id === item.id ? { ...i, name } : i)));
            }}
          />
          <button
            className="square-btn sm"
            aria-label={`${item.name}を削除`}
            onClick={() => {
              if (usedIds.has(item.id)) toast('使っているサブスクがあるので削除できません');
              else onChange(items.filter((i) => i.id !== item.id));
            }}
          >
            <TrashIcon size={16} />
          </button>
        </div>
      ))}
      <form className="kv" onSubmit={add}>
        <input className="input-plain grow" aria-label="追加する名前" placeholder={placeholder} value={draft} onChange={(e) => setDraft(e.target.value)} />
        <button className="link small bold" disabled={!draft.trim()}>
          追加
        </button>
      </form>
    </div>
  );
}

function ChangePassword() {
  const { changePassword } = useApp();
  const { toast } = useFeedback();
  const [open, setOpen] = useState(false);
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    if (next.length < 8) return setError('8文字以上にしてください');
    if (next !== confirm) return setError('確認用のパスワードが一致しません');
    try {
      await changePassword(current, next);
      toast('マスターパスワードを変更しました');
      setOpen(false);
      setCurrent('');
      setNext('');
      setConfirm('');
    } catch (err) {
      setError(err instanceof WrongPasswordError ? '今のパスワードが違います' : '変更できませんでした');
    }
  };

  if (!open) {
    return (
      <button className="kv kv-button" onClick={() => setOpen(true)}>
        <span>マスターパスワードを変更</span>
        <span className="muted">›</span>
      </button>
    );
  }
  return (
    <form className="kv-block" onSubmit={submit}>
      <span>マスターパスワードを変更</span>
      <input type="password" className="input" placeholder="今のパスワード" aria-label="今のパスワード" autoComplete="current-password" value={current} onChange={(e) => setCurrent(e.target.value)} />
      <input type="password" className="input" placeholder="新しいパスワード（8文字以上）" aria-label="新しいパスワード" autoComplete="new-password" value={next} onChange={(e) => setNext(e.target.value)} />
      <input type="password" className="input" placeholder="確認用にもう一度" aria-label="確認用にもう一度" autoComplete="new-password" value={confirm} onChange={(e) => setConfirm(e.target.value)} />
      <p className="muted xsmall">変更前に書き出したバックアップは、前のパスワードで開きます。</p>
      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}
      <div className="grid-2">
        <button type="button" className="btn btn-ghost" onClick={() => setOpen(false)}>
          やめる
        </button>
        <button className="btn btn-primary" disabled={!current || !next}>
          変更する
        </button>
      </div>
    </form>
  );
}

function ImportButton() {
  const { importBackup } = useApp();
  const { toast, confirm } = useFeedback();
  const input = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!file) return;
    const ok = await confirm({
      title: 'バックアップを読み込みますか？',
      message: '今のデータはバックアップの内容に置き換わります',
      ok: '読み込む',
      danger: true,
    });
    if (!ok) return;
    try {
      await importBackup(file, password);
      toast('読み込みました', 'celebrate');
      setFile(null);
      setPassword('');
      setError('');
    } catch (err) {
      setError(err instanceof WrongPasswordError ? 'パスワードが違います' : (err as Error).message || '読み込めませんでした');
    }
  };

  return (
    <>
      <button className="btn btn-outline" onClick={() => input.current?.click()}>
        読み込む
      </button>
      <input
        ref={input}
        type="file"
        accept="application/json,.json"
        hidden
        onChange={(e) => {
          setFile(e.target.files?.[0] ?? null);
          e.target.value = '';
        }}
      />
      {file && (
        <form className="import-form" onSubmit={submit}>
          <span className="small">{file.name}</span>
          <input
            type="password"
            className="input"
            placeholder="バックアップ時のマスターパスワード"
            aria-label="バックアップ時のマスターパスワード"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          {error && (
            <p className="error" role="alert">
              {error}
            </p>
          )}
          <div className="grid-2">
            <button type="button" className="btn btn-ghost" onClick={() => setFile(null)}>
              やめる
            </button>
            <button className="btn btn-primary" disabled={!password}>
              読み込む
            </button>
          </div>
        </form>
      )}
    </>
  );
}

// 開発中だけ、サンプルデータを入れるボタンを出す
function Debug({ data }: { data: AppData }) {
  const { update } = useApp();
  if (!import.meta.env.DEV || data.subscriptions.length > 0) return null;
  return (
    <button className="btn btn-ghost" onClick={() => import('../lib/sample').then((m) => update(m.withSampleData))}>
      サンプルデータを入れる（開発用）
    </button>
  );
}
