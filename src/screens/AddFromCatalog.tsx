import { useState, type FormEvent } from 'react';
import { useFeedback } from '../components/Feedback';
import { BackIcon, CheckIcon, CloseIcon, SearchIcon } from '../components/Icons';
import { ServiceIcon } from '../components/ServiceIcon';
import { CATALOG, CATALOG_CHECKED_AT, lowestPlan, searchCatalog, type CatalogPlan, type CatalogService } from '../lib/catalog';
import { cycleLabel } from '../lib/calc';
import { money } from '../lib/format';
import { newId, type ServiceIcon as Icon, type Subscription } from '../lib/types';
import { goBack, navigate } from '../router';
import { useApp } from '../state';

const CATEGORIES = [
  { key: 'popular', label: '人気' },
  { key: '動画', label: '動画' },
  { key: '音楽', label: '音楽' },
  { key: '学習', label: '学習' },
  { key: '生活', label: '生活' },
  { key: 'ゲーム', label: 'ゲーム' },
  { key: '仕事・ツール', label: '仕事・ツール' },
  { key: 'その他', label: 'その他' },
];

const NEW_METHOD = '__new__';

interface Choice {
  plan: number;
  amount: string;
  startDate: string;
}

function iconOf(service: CatalogService): Icon {
  return service.slug ? { kind: 'preset', slug: service.slug } : { kind: 'letter' };
}

function planLabel(plan: CatalogPlan): string {
  if (plan.amount === null) return '料金を入力';
  return `${money(plan.amount, plan.currency ?? 'JPY')}/${cycleLabel(plan.cycle).replace('毎', '')}`;
}

