import type { Currency, Cycle, Subscription } from './types';

// 日付はすべてローカル日付の 'YYYY-MM-DD' 文字列で扱う

export function toDateStr(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function todayStr(): string {
  return toDateStr(new Date());
}

function parse(date: string): { y: number; m: number; d: number } {
  const [y, m, d] = date.split('-').map(Number);
  return { y, m: m - 1, d };
}

function daysInMonth(y: number, m: number): number {
  return new Date(y, m + 1, 0).getDate();
}

/** anchor から周期を n 回進めた日付。月末日はその月の末日に丸める（1/31 → 2/28） */
export function addCycle(anchor: string, cycle: Cycle, n: number): string {
  const { y, m, d } = parse(anchor);
  if (cycle.unit === 'week') {
    return toDateStr(new Date(y, m, d + 7 * cycle.every * n));
  }
  const months = cycle.unit === 'month' ? cycle.every * n : 12 * cycle.every * n;
  const ty = y + Math.floor((m + months) / 12);
  const tm = (((m + months) % 12) + 12) % 12;
  return toDateStr(new Date(ty, tm, Math.min(d, daysInMonth(ty, tm))));
}

export function daysBetween(from: string, to: string): number {
  const a = parse(from);
  const b = parse(to);
  return Math.round((Date.UTC(b.y, b.m, b.d) - Date.UTC(a.y, a.m, a.d)) / 86_400_000);
}

function billingAnchor(sub: Subscription): string {
  return sub.trialEndDate ?? sub.startDate;
}

/** until（含む）までの支払日の一覧。解約日以降の支払いは含まない */
export function paymentDates(sub: Subscription, until: string): string[] {
  const end = sub.cancelledAt && sub.cancelledAt < until ? sub.cancelledAt : until;
  const dates: string[] = [];
  for (let n = 0; n < 10_000; n++) {
    const date = addCycle(billingAnchor(sub), sub.cycle, n);
    if (date > end) break;
    dates.push(date);
  }
  return dates;
}

export function priceAt(sub: Subscription, date: string): number {
  const sorted = [...sub.prices].sort((a, b) => a.from.localeCompare(b.from));
  let amount = sorted[0]?.amount ?? 0;
  for (const p of sorted) {
    if (p.from <= date) amount = p.amount;
  }
  return amount;
}

export function toJpy(amount: number, currency: Currency, usdRate: number): number {
  return currency === 'USD' ? amount * usdRate : amount;
}

export function isInTrial(sub: Subscription, today: string): boolean {
  return !!sub.trialEndDate && today < sub.trialEndDate && !sub.cancelledAt;
}

export function nextPayment(sub: Subscription, today: string): string | undefined {
  if (sub.cancelledAt) return undefined;
  for (let n = 0; n < 10_000; n++) {
    const date = addCycle(billingAnchor(sub), sub.cycle, n);
    if (date >= today) return date;
  }
  return undefined;
}

/** 1ヶ月あたりに換算した金額（円） */
export function monthlyEquivalent(sub: Subscription, date: string, usdRate: number): number {
  const jpy = toJpy(priceAt(sub, date), sub.currency, usdRate);
  const { unit, every } = sub.cycle;
  if (unit === 'week') return (jpy * 52) / 12 / every;
  if (unit === 'month') return jpy / every;
  return jpy / (12 * every);
}

/** 契約開始から today までに支払った累計（円）と回数 */
export function cumulative(sub: Subscription, today: string, usdRate: number): { total: number; count: number } {
  const dates = paymentDates(sub, today);
  const total = dates.reduce((sum, d) => sum + toJpy(priceAt(sub, d), sub.currency, usdRate), 0);
  return { total, count: dates.length };
}

/** 指定した月（monthStart は 'YYYY-MM-01'）の支払い合計（円） */
export function paymentsInMonth(subs: Subscription[], monthStart: string, usdRate: number): number {
  const { y, m } = parse(monthStart);
  const monthEnd = toDateStr(new Date(y, m + 1, 0));
  let total = 0;
  for (const sub of subs) {
    for (const d of paymentDates(sub, monthEnd)) {
      if (d >= monthStart) total += toJpy(priceAt(sub, d), sub.currency, usdRate);
    }
  }
  return total;
}

export function isActive(sub: Subscription): boolean {
  return !sub.cancelledAt;
}

/** 契約中かつトライアル中でないサブスクの、1ヶ月あたりの合計（円） */
export function monthlyTotal(subs: Subscription[], today: string, usdRate: number): number {
  return subs
    .filter((s) => isActive(s) && !isInTrial(s, today))
    .reduce((sum, s) => sum + monthlyEquivalent(s, today, usdRate), 0);
}

/** 解約したサブスクで浮いた年間の金額（円） */
export function annualSavings(sub: Subscription, usdRate: number): number {
  if (!sub.cancelledAt) return 0;
  return monthlyEquivalent(sub, sub.cancelledAt, usdRate) * 12;
}

export function cycleLabel(cycle: Cycle): string {
  const unit = { week: '週', month: 'ヶ月', year: '年' }[cycle.unit];
  if (cycle.every === 1) return { week: '毎週', month: '毎月', year: '毎年' }[cycle.unit];
  return `${cycle.every}${unit}ごと`;
}

/** 料金の後ろにつける単位。'/月'、'/3ヶ月' など */
export function perCycleLabel(cycle: Cycle): string {
  const unit = { week: '週', month: 'ヶ月', year: '年' }[cycle.unit];
  if (cycle.every === 1) return { week: '週', month: '月', year: '年' }[cycle.unit];
  return `${cycle.every}${unit}`;
}
