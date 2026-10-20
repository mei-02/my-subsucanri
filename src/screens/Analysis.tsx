import { useState } from 'react';
import { HeartIcon } from '../components/Icons';
import { MonthlyTrend } from '../components/MonthlyTrend';
import { ServiceIcon } from '../components/ServiceIcon';
import { annualSavings, isActive, isInTrial, monthlyEquivalent } from '../lib/calc';
import { fullDate, yen } from '../lib/format';
import { useApp } from '../state';

const BAR_COLORS = ['#8A72D6', '#E8708A', '#4FA36E', '#E0B030', '#7FA8E0', '#E58A4E', '#A9A1AE'];

export function Analysis() {
  const { data, today } = useApp();
  const { subscriptions, categories, paymentMethods, settings } = data;
  const [period, setPeriod] = useState<'month' | 'year'>('month');
  const factor = period === 'month' ? 1 : 12;

  const counted = subscriptions.filter((s) => isActive(s) && !isInTrial(s, today));
  const amountOf = (s: (typeof counted)[number]) => monthlyEquivalent(s, today, settings.usdRate) * factor;
  const total = counted.reduce((sum, s) => sum + amountOf(s), 0);

  const group = (keyOf: (s: (typeof counted)[number]) => string, names: { id: string; name: string }[]) => {
    const sums = new Map<string, number>();
    for (const s of counted) sums.set(keyOf(s), (sums.get(keyOf(s)) ?? 0) + amountOf(s));
    return [...sums.entries()]
      .map(([id, amount]) => ({ id, name: names.find((n) => n.id === id)?.name ?? '未設定', amount }))
      .sort((a, b) => b.amount - a.amount);
  };

  const byCategory = group((s) => s.categoryId, categories);
  const byMethod = group((s) => s.paymentMethodId, paymentMethods);
  const ranking = [...counted].sort((a, b) => amountOf(b) - amountOf(a)).slice(0, 5);

  const cancelled = subscriptions.filter((s) => s.cancelledAt);
  const savings = cancelled.reduce((sum, s) => sum + annualSavings(s, settings.usdRate), 0);
  const pct = (amount: number) => (total > 0 ? (amount / total) * 100 : 0);

  return (
    <main className="screen with-nav">
      <h1 className="title">分析</h1>

      <MonthlyTrend subscriptions={subscriptions} today={today} usdRate={settings.usdRate} />

      <div className="segment wide" role="radiogroup" aria-label="期間">
        <button role="radio" aria-checked={period === 'month'} className={period === 'month' ? 'on' : ''} onClick={() => setPeriod('month')}>
          月あたり
        </button>
        <button role="radio" aria-checked={period === 'year'} className={period === 'year' ? 'on' : ''} onClick={() => setPeriod('year')}>
          年あたり
        </button>
      </div>

      {counted.length === 0 ? (
        <p className="muted small center">支払い中のサブスクがまだありません</p>
      ) : (
        <>
          <section className="card chart-card">
            <div className="row between baseline">
              <h2 className="section-title sm">カテゴリ別</h2>
              <span className="muted small">合計 {yen(total)}</span>
            </div>
            <div className="stacked-bar">
              {byCategory.map((c, i) => (
                <div key={c.id} className="grow-bar" style={{ width: `${pct(c.amount)}%`, background: BAR_COLORS[i % BAR_COLORS.length] }} />
              ))}
            </div>
            <div className="stack-2">
              {byCategory.map((c, i) => (
                <div key={c.id} className="legend-row">
                  <span className="dot" style={{ background: BAR_COLORS[i % BAR_COLORS.length] }} />
                  <span className="grow">{c.name}</span>
                  <span className="muted xsmall">{Math.round(pct(c.amount))}%</span>
                  <strong>{yen(c.amount)}</strong>
                </div>
              ))}
            </div>
          </section>

          <section className="card chart-card">
            <h2 className="section-title sm">支払方法別</h2>
            {byMethod.map((m) => (
              <div key={m.id} className="stack-1-5">
                <div className="row between small">
                  <span>{m.name}</span>
                  <strong>{yen(m.amount)}</strong>
                </div>
                <div className="track">
                  <div className="grow-bar" style={{ width: `${pct(m.amount)}%` }} />
                </div>
              </div>
            ))}
          </section>

          <section className="card chart-card">
            <h2 className="section-title sm">高い順</h2>
            {ranking.map((s, i) => (
              <a key={s.id} href={`#/sub/${s.id}`} className="legend-row link-row">
                <span className="rank">{i + 1}</span>
                <ServiceIcon {...s} size={32} />
                <span className="grow">{s.name}</span>
                <strong>{yen(amountOf(s))}</strong>
              </a>
            ))}
          </section>
        </>
      )}

      <section className="savings pop-in">
        <div className="savings-icon">
          <HeartIcon size={24} />
        </div>
        <div className="stack-2">
          <span className="small bold savings-label">節約記録</span>
          {cancelled.length === 0 ? (
            <span className="small">解約を記録すると、浮いた金額がここに貯まります</span>
          ) : (
            <>
              <strong className="savings-value">年間 {yen(savings)} 節約中</strong>
              {cancelled.map((s) => (
                <span key={s.id} className="xsmall savings-sub">
                  {s.name}（{fullDate(s.cancelledAt!)}に解約）年 {yen(annualSavings(s, settings.usdRate))}
                </span>
              ))}
            </>
          )}
        </div>
      </section>
    </main>
  );
}
