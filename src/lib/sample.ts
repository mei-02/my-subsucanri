import { addCycle, toDateStr, todayStr } from './calc';
import { newId, type AppData, type Subscription } from './types';

// 開発用のサンプルデータ（本番ビルドには含まれない）
export function withSampleData(data: AppData): AppData {
  const today = todayStr();
  const cat = (name: string) => data.categories.find((c) => c.name === name)?.id ?? data.categories[0].id;
  const card = { id: newId(), name: '楽天カード' };
  const paypay = { id: newId(), name: 'PayPay' };
  const base = { loginId: '', password: '', memo: '', icon: { kind: 'letter' } as const, color: 'pink' as const };
  const ago = (months: number) => addCycle(today, { unit: 'month', every: 1 }, -months);

  const subs: Subscription[] = [
    { ...base, id: newId(), name: 'Netflix', icon: { kind: 'preset', slug: 'netflix' }, categoryId: cat('動画'), paymentMethodId: card.id, currency: 'JPY', cycle: { unit: 'month', every: 1 }, startDate: ago(30), prices: [{ from: ago(30), amount: 1490 }, { from: ago(12), amount: 1590 }], loginId: 'me@example.com', password: 'sample-password' },
    { ...base, id: newId(), name: 'Apple Music', icon: { kind: 'preset', slug: 'applemusic' }, color: 'blue', categoryId: cat('音楽'), paymentMethodId: paypay.id, currency: 'JPY', cycle: { unit: 'month', every: 1 }, startDate: ago(14), prices: [{ from: ago(14), amount: 1080 }] },
    { ...base, id: newId(), name: 'Hulu', color: 'green', categoryId: cat('動画'), paymentMethodId: card.id, currency: 'JPY', cycle: { unit: 'month', every: 1 }, startDate: ago(5), prices: [{ from: ago(5), amount: 1026 }] },
    { ...base, id: newId(), name: 'Duolingo', icon: { kind: 'preset', slug: 'duolingo' }, color: 'green', categoryId: cat('学習'), paymentMethodId: card.id, currency: 'JPY', cycle: { unit: 'year', every: 1 }, startDate: today, trialEndDate: toDateStr(new Date(Date.now() + 5 * 86_400_000)), prices: [{ from: today, amount: 12800 }] },
    { ...base, id: newId(), name: 'Uber One', icon: { kind: 'preset', slug: 'uber' }, color: 'yellow', categoryId: cat('生活'), paymentMethodId: card.id, currency: 'USD', cycle: { unit: 'month', every: 1 }, startDate: ago(3), prices: [{ from: ago(3), amount: 9.99 }] },
    { ...base, id: newId(), name: 'Disney+', color: 'purple', categoryId: cat('動画'), paymentMethodId: card.id, currency: 'JPY', cycle: { unit: 'month', every: 1 }, startDate: ago(20), prices: [{ from: ago(20), amount: 990 }], cancelledAt: ago(2) },
  ];
  return { ...data, paymentMethods: [card, paypay], subscriptions: subs };
}
