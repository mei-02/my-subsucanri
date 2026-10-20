import { useState } from 'react';
import { addCycle, paymentsInMonth } from '../lib/calc';
import { yen } from '../lib/format';
import type { Subscription } from '../lib/types';

interface Props {
  subscriptions: Subscription[];
  today: string;
  usdRate: number;
}

const PERIODS = [6, 12] as const;

/** 月ごとの支払い合計の推移（1系列の棒グラフ）。今月の分はこれからの支払い予定も含む */
export function MonthlyTrend({ subscriptions, today, usdRate }: Props) {
  const [period, setPeriod] = useState<(typeof PERIODS)[number]>(6);
  const thisMonth = `${today.slice(0, 7)}-01`;
  const [selected, setSelected] = useState(thisMonth);

  const months = Array.from({ length: period }, (_, i) => {
    const start = addCycle(thisMonth, { unit: 'month', every: 1 }, i - period + 1);
    return { start, amount: paymentsInMonth(subscriptions, start, usdRate) };
  });
  const max = Math.max(...months.map((m) => m.amount), 1);
  const index = Math.max(0, months.findIndex((m) => m.start === selected));
  const current = months[index] ?? months[months.length - 1];
  const previous = months[index - 1];
  const diff = previous ? current.amount - previous.amount : null;
  const label = (start: string) => `${Number(start.slice(0, 4))}年${Number(start.slice(5, 7))}月`;

  return (
    <section className="card chart-card">
      <div className="row between baseline">
        <h2 className="section-title sm">毎月の支払い推移</h2>
        <div className="segment mini" role="radiogroup" aria-label="期間">
          {PERIODS.map((p) => (
            <button key={p} role="radio" aria-checked={period === p} className={period === p ? 'on' : ''} onClick={() => setPeriod(p)}>
              {p}ヶ月
            </button>
          ))}
        </div>
      </div>

      <div className="stack-2" aria-live="polite">
        <span className="muted xsmall">
          {label(current.start)}
          {current.start === thisMonth && '（予定を含む）'}
        </span>
        <strong className="trend-value">{yen(current.amount)}</strong>
        {diff !== null && (
          <span className="muted xsmall">
            前月より {diff === 0 ? '変わらず' : `${diff > 0 ? '+' : '−'}${yen(Math.abs(diff))}`}
          </span>
        )}
      </div>

      <div className="trend-plot">
        <div className="trend-grid" aria-hidden="true">
          <span />
          <span />
        </div>
        {months.map((m) => (
          <button
            key={m.start}
            className={`trend-col${m.start === current.start ? ' selected' : ''}`}
            aria-label={`${label(m.start)} ${yen(m.amount)}`}
            aria-pressed={m.start === current.start}
            onClick={() => setSelected(m.start)}
          >
            <span className="trend-bar" style={{ height: `${(m.amount / max) * 100}%` }} />
          </button>
        ))}
      </div>
      <div className="trend-axis" aria-hidden="true">
        {months.map((m) => (
          <span key={m.start} className={m.start === current.start ? 'on' : ''}>
            {Number(m.start.slice(5, 7))}月
          </span>
        ))}
      </div>

      <details className="trend-table">
        <summary className="muted xsmall">表で見る</summary>
        <table>
          <tbody>
            {[...months].reverse().map((m) => (
              <tr key={m.start}>
                <th scope="row">{label(m.start)}</th>
                <td>{yen(m.amount)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </details>
    </section>
  );
}
