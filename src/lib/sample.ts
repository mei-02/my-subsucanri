import { addCycle, toDateStr, todayStr } from './calc';
import { CATALOG } from './catalog';
import { newId, type AppData, type Subscription } from './types';

// 開発用のサンプルデータ（本番ビルドには含まれない）
export function withSampleData(data: AppData): AppData {
  const today = todayStr();
  const card = { id: newId(), name: '楽天カード' };
  const paypay = { id: newId(), name: 'PayPay' };
  const ago = (months: number, days = 0) => {
    const d = new Date(`${addCycle(today, { unit: 'month', every: 1 }, -months)}T00:00:00`);
    d.setDate(d.getDate() - days);
    return toDateStr(d);
  };

  const fromCatalog = (id: string, plan: number, startDate: string, extra: Partial<Subscription> = {}): Subscription => {
    const s = CATALOG.find((c) => c.id === id)!;
    const p = s.plans[plan];
    return {
      id: newId(),
      name: s.name,
      icon: s.slug ? { kind: 'preset', slug: s.slug } : { kind: 'letter' },
      color: s.color,
      categoryId: data.categories.find((c) => c.name === s.category)?.id ?? data.categories[0].id,
      paymentMethodId: card.id,
      loginId: '',
      password: '',
      currency: p.currency ?? 'JPY',
      cycle: p.cycle,
      startDate,
      prices: [{ from: startDate, amount: p.amount ?? 1000 }],
      memo: '',
      catalogId: s.id,
      planName: p.name,
      ...extra,
    };
  };

  const subs: Subscription[] = [
    fromCatalog('netflix', 1, ago(30, 5), {
      prices: [
        { from: ago(30, 5), amount: 1490 },
        { from: ago(12), amount: 1590 },
      ],
      loginId: 'me@example.com',
      password: 'sample-password',
    }),
    fromCatalog('apple-music', 0, ago(14, 8), { paymentMethodId: paypay.id }),
    fromCatalog('hulu', 0, ago(5, -2)),
    fromCatalog('unext', 0, ago(8, 19)),
    fromCatalog('disney-plus', 0, ago(3, 12)),
    fromCatalog('youtube-premium', 0, ago(20, 15)),
    fromCatalog('amazon-prime', 1, ago(14, -40)),
    fromCatalog('uber-one', 0, ago(3, -7)),
    fromCatalog('claude', 0, ago(4, 1)),
    fromCatalog('duolingo', 1, today, { trialEndDate: toDateStr(new Date(Date.now() + 5 * 86_400_000)), prices: [{ from: today, amount: 12800 }] }),
    fromCatalog('abema', 1, ago(20), { cancelledAt: ago(2) }),
  ];
  return { ...data, paymentMethods: [card, paypay], subscriptions: subs };
}
