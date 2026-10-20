import { useRef, useState, type FormEvent } from 'react';
import { useFeedback } from '../components/Feedback';
import { BackIcon, EyeIcon, EyeOffIcon, TrashIcon } from '../components/Icons';
import { ServiceIcon } from '../components/ServiceIcon';
import { fetchSiteIcon, imageFileToIcon } from '../lib/image';
import { searchCatalog, type CatalogService } from '../lib/catalog';
import { PRESET_ICONS } from '../lib/services';
import { fullDate, money } from '../lib/format';
import {
  newId,
  type Currency,
  type CycleUnit,
  type PricePeriod,
  type ServiceIcon as Icon,
  type Subscription,
  type TileColor,
} from '../lib/types';
import { goBack, navigate } from '../router';
import { useApp } from '../state';

const COLORS: { value: TileColor; label: string }[] = [
  { value: 'pink', label: 'ピンク' },
  { value: 'blue', label: 'ブルー' },
  { value: 'green', label: 'グリーン' },
  { value: 'yellow', label: 'イエロー' },
  { value: 'purple', label: 'パープル' },
  { value: 'orange', label: 'オレンジ' },
];

const CYCLE_PRESETS: { label: string; unit: CycleUnit; every: number }[] = [
  { label: '毎月', unit: 'month', every: 1 },
  { label: '毎年', unit: 'year', every: 1 },
  { label: '3ヶ月', unit: 'month', every: 3 },
  { label: '6ヶ月', unit: 'month', every: 6 },
  { label: '毎週', unit: 'week', every: 1 },
];

const NEW_METHOD = '__new__';