export function AddFromCatalog() {
  const { data, today, update } = useApp();
  const { toast } = useFeedback();
  const [step, setStep] = useState<1 | 2>(1);
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('popular');
  const [picked, setPicked] = useState<string[]>([]);
  const [choices, setChoices] = useState<Record<string, Choice>>({});
  const [methodId, setMethodId] = useState(data.paymentMethods[0]?.id ?? '');
  const [newMethod, setNewMethod] = useState('');
  const [error, setError] = useState('');

  const services = searchCatalog(query, category);
  const pickedServices = picked.map((id) => CATALOG.find((s) => s.id === id)!);
  const registered = new Set(data.subscriptions.filter((s) => !s.cancelledAt).map((s) => s.catalogId));

  const toggle = (id: string) => {
    setPicked((list) => (list.includes(id) ? list.filter((x) => x !== id) : [...list, id]));
    setChoices((c) => {
      if (c[id]) return c;
      return { ...c, [id]: { plan: 0, amount: '', startDate: today } };
    });
  };

  const setChoice = (id: string, patch: Partial<Choice>) => setChoices((c) => ({ ...c, [id]: { ...c[id], ...patch } }));

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    const methods = [...data.paymentMethods];
    let paymentMethodId = methodId;
    if (methodId === NEW_METHOD) {
      if (!newMethod.trim()) return setError('支払方法の名前を入力してください');
      paymentMethodId = newId();
      methods.push({ id: paymentMethodId, name: newMethod.trim() });
    }

    const subs: Subscription[] = [];
    for (const service of pickedServices) {
      const choice = choices[service.id];
      const plan = service.plans[choice.plan];
      const amount = plan.amount ?? Number(choice.amount);
      if (plan.amount === null && (choice.amount === '' || !(amount >= 0))) {
        return setError(`${service.name}の料金を入力してください`);
      }
      if (!choice.startDate) return setError(`${service.name}の契約開始日を入力してください`);
      subs.push({
        id: newId(),
        name: service.name,
        icon: iconOf(service),
        color: service.color,
        categoryId: data.categories.find((c) => c.name === service.category)?.id ?? data.categories[0]?.id ?? '',
        paymentMethodId,
        loginId: '',
        password: '',
        currency: plan.currency ?? 'JPY',
        cycle: plan.cycle,
        startDate: choice.startDate,
        prices: [{ from: choice.startDate, amount }],
        memo: '',
        catalogId: service.id,
        planName: plan.name,
      });
    }

    await update((d) => ({ ...d, paymentMethods: methods, subscriptions: [...d.subscriptions, ...subs] }));
    toast(`${subs.length}件を貯金箱に入れました`, 'celebrate');
    navigate('/', { replace: true });
  };

  if (step === 2) {
    return (
      <main className="screen with-bar">
        <header className="row between">
          <button className="icon-btn" aria-label="戻る" onClick={() => setStep(1)}>
            <BackIcon size={18} />
          </button>
          <h1 className="section-title">プランを選ぶ</h1>
          <span className="step">2/2</span>
        </header>

        <form id="plans" className="stack-3" onSubmit={submit} noValidate>
          <label className="card setting-row">
            <span className="bold small">支払方法（まとめて設定）</span>
            <select className="select-inline" value={methodId} onChange={(e) => setMethodId(e.target.value)}>
              <option value="">未設定</option>
              {data.paymentMethods.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
              <option value={NEW_METHOD}>＋ 新しく追加</option>
            </select>
          </label>
          {methodId === NEW_METHOD && (
            <input className="input" aria-label="新しい支払方法" placeholder="例：楽天カード" value={newMethod} onChange={(e) => setNewMethod(e.target.value)} />
          )}

          {pickedServices.map((service) => {
            const choice = choices[service.id];
            const plan = service.plans[choice.plan];
            return (
              <section key={service.id} className="card plan-card fade-up">
                <div className="row gap-3">
                  <ServiceIcon name={service.name} icon={iconOf(service)} color={service.color} size={44} round />
                  <strong className="grow">{service.name}</strong>
                </div>
                <div className="stack-1-5" role="radiogroup" aria-label={`${service.name}のプラン`}>
                  {service.plans.map((p, i) => (
                    <button
                      type="button"
                      key={p.name}
                      role="radio"
                      aria-checked={choice.plan === i}
                      className={`plan-option${choice.plan === i ? ' on' : ''}`}
                      onClick={() => setChoice(service.id, { plan: i })}
                    >
                      <span className="radio-dot" />
                      <span className="grow">{p.name}</span>
                      <span className="bold">{planLabel(p)}</span>
                    </button>
                  ))}
                </div>
                {plan.amount === null && (
                  <div className="row gap-2">
                    <input
                      className="input grow"
                      inputMode="decimal"
                      aria-label={`${service.name}の料金`}
                      placeholder="料金（円）"
                      value={choice.amount}
                      onChange={(e) => setChoice(service.id, { amount: e.target.value.replace(/[^0-9.]/g, '') })}
                    />
                    <span className="muted small">円/{cycleLabel(plan.cycle).replace('毎', '')}</span>
                  </div>
                )}
                <label className="setting-row inner">
                  <span className="muted small">契約開始日</span>
                  <input
                    type="date"
                    className="input date-inline"
                    value={choice.startDate}
                    onChange={(e) => setChoice(service.id, { startDate: e.target.value })}
                  />
                </label>
              </section>
            );
          })}

          <p className="muted xsmall pad-x">
            料金は{CATALOG_CHECKED_AT}時点の参考価格です。違っていたら登録後に直せます。ID・パスワードやメモは、各サービスの詳細画面から追加できます。
          </p>
        </form>

        <div className="action-bar column">
          {error && (
            <p className="error" role="alert">
              {error}
            </p>
          )}
          <button className="btn btn-primary btn-lg full" form="plans">
            {picked.length}件をまとめて登録
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="screen with-bar">
      <header className="row between">
        <button className="icon-btn" aria-label="閉じる" onClick={() => goBack('/')}>
          <CloseIcon size={18} />
        </button>
        <h1 className="section-title">サブスクを追加</h1>
        <span className="step">1/2</span>
      </header>

      <label className="search">
        <SearchIcon size={18} />
        <input type="search" placeholder="サービス名で探す" aria-label="サービス名で探す" value={query} onChange={(e) => setQuery(e.target.value)} />
      </label>

      {!query && (
        <div className="chips scroll-x">
          {CATEGORIES.map((c) => (
            <button key={c.key} className={`chip${category === c.key ? ' on' : ''}`} onClick={() => setCategory(c.key)}>
              {c.label}
            </button>
          ))}
        </div>
      )}

      <div className="catalog-grid">
        {services.map((s) => {
          const on = picked.includes(s.id);
          const lowest = lowestPlan(s);
          return (
            <button key={s.id} className={`catalog-card${on ? ' on' : ''}`} aria-pressed={on} onClick={() => toggle(s.id)}>
              {on && (
                <span className="catalog-check">
                  <CheckIcon size={12} />
                </span>
              )}
              <ServiceIcon name={s.name} icon={iconOf(s)} color={s.color} size={44} round />
              <span className="catalog-name">{s.name}</span>
              <span className="muted xsmall">
                {registered.has(s.id) ? '登録済み' : lowest ? `${money(lowest.amount!, lowest.currency ?? 'JPY')}〜` : '料金は入力'}
              </span>
            </button>
          );
        })}
      </div>
      {services.length === 0 && <p className="muted small center">見つかりませんでした</p>}
      <a href="#/new" className="link small center">
        一覧にないサービスを自分で登録
      </a>

      <div className={`action-bar${picked.length ? '' : ' hidden'}`}>
        <div className="picked-stack" aria-hidden="true">
          {pickedServices.slice(0, 4).map((s) => (
            <ServiceIcon key={s.id} name={s.name} icon={iconOf(s)} color={s.color} size={32} round />
          ))}
        </div>
        <span className="bold small grow">{picked.length}件 選択中</span>
        <button className="btn btn-primary" onClick={() => setStep(2)} disabled={!picked.length}>
          プランを選ぶ
        </button>
      </div>
    </main>
  );
}
