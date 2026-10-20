import { isInTrial, priceAt, toDateStr, todayStr } from './calc';
import { money } from './format';
import type { Subscription } from './types';

// iPhone のカレンダーなどに読み込めるカレンダーファイル（iCalendar, RFC 5545）を作る。
// 支払日を終日の繰り返し予定にし、前日の9時に通知する。

function escapeText(text: string): string {
  return text.replace(/\\/g, '\\\\').replace(/\n/g, '\\n').replace(/([,;])/g, '\\$1');
}

/** 1行75バイトまでに折り返す（日本語の文字の途中では切らない） */
export function foldLine(line: string): string {
  const encoder = new TextEncoder();
  const parts: string[] = [];
  let current = '';
  let bytes = 0;
  for (const ch of line) {
    const size = encoder.encode(ch).length;
    const limit = parts.length === 0 ? 75 : 74;
    if (bytes + size > limit) {
      parts.push(current);
      current = '';
      bytes = 0;
    }
    current += ch;
    bytes += size;
  }
  parts.push(current);
  return parts.join('\r\n ');
}

/** 月末に近い日（29〜31日）は、その日がない月では月末にする */
export function recurrenceRule(sub: Subscription, anchor: string): string {
  const { unit, every } = sub.cycle;
  const [, m, d] = anchor.split('-').map(Number);
  const interval = every > 1 ? `;INTERVAL=${every}` : '';
  if (unit === 'week') return `FREQ=WEEKLY${interval}`;
  const days = d > 28 ? Array.from({ length: d - 27 }, (_, i) => 28 + i).join(',') : String(d);
  const pos = d > 28 ? ';BYSETPOS=-1' : '';
  if (unit === 'month') return `FREQ=MONTHLY${interval};BYMONTHDAY=${days}${pos}`;
  return `FREQ=YEARLY${interval};BYMONTH=${m};BYMONTHDAY=${days}${pos}`;
}

const compact = (date: string) => date.replace(/-/g, '');

export function buildCalendar(subs: Subscription[], today = todayStr(), stamp = new Date()): string {
  const dtstamp = stamp.toISOString().replace(/[-:]/g, '').replace(/\.\d+Z$/, 'Z');
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//my-subsucanri//JA',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'X-WR-CALNAME:サブスクの支払い',
  ];
  for (const sub of subs) {
    if (sub.cancelledAt) continue;
    const anchor = sub.trialEndDate ?? sub.startDate;
    const price = money(priceAt(sub, today), sub.currency);
    const title = isInTrial(sub, today) ? `${sub.name} ${price}（お試し終了後）` : `${sub.name} ${price}`;
    const next = new Date(`${anchor}T00:00:00`);
    next.setDate(next.getDate() + 1);
    lines.push(
      'BEGIN:VEVENT',
      `UID:${sub.id}@my-subsucanri`,
      `DTSTAMP:${dtstamp}`,
      `DTSTART;VALUE=DATE:${compact(anchor)}`,
      `DTEND;VALUE=DATE:${compact(toDateStr(next))}`,
      `RRULE:${recurrenceRule(sub, anchor)}`,
      `SUMMARY:${escapeText(title)}`,
      `DESCRIPTION:${escapeText('サブスクの支払日（my subscriptions から書き出し）')}`,
      'TRANSP:TRANSPARENT',
      'BEGIN:VALARM',
      'ACTION:DISPLAY',
      `DESCRIPTION:${escapeText(`明日は${sub.name}の支払日です`)}`,
      'TRIGGER:-PT15H',
      'END:VALARM',
      'END:VEVENT',
    );
  }
  lines.push('END:VCALENDAR');
  return lines.map(foldLine).join('\r\n') + '\r\n';
}

/** ファイルとして保存する。iPhone では「ダウンロード」から開くと、カレンダーに追加できる */
export function downloadCalendar(subs: Subscription[]): void {
  const blob = new Blob([buildCalendar(subs)], { type: 'text/calendar;charset=utf-8' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `subscriptions-${todayStr()}.ics`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 10_000);
}