export function Edit({ id }: { id?: string }) {
  const { data, today, update } = useApp();
  const { toast } = useFeedback();
  const existing = id ? data.subscriptions.find((s) => s.id === id) : undefined;
  const latestPrice = existing ? [...existing.prices].sort((a, b) => b.from.localeCompare(a.from))[0] : undefined;

  const [name, setName] = useState(existing?.name ?? '');
  const [icon, setIcon] = useState<Icon>(existing?.icon ?? { kind: 'letter' });
  const [color, setColor] = useState<TileColor>(existing?.color ?? 'pink');
  const [categoryId, setCategoryId] = useState(existing?.categoryId ?? data.categories[0]?.id ?? '');
  const [paymentMethodId, setPaymentMethodId] = useState(existing?.paymentMethodId ?? data.paymentMethods[0]?.id ?? '');
  const [newMethod, setNewMethod] = useState('');
  const [amount, setAmount] = useState(latestPrice ? String(latestPrice.amount) : '');
  const [currency, setCurrency] = useState<Currency>(existing?.currency ?? 'JPY');
  const [unit, setUnit] = useState<CycleUnit>(existing?.cycle.unit ?? 'month');
  const [every, setEvery] = useState(String(existing?.cycle.every ?? 1));
  const [startDate, setStartDate] = useState(existing?.startDate ?? today);
  const [hasTrial, setHasTrial] = useState(!!existing?.trialEndDate);
  const [trialEndDate, setTrialEndDate] = useState(existing?.trialEndDate ?? '');
  const [loginId, setLoginId] = useState(existing?.loginId ?? '');
  const [password, setPassword] = useState(existing?.password ?? '');
  const [showPassword, setShowPassword] = useState(false);
  const [memo, setMemo] = useState(existing?.memo ?? '');
  const [history, setHistory] = useState<PricePeriod[]>(existing?.prices ?? []);
  const [change, setChange] = useState({ from: today, amount: '' });

  const [suggestOpen, setSuggestOpen] = useState(false);
  const [iconPanel, setIconPanel] = useState<'' | 'preset' | 'fetch'>('');
  const [domain, setDomain] = useState('');
  const [fetching, setFetching] = useState(false);
  const [error, setError] = useState('');
  const fileInput = useRef<HTMLInputElement>(null);

  const suggestions = suggestOpen && name.trim() ? searchCatalog(name, '').slice(0, 6) : [];

  const pickSuggestion = (s: CatalogService) => {
    setName(s.name);
    setSuggestOpen(false);
    const cat = data.categories.find((c) => c.name === s.category);
    if (cat) setCategoryId(cat.id);
    if (s.slug) {
      setIcon({ kind: 'preset', slug: s.slug });
      setIconPanel('');
    } else if (s.domain) {
      setDomain(s.domain);
      setIconPanel('fetch');
    }
  };

  const onFile = async (file: File | undefined) => {
    if (!file) return;
    try {
      setIcon({ kind: 'image', dataUrl: await imageFileToIcon(file) });
      setIconPanel('');
    } catch (e) {
      toast((e as Error).message);
    }
  };

  const fetchIcon = async () => {
    setFetching(true);
    try {
      setIcon({ kind: 'image', dataUrl: await fetchSiteIcon(domain) });
      setIconPanel('');
      toast('アイコンを取得しました');
    } catch (e) {
      toast((e as Error).message);
    } finally {
      setFetching(false);
    }
  };

  // 編集中の料金履歴：最新の金額は「料金」欄、最初の開始日は「契約開始日」欄と連動させる
  const buildPrices = (value: number): PricePeriod[] => {
    if (!existing) return [{ from: startDate, amount: value }];
    const sorted = [...history].sort((a, b) => a.from.localeCompare(b.from));
    sorted[sorted.length - 1] = { ...sorted[sorted.length - 1], amount: value };
    sorted[0] = { ...sorted[0], from: startDate };
    return sorted;
  };

  const addPriceChange = () => {
    const value = Number(change.amount);
    if (!change.from || !(value >= 0) || change.amount === '') return;
    if (change.from <= startDate) {
      toast('契約開始日より後の日付にしてください');
      return;
    }
    const next = [...history.filter((p) => p.from !== change.from), { from: change.from, amount: value }].sort((a, b) =>
      a.from.localeCompare(b.from),
    );
    setHistory(next);
    setAmount(String(next[next.length - 1].amount));
    setChange({ from: today, amount: '' });
  };

  const removePrice = (from: string) => {
    const next = history.filter((p) => p.from !== from);
    setHistory(next);
    setAmount(String([...next].sort((a, b) => b.from.localeCompare(a.from))[0].amount));
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    const value = Number(amount);
    const n = Math.floor(Number(every));
    if (!name.trim()) return setError('サービス名を入力してください');
    if (amount === '' || !(value >= 0)) return setError('料金を入力してください');
    if (!(n >= 1)) return setError('支払いサイクルは1以上にしてください');
    if (!startDate) return setError('契約開始日を入力してください');
    if (hasTrial && !trialEndDate) return setError('トライアルの終了日を入力してください');
    if (hasTrial && trialEndDate < startDate) return setError('トライアルの終了日は契約開始日より後にしてください');
    const changes = [...history].sort((a, b) => a.from.localeCompare(b.from)).slice(1);
    if (existing && changes.length > 0 && startDate >= changes[0].from) {
      return setError('契約開始日は料金の変更日より前にしてください');
    }

    let methodId = paymentMethodId;
    const methods = [...data.paymentMethods];
    if (paymentMethodId === NEW_METHOD) {
      if (!newMethod.trim()) return setError('支払方法の名前を入力してください');
      methodId = newId();
      methods.push({ id: methodId, name: newMethod.trim() });
    }

    const sub: Subscription = {
      id: existing?.id ?? newId(),
      name: name.trim(),
      icon,
      color,
      categoryId,
      paymentMethodId: methodId,
      loginId: loginId.trim(),
      password,
      currency,
      cycle: { unit, every: n },
      startDate,
      trialEndDate: hasTrial ? trialEndDate : undefined,
      prices: buildPrices(value),
      cancelledAt: existing?.cancelledAt,
      memo,
    };

    await update((d) => ({
      ...d,
      paymentMethods: methods,
      subscriptions: existing ? d.subscriptions.map((s) => (s.id === sub.id ? sub : s)) : [...d.subscriptions, sub],
    }));
    toast(existing ? '保存しました' : `${sub.name}を登録しました`, existing ? 'pop' : 'celebrate');
    navigate(`/sub/${sub.id}`, { replace: true });
  };

  return (
    <main className="screen">
      <header className="row between">
        <button className="icon-btn" aria-label="戻る" onClick={() => goBack('/')}>
          <BackIcon size={20} />
        </button>
        <h1 className="section-title">{existing ? '編集' : 'サブスクを追加'}</h1>
        <span style={{ width: 44 }} />
      </header>

      <form className="stack-4" onSubmit={submit} noValidate>
        <div className="card form-card">
          <div className="field suggest-wrap">
            <label htmlFor="name">サービス名</label>
            <input
              id="name"
              className="input"
              value={name}
              autoComplete="off"
              placeholder="例：Netflix"
              onChange={(e) => {
                setName(e.target.value);
                setSuggestOpen(true);
              }}
              onBlur={() => setTimeout(() => setSuggestOpen(false), 150)}
            />
            {suggestions.length > 0 && (
              <ul className="suggest" role="listbox">
                {suggestions.map((s) => (
                  <li key={s.id}>
                    <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => pickSuggestion(s)}>
                      <ServiceIcon name={s.name} color={color} icon={s.slug ? { kind: 'preset', slug: s.slug } : { kind: 'letter' }} size={32} />
                      <span>{s.name}</span>
                      <span className="muted xsmall">{s.category}</span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="field">
            <span className="label">アイコンと色</span>
            <div className="row gap-3">
              <ServiceIcon name={name || '?'} icon={icon} color={color} size={56} />
              <div className="icon-actions">
                <button type="button" className="chip" onClick={() => setIconPanel(iconPanel === 'preset' ? '' : 'preset')}>
                  内蔵から選ぶ
                </button>
                <button type="button" className="chip" onClick={() => fileInput.current?.click()}>
                  画像を選ぶ
                </button>
                <button type="button" className="chip" onClick={() => setIconPanel(iconPanel === 'fetch' ? '' : 'fetch')}>
                  自動で取得
                </button>
                {icon.kind !== 'letter' && (
                  <button type="button" className="chip" onClick={() => setIcon({ kind: 'letter' })}>
                    頭文字にする
                  </button>
                )}
              </div>
            </div>
            <input ref={fileInput} type="file" accept="image/*" hidden onChange={(e) => onFile(e.target.files?.[0])} />
            {iconPanel === 'preset' && (
              <div className="preset-grid">
                {Object.values(PRESET_ICONS).map((p) => (
                  <button
                    type="button"
                    key={p.slug}
                    aria-label={p.title}
                    title={p.title}
                    className={icon.kind === 'preset' && icon.slug === p.slug ? 'on' : ''}
                    onClick={() => {
                      setIcon({ kind: 'preset', slug: p.slug });
                      setIconPanel('');
                    }}
                  >
                    <ServiceIcon name={p.title} icon={{ kind: 'preset', slug: p.slug }} color={color} size={40} />
                  </button>
                ))}
              </div>
            )}
            {iconPanel === 'fetch' && (
              <div className="fetch-box">
                <p className="muted xsmall">
                  ボタンを押したときだけ、入力したドメイン名を外部のアイコン取得サービスに送ります。取得した画像は端末内に保存されます。
                </p>
                <div className="row gap-2">
                  <input className="input grow" aria-label="サービスのドメイン" placeholder="例：hulu.jp" value={domain} onChange={(e) => setDomain(e.target.value)} />
                  <button type="button" className="btn btn-primary btn-sm" disabled={!domain.trim() || fetching} onClick={fetchIcon}>
                    {fetching ? '取得中…' : '取得'}
                  </button>
                </div>
              </div>
            )}
            <div className="swatches" role="radiogroup" aria-label="カードの色">
              {COLORS.map((c) => (
                <button
                  type="button"
                  key={c.value}
                  role="radio"
                  aria-checked={color === c.value}
                  aria-label={c.label}
                  className={`swatch tile-${c.value}${color === c.value ? ' on' : ''}`}
                  onClick={() => setColor(c.value)}
                />
              ))}
            </div>
          </div>

          <div className="field">
            <label htmlFor="category">カテゴリ</label>
            <select id="category" className="input" value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
              {data.categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="card form-card">
          <div className="field">
            <label htmlFor="amount">{existing && history.length > 1 ? '現在の料金' : '料金'}</label>
            <div className="row gap-2">
              <input
                id="amount"
                className="input grow"
                inputMode="decimal"
                placeholder={currency === 'JPY' ? '1590' : '9.99'}
                value={amount}
                onChange={(e) => setAmount(e.target.value.replace(/[^0-9.]/g, ''))}
              />
              <div className="segment" role="radiogroup" aria-label="通貨">
                {(['JPY', 'USD'] as const).map((c) => (
                  <button type="button" key={c} role="radio" aria-checked={currency === c} className={currency === c ? 'on' : ''} onClick={() => setCurrency(c)}>
                    {c === 'JPY' ? '円' : 'ドル'}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="field">
            <span className="label">支払いサイクル</span>
            <div className="chips">
              {CYCLE_PRESETS.map((p) => (
                <button
                  type="button"
                  key={p.label}
                  className={`chip${unit === p.unit && Number(every) === p.every ? ' on' : ''}`}
                  onClick={() => {
                    setUnit(p.unit);
                    setEvery(String(p.every));
                  }}
                >
                  {p.label}
                </button>
              ))}
            </div>
            <div className="row gap-2">
              <input className="input every" inputMode="numeric" aria-label="周期の数" value={every} onChange={(e) => setEvery(e.target.value.replace(/\D/g, ''))} />
              <select className="input grow" aria-label="周期の単位" value={unit} onChange={(e) => setUnit(e.target.value as CycleUnit)}>
                <option value="week">週ごと</option>
                <option value="month">ヶ月ごと</option>
                <option value="year">年ごと</option>
              </select>
            </div>
          </div>

          <div className="field">
            <label htmlFor="start">契約開始日</label>
            <input id="start" type="date" className="input" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
            <span className="muted xsmall">この日を基準に支払日と累計を計算します</span>
          </div>

          <div className="field">
            <label className="toggle-row">
              <span>無料トライアル中</span>
              <input type="checkbox" className="switch" checked={hasTrial} onChange={(e) => setHasTrial(e.target.checked)} />
            </label>
            {hasTrial && (
              <>
                <input type="date" className="input" aria-label="トライアル終了日" value={trialEndDate} onChange={(e) => setTrialEndDate(e.target.value)} />
                <span className="muted xsmall">終了日が最初の支払日になります</span>
              </>
            )}
          </div>

          <div className="field">
            <label htmlFor="method">支払方法</label>
            <select id="method" className="input" value={paymentMethodId} onChange={(e) => setPaymentMethodId(e.target.value)}>
              <option value="">未設定</option>
              {data.paymentMethods.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
              <option value={NEW_METHOD}>＋ 新しく追加</option>
            </select>
            {paymentMethodId === NEW_METHOD && (
              <input className="input" aria-label="新しい支払方法" placeholder="例：楽天カード" value={newMethod} onChange={(e) => setNewMethod(e.target.value)} />
            )}
          </div>
        </div>

        {existing && (
          <div className="card form-card">
            <span className="label">料金の履歴</span>
            {[...history]
              .sort((a, b) => b.from.localeCompare(a.from))
              .map((p, i, all) => (
                <div key={p.from} className="row between">
                  <span>{i === all.length - 1 ? `${fullDate(startDate)}〜` : `${fullDate(p.from)}〜`}</span>
                  <span className="row gap-2">
                    <strong>{money(i === 0 ? Number(amount) || 0 : p.amount, currency)}</strong>
                    {i < all.length - 1 && (
                      <button type="button" className="square-btn sm" aria-label={`${fullDate(p.from)}の料金変更を削除`} onClick={() => removePrice(p.from)}>
                        <TrashIcon size={16} />
                      </button>
                    )}
                  </span>
                </div>
              ))}
            <span className="muted xsmall">値上げ・値下げを記録</span>
            <div className="row gap-2">
              <input type="date" className="input grow" aria-label="料金が変わった日" value={change.from} onChange={(e) => setChange({ ...change, from: e.target.value })} />
              <input
                className="input price-input"
                inputMode="decimal"
                aria-label="新しい料金"
                placeholder="新料金"
                value={change.amount}
                onChange={(e) => setChange({ ...change, amount: e.target.value.replace(/[^0-9.]/g, '') })}
              />
              <button type="button" className="btn btn-primary btn-sm" onClick={addPriceChange}>
                追加
              </button>
            </div>
          </div>
        )}

        <div className="card form-card">
          <div className="field">
            <label htmlFor="login">ログインID</label>
            <input id="login" className="input" autoComplete="off" value={loginId} onChange={(e) => setLoginId(e.target.value)} />
          </div>
          <div className="field">
            <label htmlFor="password">パスワード</label>
            <div className="row gap-2">
              <input
                id="password"
                className="input grow"
                type={showPassword ? 'text' : 'password'}
                autoComplete="off"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <button
                type="button"
                className="square-btn"
                aria-label={showPassword ? 'パスワードを隠す' : 'パスワードを表示'}
                onClick={() => setShowPassword((v) => !v)}
              >
                {showPassword ? <EyeOffIcon size={18} /> : <EyeIcon size={18} />}
              </button>
            </div>
          </div>
          <div className="field">
            <label htmlFor="memo">メモ</label>
            <textarea id="memo" className="input textarea" value={memo} onChange={(e) => setMemo(e.target.value)} />
          </div>
        </div>

        {error && (
          <p className="error" role="alert">
            {error}
          </p>
        )}
        <button className="btn btn-primary btn-lg">{existing ? '保存する' : '登録する'}</button>
      </form>
    </main>
  );
}
