import type { Currency } from './types';

export function yen(amount: number): string {
  return `¥${Math.round(amount).toLocaleString('ja-JP')}`;
}

export function money(amount: number, currency: Currency): string {
  if (currency === 'JPY') return yen(amount);
  return `$${amount.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
}

/** '2026-10-22' → '10/22'。年が今年と違う場合は '2027/3/2' */
export function shortDate(date: string, today: string): string {
  const [y, m, d] = date.split('-').map(Number);
  return y === Number(today.slice(0, 4)) ? `${m}/${d}` : `${y}/${m}/${d}`;
}

export function fullDate(date: string): string {
  const [y, m, d] = date.split('-').map(Number);
  return `${y}/${m}/${d}`;
}

export function inDays(days: number): string {
  if (days === 0) return '今日';
  if (days === 1) return '明日';
  return `あと${days}日`;
}
