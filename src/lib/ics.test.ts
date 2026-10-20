import { describe, expect, it } from 'vitest';
import { buildCalendar, foldLine, recurrenceRule } from './ics';
import type { Subscription } from './types';

function sub(overrides: Partial<Subscription>): Subscription {
  return {
    id: 'abc',
    name: 'Netflix',
    icon: { kind: 'letter' },
    color: 'pink',
    categoryId: 'cat-1',
    paymentMethodId: '',
    loginId: 'me@example.com',
    password: 'secret-password',
    currency: 'JPY',
    cycle: { unit: 'month', every: 1 },
    startDate: '2026-01-15',
    prices: [{ from: '2026-01-15', amount: 1590 }],
    memo: '',
    ...overrides,
  };
}

describe('recurrenceRule', () => {
  it('毎月・毎年・毎週・数ヶ月ごと', () => {
    expect(recurrenceRule(sub({}), '2026-01-15')).toBe('FREQ=MONTHLY;BYMONTHDAY=15');
    expect(recurrenceRule(sub({ cycle: { unit: 'month', every: 3 } }), '2026-01-15')).toBe('FREQ=MONTHLY;INTERVAL=3;BYMONTHDAY=15');
    expect(recurrenceRule(sub({ cycle: { unit: 'year', every: 1 } }), '2026-08-10')).toBe('FREQ=YEARLY;BYMONTH=8;BYMONTHDAY=10');
    expect(recurrenceRule(sub({ cycle: { unit: 'week', every: 1 } }), '2026-01-15')).toBe('FREQ=WEEKLY');
  });
  it('31日払いは、短い月では月末にする', () => {
    expect(recurrenceRule(sub({}), '2026-01-31')).toBe('FREQ=MONTHLY;BYMONTHDAY=28,29,30,31;BYSETPOS=-1');
  });
});

describe('buildCalendar', () => {
  const ics = buildCalendar(
    [sub({}), sub({ id: 'gone', name: 'Hulu', cancelledAt: '2026-05-01' }), sub({ id: 'trial', name: 'Duolingo', trialEndDate: '2026-10-25' })],
    '2026-10-20',
    new Date('2026-10-20T00:00:00Z'),
  );

  it('契約中のものだけを繰り返し予定にする', () => {
    expect(ics).toContain('UID:abc@my-subsucanri');
    expect(ics).toContain('DTSTART;VALUE=DATE:20260115');
    expect(ics).toContain('DTEND;VALUE=DATE:20260116');
    expect(ics).toContain('SUMMARY:Netflix ¥1\\,590');
    expect(ics).not.toContain('Hulu');
  });

  it('トライアル中は終了日から始める', () => {
    expect(ics).toContain('DTSTART;VALUE=DATE:20261025');
    expect(ics).toContain('お試し終了後');
  });

  it('IDやパスワードは書き出さない', () => {
    expect(ics).not.toContain('me@example.com');
    expect(ics).not.toContain('secret-password');
  });

  it('改行はCRLFで、1行75バイトまで', () => {
    const lines = ics.split('\r\n');
    expect(ics.endsWith('\r\n')).toBe(true);
    expect(lines.every((l) => new TextEncoder().encode(l).length <= 75)).toBe(true);
  });
});

describe('foldLine', () => {
  it('日本語の途中で切らずに折り返す', () => {
    const folded = foldLine(`SUMMARY:${'あ'.repeat(40)}`);
    expect(folded.split('\r\n ').join('')).toBe(`SUMMARY:${'あ'.repeat(40)}`);
    expect(folded).toContain('\r\n ');
  });
});
