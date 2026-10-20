import { useState } from 'react';
import { BackIcon, ChevronIcon } from '../components/Icons';
import { ServiceIcon } from '../components/ServiceIcon';
import { addCycle, isInTrial, paymentDates, priceAt, toDateStr, toJpy } from '../lib/calc';
import { money, yen } from '../lib/format';
import type { Subscription } from '../lib/types';
import { useApp } from '../state';

type Mode = 'icon' | 'price';
const MODE_KEY = 'calendar-mode';
const WEEKDAYS = ['日', '月', '火', '水', '木', '金', '土'];

interface Payment {
  date: string;
  sub: Subscription;
  amount: number;
  jpy: number;
  trialEnd: boolean;
}

function readMode(): Mode {
  try {
    return localStorage.getItem(MODE_KEY) === 'price' ? 'price' : 'icon';
  } catch {
    return 'icon';
  }
}

/** ¥1,590 / ¥1.2万 のように、マスに収まる長さにする */
function compactYen(n: number): string {
  if (n >= 10_000) return `¥${(n / 10_000).toFixed(n >= 100_000 ? 0 : 1)}万`;
  return yen(n);
}

export function Calendar() {
  const { data, today } = useApp();
  const { subscriptions, settings } = data;
  const [month, setMonth] = useState(`${today.slice(0, 7)}-01`);
  const [mode, setModeState] = useState<Mode>(readMode);
  const [selected, setSelected] = useState<string | null>(today);

  const setMode = (m: Mode) => {
    setModeState(m);
    try {
      localStorage.setItem(MODE_KEY, m);
    } catch {
      // 保存できなくても表示は切り替える
    }
  };

  const [y, mo] = month.split('-').map(Number);
  const monthEnd = toDateStr(new Date(y, mo, 0));
  const lead = new Date(y, mo - 1, 1).getDay();
  const days = new Date(y, mo, 0).getDate();

  const payments: Payment[] = subscriptions.flatMap((sub) =>
    paymentDates(sub, monthEnd)
      .filter((date) => date >= month)
      .map((date) => {
        const amount = priceAt(sub, date);
        return { date, sub, amount, jpy: toJpy(amount, sub.currency, settings.usdRate), trialEnd: date === sub.trialEndDate && isInTrial(sub, today) };
      }),
  );
  const total = payments.reduce((sum, p) => sum + p.jpy, 0);
  const byDate = new Map<string, Payment[]>();
  for (const p of payments) byDate.set(p.date, [...(byDate.get(p.date) ?? []), p]);

  const moveMonth = (n: number) => {
    const next = addCycle(month, { unit: 'month', every: 1 }, n);
    setMonth(next);
    setSelected(next.slice(0, 7) === today.slice(0, 7) ? today : null);
  };

  const cells = Array.from({ length: Math.ceil((lead + days) / 7) * 7 }, (_, i) => {
    const day = i - lead + 1;
    return day >= 1 && day <= days ? toDateStr(new Date(y, mo - 1, day)) : null;
  });
  const selectedPayments = selected ? byDate.get(selected) ?? [] : [];

  return (
    <main className="screen with-nav">
      <header className="row between">
        <button className="icon-btn" aria-label="前の月" onClick={() => moveMonth(-1)}>
          <BackIcon size={18} />
        </button>
        <div className="stack-2 center-items">
          <h1 className="section-title">
            {y}年{mo}月
          </h1>
          <span className="muted small">
            支払い <strong className="ink">{yen(total)}</strong>・{payments.length}件
          </span>
        </div>
        <button className="icon-btn" aria-label="次の月" onClick={() => moveMonth(1)}>
          <ChevronIcon size={18} />
        </button>
      </header>

      <div className="segment wide" role="radiogroup" aria-label="表示">
        <button role="radio" aria-checked={mode === 'icon'} className={mode === 'icon' ? 'on' : ''} onClick={() => setMode('icon')}>
          アイコン
        </button>
        <button role="radio" aria-checked={mode === 'price'} className={mode === 'price' ? 'on' : ''} onClick={() => setMode('price')}>
          金額
        </button>
      </div>

      <div className="card calendar">
        <div className="cal-grid cal-head">
          {WEEKDAYS.map((w, i) => (
            <span key={w} className={i === 0 ? 'sun' : i === 6 ? 'sat' : ''}>
              {w}
            </span>
          ))}
        </div>
        <div className="cal-grid">
          {cells.map((date, i) => {
            if (!date) return <span key={i} />;
            const list = byDate.get(date) ?? [];
            const sum = list.reduce((s, p) => s + p.jpy, 0);
            const dow = i % 7;
            return (
              <button
                key={date}
                className={`cal-cell${date === selected ? ' selected' : ''}`}
                aria-label={`${Number(date.slice(8))}日 ${list.length ? `${list.length}件 ${yen(sum)}` : '支払いなし'}`}
                aria-pressed={date === selected}
                onClick={() => setSelected(date)}
              >
                <span className={`cal-day${date === today ? ' today' : dow === 0 ? ' sun' : dow === 6 ? ' sat' : ''}`}>{Number(date.slice(8))}</span>
                {list.length > 0 &&
                  (mode === 'icon' ? (
                    <span className="cal-icons">
                      {list.slice(0, 2).map((p) => (
                        <ServiceIcon key={p.sub.id} {...p.sub} size={18} round />
                      ))}
                      {list.length > 2 && <span className="cal-more">+{list.length - 2}</span>}
                    </span>
                  ) : (
                    <span className={`cal-amount${list.every((p) => p.trialEnd) ? ' trial' : ''}`}>{compactYen(sum)}</span>
                  ))}
              </button>
            );
          })}
        </div>
      </div>

      {selected && (
        <section className="stack-2-5">
          <div className="row between baseline">
            <h2 className="section-title sm">
              {Number(selected.slice(5, 7))}月{Number(selected.slice(8))}日の支払い
            </h2>
            {selectedPayments.length > 0 && <span className="muted small bold">{yen(selectedPayments.reduce((s, p) => s + p.jpy, 0))}</span>}
          </div>
          <div className="card list-card">
            {selectedPayments.length === 0 ? (
              <p className="muted small pad-y">この日の支払いはありません</p>
            ) : (
              selectedPayments.map((p) => (
                <a key={p.sub.id} href={`#/sub/${p.sub.id}`} className="list-row">
                  <ServiceIcon {...p.sub} size={36} round />
                  <div className="stack-2 grow">
                    <strong>{p.sub.name}</strong>
                    {p.trialEnd && <span className="muted xsmall">お試し終了・ここから支払い開始</span>}
                  </div>
                  <strong>{money(p.amount, p.sub.currency)}</strong>
                </a>
              ))
            )}
          </div>
        </section>
      )}
    </main>
  );
}
