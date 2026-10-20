import { useLayoutEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import { LockIcon } from '../components/Icons';
import { ServiceIcon } from '../components/ServiceIcon';
import { isActive, isInTrial, monthlyEquivalent, monthlyTotal } from '../lib/calc';
import { yen } from '../lib/format';
import { packCircles } from '../lib/pack';
import type { Subscription } from '../lib/types';
import { navigate } from '../router';
import { useApp } from '../state';

const WEEKDAYS = ['日', '月', '火', '水', '木', '金', '土'];

export function Home() {
  const { data, today, lock } = useApp();
  const { subscriptions, settings } = data;
  const active = subscriptions.filter(isActive);
  const monthly = monthlyTotal(subscriptions, today, settings.usdRate);

  const [, m, d] = today.split('-').map(Number);
  const weekday = WEEKDAYS[new Date(`${today}T00:00:00`).getDay()];

  return (
    <main className="screen with-nav home">
      <header className="row between">
        <span className="muted small bold">
          {m}月{d}日（{weekday}）
        </span>
        <button className="icon-btn" aria-label="今すぐロック" onClick={lock}>
          <LockIcon size={20} />
        </button>
      </header>
      <div className="stack-2">
        <h1 className="title-lg">わたしのサブスク</h1>
        <p className="muted small">
          毎月 <strong className="ink">{yen(monthly)}</strong>・{active.length}件
        </p>
      </div>
      <Jar subs={active} today={today} usdRate={settings.usdRate} />
    </main>
  );
}

// 瓶の高さは中身に合わせる（最低 JAR_MIN、画面に入る高さまで）。入りきらないときはアイコンを縮める
const JAR_MIN = 220;
const LID = 18;
const HEADROOM = 56;

function Jar({ subs, today, usdRate }: { subs: Subscription[]; today: string; usdRate: number }) {
  const wrap = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ width: 0, height: 0 });

  useLayoutEffect(() => {
    const el = wrap.current;
    if (!el) return;
    const measure = () => setSize({ width: el.clientWidth, height: Math.max(el.clientHeight - LID, JAR_MIN) });
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const packed = useMemo(
    () =>
      packCircles(
        subs.map((s) => ({ id: s.id, weight: Math.max(monthlyEquivalent(s, today, usdRate), 100) })),
        { width: size.width, height: size.height, gap: 5, minD: 44, maxD: Math.min(104, size.width * 0.32) },
      ),
    [subs, today, usdRate, size.width, size.height],
  );
  const top = Math.min(size.height, ...packed.map((p) => p.y - p.d / 2));
  const jarHeight = subs.length === 0 ? JAR_MIN : Math.min(size.height, Math.max(JAR_MIN, size.height - top + HEADROOM));
  const shift = jarHeight - size.height;
  const stagger = Math.min(110, 2200 / Math.max(packed.length, 1));

  return (
    <div className="jar-wrap" ref={wrap}>
      <div className="jar-lid" aria-hidden="true">
        <span />
      </div>
      <div className="jar" style={{ height: jarHeight }}>
        <span className="jar-shine" aria-hidden="true" />
        {subs.length === 0 && (
          <div className="jar-empty">
            <p className="muted small">登録したサブスクが、ここに貯まっていきます</p>
            <button className="btn btn-primary" onClick={() => navigate('/add')}>
              サブスクを追加する
            </button>
          </div>
        )}
        {packed.map((p, i) => {
          const sub = subs.find((s) => s.id === p.id)!;
          return (
            <a
              key={p.id}
              href={`#/sub/${p.id}`}
              aria-label={sub.name}
              className={`coin${isInTrial(sub, today) ? ' coin-trial' : ''}`}
              style={
                {
                  left: p.x - p.d / 2,
                  top: p.y + shift - p.d / 2,
                  '--from': `${-Math.round(p.y + shift + p.d)}px`,
                  animationDelay: `${Math.round(i * stagger)}ms`,
                } as CSSProperties
              }
            >
              <ServiceIcon {...sub} size={p.d} round />
            </a>
          );
        })}
      </div>
    </div>
  );
}
