import { useState } from 'react';
import { SearchIcon } from '../components/Icons';
import { ServiceIcon } from '../components/ServiceIcon';
import { cycleLabel, isActive, isInTrial, monthlyEquivalent, nextPayment, priceAt, toJpy } from '../lib/calc';
import { fullDate, money, shortDate, yen } from '../lib/format';
import type { Subscription } from '../lib/types';
import { useApp } from '../state';

type Sort = 'date' | 'price' | 'name';

export function List() {
  const { data, today } = useApp();
  const { subscriptions, categories, settings } = data;
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('');
  const [sort, setSort] = useState<Sort>('date');

  const matches = (s: Subscription) =>
    (!category || s.categoryId === category) && s.name.toLowerCase().includes(query.trim().toLowerCase());

  const sorters: Record<Sort, (a: Subscription, b: Subscription) => number> = {
    date: (a, b) => (nextPayment(a, today) ?? '9999').localeCompare(nextPayment(b, today) ?? '9999'),
    price: (a, b) => monthlyEquivalent(b, today, settings.usdRate) - monthlyEquivalent(a, today, settings.usdRate),
    name: (a, b) => a.name.localeCompare(b.name, 'ja'),
  };

  const active = subscriptions.filter((s) => isActive(s) && matches(s)).sort(sorters[sort]);
  const cancelled = subscriptions.filter((s) => !isActive(s) && matches(s));
  const usedCategories = categories.filter((c) => subscriptions.some((s) => s.categoryId === c.id));

  return (
    <main className="screen with-nav">
      <header className="row between baseline">
        <h1 className="title">サブスク一覧</h1>
        <span className="muted small">{subscriptions.filter(isActive).length}件</span>
      </header>

      <label className="search">
        <SearchIcon size={18} />
        <input type="search" placeholder="サービス名で検索" aria-label="サービス名で検索" value={query} onChange={(e) => setQuery(e.target.value)} />
      </label>

      {usedCategories.length > 0 && (
        <div className="chips">
          <button className={`chip${category === '' ? ' on' : ''}`} onClick={() => setCategory('')}>
            すべて
          </button>
          {usedCategories.map((c) => (
            <button key={c.id} className={`chip${category === c.id ? ' on' : ''}`} onClick={() => setCategory(c.id)}>
              {c.name}
            </button>
          ))}
        </div>
      )}

      <div className="row between">
        <label className="muted small" htmlFor="sort">
          並び順
        </label>
        <select id="sort" className="select-inline" value={sort} onChange={(e) => setSort(e.target.value as Sort)}>
          <option value="date">支払日が近い順</option>
          <option value="price">金額が高い順</option>
          <option value="name">名前順</option>
        </select>
      </div>

      <div className="stack-2-5">
        {active.map((s, i) => {
          const next = nextPayment(s, today);
          const price = priceAt(s, next ?? today);
          return (
            <a key={s.id} href={`#/sub/${s.id}`} className="card sub-card fade-up" style={{ animationDelay: `${i * 40}ms` }}>
              <ServiceIcon {...s} />
              <div className="stack-2 grow">
                <strong>{s.name}</strong>
                <span className="muted xsmall">
                  {isInTrial(s, today)
                    ? `トライアル終了 ${shortDate(s.trialEndDate!, today)}`
                    : `次回 ${next ? shortDate(next, today) : '-'}・${cycleLabel(s.cycle)}`}
                </span>
              </div>
              {isInTrial(s, today) ? (
                <span className="badge badge-yellow">お試し中</span>
              ) : (
                <div className="stack-2 end">
                  <strong>{money(price, s.currency)}</strong>
                  {s.currency === 'USD' && <span className="muted xsmall">約{yen(toJpy(price, 'USD', settings.usdRate))}</span>}
                </div>
              )}
            </a>
          );
        })}
        {active.length === 0 && <p className="muted small center">見つかりませんでした</p>}
      </div>

      {cancelled.length > 0 && (
        <details className="cancelled">
          <summary>解約済み（{cancelled.length}件）</summary>
          <div className="stack-2-5">
            {cancelled.map((s) => (
              <a key={s.id} href={`#/sub/${s.id}`} className="card sub-card dim">
                <ServiceIcon {...s} />
                <div className="stack-2 grow">
                  <strong>{s.name}</strong>
                  <span className="muted xsmall">{fullDate(s.cancelledAt!)}に解約</span>
                </div>
              </a>
            ))}
          </div>
        </details>
      )}
    </main>
  );
}
