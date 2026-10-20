import { describe, expect, it } from 'vitest';
import {
  addCycle,
  annualSavings,
  cumulative,
  daysBetween,
  monthlyEquivalent,
  monthlyTotal,
  nextPayment,
  paymentsInMonth,
  priceAt,
} from './calc';
import type { Subscription } from './types';

function sub(overrides: Partial<Subscription>): Subscription {
  return {
    id: 'x',
    name: 'test',
    icon: { kind: 'letter' },
    color: 'pink',
    categoryId: 'cat-1',
    paymentMethodId: '',
    loginId: '',
    password: '',
    currency: 'JPY',
    cycle: { unit: 'month', every: 1 },
    startDate: '2026-01-15',
    prices: [{ from: '2026-01-15', amount: 1000 }],
    memo: '',
    ...overrides,
  };
}

describe('addCycle', () => {
  it('月末日は短い月の末日に丸める', () => {
    expect(addCycle('2026-01-31', { unit: 'month', every: 1 }, 1)).toBe('2026-02-28');
    expect(addCycle('2026-01-31', { unit: 'month', every: 1 }, 2)).toBe('2026-03-31');
  });
  it('年をまたぐ', () => {
    expect(addCycle('2026-11-10', { unit: 'month', every: 3 }, 1)).toBe('2027-02-10');
  });
  it('うるう日の年払い', () => {
    expect(addCycle('2024-02-29', { unit: 'year', every: 1 }, 1)).toBe('2025-02-28');
  });
  it('週払い', () => {
    expect(addCycle('2026-12-28', { unit: 'week', every: 1 }, 1)).toBe('2027-01-04');
  });
});

describe('nextPayment', () => {
  it('今日が支払日なら今日', () => {
    expect(nextPayment(sub({}), '2026-10-15')).toBe('2026-10-15');
  });
  it('次の支払日', () => {
    expect(nextPayment(sub({}), '2026-10-16')).toBe('2026-11-15');
  });
  it('トライアル中は終了日が最初の支払日', () => {
    expect(nextPayment(sub({ trialEndDate: '2026-10-25' }), '2026-10-20')).toBe('2026-10-25');
  });
  it('解約済みはなし', () => {
    expect(nextPayment(sub({ cancelledAt: '2026-06-01' }), '2026-10-20')).toBeUndefined();
  });
});

describe('cumulative', () => {
  it('値上げを反映して累計する', () => {
    const s = sub({
      startDate: '2023-04-15',
      prices: [
        { from: '2023-04-15', amount: 1490 },
        { from: '2024-10-01', amount: 1590 },
      ],
    });
    // 2023/4〜2024/9 の18回 + 2024/10〜2026/10 の25回
    expect(cumulative(s, '2026-10-20', 150)).toEqual({ total: 18 * 1490 + 25 * 1590, count: 43 });
  });
  it('ドル建ては円に換算する', () => {
    const s = sub({ currency: 'USD', prices: [{ from: '2026-01-15', amount: 20 }] });
    expect(cumulative(s, '2026-03-20', 150)).toEqual({ total: 9000, count: 3 });
  });
  it('解約後は数えない', () => {
    expect(cumulative(sub({ cancelledAt: '2026-02-20' }), '2026-10-20', 150).count).toBe(2);
  });
});

describe('金額の換算', () => {
  it('年払いは12で割る', () => {
    const s = sub({ cycle: { unit: 'year', every: 1 }, prices: [{ from: '2026-01-15', amount: 5900 }] });
    expect(monthlyEquivalent(s, '2026-10-20', 150)).toBeCloseTo(491.67, 1);
  });
  it('価格は日付時点のもの', () => {
    const s = sub({ prices: [{ from: '2026-01-15', amount: 1000 }, { from: '2026-06-01', amount: 1200 }] });
    expect(priceAt(s, '2026-05-31')).toBe(1000);
    expect(priceAt(s, '2026-06-01')).toBe(1200);
  });
  it('月の合計はトライアル中と解約済みを除く', () => {
    const subs = [sub({}), sub({ trialEndDate: '2026-11-01' }), sub({ cancelledAt: '2026-05-01' })];
    expect(monthlyTotal(subs, '2026-10-20', 150)).toBe(1000);
  });
  it('今月の支払いは実際の支払日で数える', () => {
    const subs = [sub({}), sub({ cycle: { unit: 'year', every: 1 }, startDate: '2025-08-10', prices: [{ from: '2025-08-10', amount: 5900 }] })];
    expect(paymentsInMonth(subs, '2026-10-01', 150)).toBe(1000);
    expect(paymentsInMonth(subs, '2026-08-01', 150)).toBe(6900);
  });
  it('節約額は解約時点の年額', () => {
    expect(annualSavings(sub({ cancelledAt: '2026-06-01' }), 150)).toBe(12000);
  });
});

describe('daysBetween', () => {
  it('夏時間などに左右されない', () => {
    expect(daysBetween('2026-10-20', '2026-10-25')).toBe(5);
    expect(daysBetween('2026-12-31', '2027-01-01')).toBe(1);
  });
});
