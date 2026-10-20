import { ClockIcon, LockIcon } from '../components/Icons';
import { ServiceIcon } from '../components/ServiceIcon';
import { daysBetween, isActive, isInTrial, monthlyTotal, nextPayment, paymentsInMonth, priceAt } from '../lib/calc';
import { inDays, money, shortDate, yen } from '../lib/format';
import { navigate } from '../router';
import { useApp } from '../state';

const WEEKDAYS = ['日', '月', '火', '水', '木', '金', '土'];

export function Home() {
  const { data, today, lock } = useApp();
  const { subscriptions, settings, paymentMethods } = data;
  const active = subscriptions.filter(isActive);

  const thisMonth = paymentsInMonth(subscriptions, `${today.slice(0, 7)}-01`, settings.usdRate);
  const trialEndsThisMonth = active.some((s) => isInTrial(s, today) && s.trialEndDate!.slice(0, 7) === today.slice(0, 7));
  const annual = monthlyTotal(subscriptions, today, settings.usdRate) * 12;
  const lunches = settings.lunchPrice > 0 ? Math.round(annual / settings.lunchPrice) : 0;

  const trials = active
    .filter((s) => isInTrial(s, today))
    .map((s) => ({ sub: s, days: daysBetween(today, s.trialEndDate!) }))
    .sort((a, b) => a.days - b.days);

  const upcoming = active
    .filter((s) => !isInTrial(s, today))
    .map((s) => ({ sub: s, date: nextPayment(s, today)! }))
    .filter((x) => x.date && daysBetween(today, x.date) <= 31)
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(0, 5);

  const [, m, d] = today.split('-').map(Number);
  const weekday = WEEKDAYS[new Date(`${today}T00:00:00`).getDay()];
  const methodName = (id: string) => paymentMethods.find((p) => p.id === id)?.name;

  return (
    <main className="screen with-nav">
      <header className="row between">
        <div className="stack-2">
          <span className="muted small">
            {m}月{d}日（{weekday}）
          </span>
          <h1 className="title">おかえりなさい</h1>
        </div>
        <button className="icon-btn" aria-label="今すぐロック" onClick={lock}>
          <LockIcon size={20} />
        </button>
      </header>

      <section className="hero pop-in">
        <span className="hero-label">今月の支払い</span>
        <div className="hero-amount">{yen(thisMonth)}</div>
        {trialEndsThisMonth && <span className="muted xsmall">トライアル終了後の支払いを含みます</span>}
        <div className="grid-2">
          <div className="mini-card">
            <span className="muted xsmall">年間</span>
            <strong>{yen(annual)}</strong>
          </div>
          <div className="mini-card">
            <span className="muted xsmall">契約中</span>
            <strong>{active.length}件</strong>
          </div>
        </div>
        {lunches > 0 && <span className="muted small">年間でランチ約{lunches}回分です</span>}
      </section>

      {trials.map(({ sub, days }) => (
        <a key={sub.id} href={`#/sub/${sub.id}`} className={`alert pop-in${days <= 3 ? ' alert-urgent' : ''}`}>
          <div className="alert-icon">
            <ClockIcon size={20} />
          </div>
          <div className="stack-2 grow">
            <strong>{sub.name}のトライアル</strong>
            <span className="small">
              {inDays(days)}で終了します（{shortDate(sub.trialEndDate!, today)}）
            </span>
          </div>
        </a>
      ))}

      {subscriptions.length === 0 ? (
        <section className="empty pop-in">
          <p>まだサブスクが登録されていません</p>
          <button className="btn btn-primary" onClick={() => navigate('/new')}>
            最初のサブスクを登録する
          </button>
        </section>
      ) : (
        <section className="stack-3">
          <div className="row between">
            <h2 className="section-title">もうすぐ支払い</h2>
            <a href="#/list" className="link small">
              すべて見る
            </a>
          </div>
          {upcoming.length === 0 ? (
            <p className="muted small">1ヶ月以内の支払いはありません</p>
          ) : (
            <div className="card list-card">
              {upcoming.map(({ sub, date }, i) => {
                const days = daysBetween(today, date);
                return (
                  <a key={sub.id} href={`#/sub/${sub.id}`} className="list-row fade-up" style={{ animationDelay: `${i * 50}ms` }}>
                    <ServiceIcon {...sub} />
                    <div className="stack-2 grow">
                      <strong>{sub.name}</strong>
                      <span className="muted xsmall">
                        {shortDate(date, today)}
                        {methodName(sub.paymentMethodId) && `・${methodName(sub.paymentMethodId)}`}
                      </span>
                    </div>
                    <div className="stack-2 end">
                      <strong>{money(priceAt(sub, date), sub.currency)}</strong>
                      <span className={`badge${days <= 3 ? ' badge-pink' : ''}`}>{inDays(days)}</span>
                    </div>
                  </a>
                );
              })}
            </div>
          )}
        </section>
      )}
    </main>
  );
}
