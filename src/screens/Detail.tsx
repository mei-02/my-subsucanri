import { useState } from 'react';
import { useFeedback } from '../components/Feedback';
import { BackIcon, CopyIcon, EyeIcon, EyeOffIcon } from '../components/Icons';
import { ServiceIcon } from '../components/ServiceIcon';
import { annualSavings, cumulative, cycleLabel, isInTrial, nextPayment, perCycleLabel, priceAt } from '../lib/calc';
import { fullDate, money, shortDate, yen } from '../lib/format';
import { goBack, navigate } from '../router';
import { useApp } from '../state';

export function Detail({ id }: { id: string }) {
  const { data, today, update } = useApp();
  const { toast, confirm } = useFeedback();
  const [showPassword, setShowPassword] = useState(false);
  const sub = data.subscriptions.find((s) => s.id === id);

  if (!sub) {
    return (
      <main className="screen">
        <p className="muted">見つかりませんでした</p>
        <a href="#/list" className="link">
          一覧に戻る
        </a>
      </main>
    );
  }

  const { usdRate, lunchPrice } = data.settings;
  const category = data.categories.find((c) => c.id === sub.categoryId)?.name;
  const method = data.paymentMethods.find((p) => p.id === sub.paymentMethodId)?.name;
  const next = nextPayment(sub, today);
  const total = cumulative(sub, today, usdRate);
  const prices = [...sub.prices].sort((a, b) => b.from.localeCompare(a.from));
  const trial = isInTrial(sub, today);

  const copy = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast(`${label}をコピーしました`);
    } catch {
      toast('コピーできませんでした');
    }
  };

  const setCancelled = async (cancelledAt: string | undefined) => {
    await update((d) => ({
      ...d,
      subscriptions: d.subscriptions.map((s) => (s.id === sub.id ? { ...s, cancelledAt } : s)),
    }));
  };

  const cancel = async () => {
    const ok = await confirm({ title: `${sub.name}を解約済みにしますか？`, message: '今日の日付で記録します', ok: '解約済みにする' });
    if (!ok) return;
    await setCancelled(today);
    const saved = annualSavings({ ...sub, cancelledAt: today }, usdRate);
    toast(saved > 0 ? `年間 ${yen(saved)} の節約！` : '解約を記録しました', 'celebrate');
  };

  const remove = async () => {
    const ok = await confirm({ title: `${sub.name}を削除しますか？`, message: '累計や節約記録からも消えます', ok: '削除する', danger: true });
    if (!ok) return;
    await update((d) => ({ ...d, subscriptions: d.subscriptions.filter((s) => s.id !== sub.id) }));
    navigate('/list', { replace: true });
    toast('削除しました');
  };

  return (
    <main className="screen">
      <header className="row between">
        <button className="icon-btn" aria-label="戻る" onClick={() => goBack('/list')}>
          <BackIcon size={20} />
        </button>
        <button className="pill-btn" onClick={() => navigate(`/edit/${sub.id}`)}>
          編集
        </button>
      </header>

      <div className="row gap-3 pop-in">
        <ServiceIcon {...sub} size={64} />
        <div className="stack-2">
          <h1 className="title">{sub.name}</h1>
          <div className="row gap-1">
            {category && <span className="badge badge-pink">{category}</span>}
            {trial && <span className="badge badge-yellow">お試し中</span>}
            {sub.cancelledAt && <span className="badge">解約済み</span>}
          </div>
        </div>
      </div>

      <div className="grid-2">
        <div className="card stat">
          <span className="muted xsmall">料金</span>
          <strong className="stat-value">
            {money(priceAt(sub, next ?? today), sub.currency)}
            <span className="muted xsmall"> /{perCycleLabel(sub.cycle)}</span>
          </strong>
        </div>
        <div className="card stat">
          <span className="muted xsmall">{trial ? 'トライアル終了' : '次回の支払い'}</span>
          <strong className="stat-value">{trial ? shortDate(sub.trialEndDate!, today) : next ? shortDate(next, today) : '-'}</strong>
        </div>
      </div>

      <div className="total-card">
        <span className="accent-text xsmall bold">{fullDate(sub.startDate)} から今日までの累計</span>
        <strong className="total-value">{yen(total.total)}</strong>
        <span className="muted xsmall">
          {total.count}回の支払い
          {lunchPrice > 0 && total.total > 0 && `・ランチ約${Math.round(total.total / lunchPrice)}回分`}
        </span>
      </div>

      {(sub.loginId || sub.password) && (
        <div className="card list-card">
          {sub.loginId && (
            <div className="list-row">
              <div className="stack-2 grow min0">
                <span className="muted xsmall">ログインID</span>
                <strong className="break">{sub.loginId}</strong>
              </div>
              <button className="square-btn" aria-label="IDをコピー" onClick={() => copy(sub.loginId, 'ID')}>
                <CopyIcon size={18} />
              </button>
            </div>
          )}
          {sub.password && (
            <div className="list-row">
              <div className="stack-2 grow min0">
                <span className="muted xsmall">パスワード</span>
                <strong className={showPassword ? 'break' : 'masked'}>{showPassword ? sub.password : '••••••••••'}</strong>
              </div>
              <button
                className="square-btn"
                aria-label={showPassword ? 'パスワードを隠す' : 'パスワードを表示'}
                onClick={() => setShowPassword((v) => !v)}
              >
                {showPassword ? <EyeOffIcon size={18} /> : <EyeIcon size={18} />}
              </button>
              <button className="square-btn" aria-label="パスワードをコピー" onClick={() => copy(sub.password, 'パスワード')}>
                <CopyIcon size={18} />
              </button>
            </div>
          )}
        </div>
      )}

      <div className="card list-card">
        <div className="kv">
          <span className="muted">支払方法</span>
          <strong>{method ?? '未設定'}</strong>
        </div>
        <div className="kv">
          <span className="muted">支払いサイクル</span>
          <strong>{cycleLabel(sub.cycle)}</strong>
        </div>
        {sub.currency === 'USD' && (
          <div className="kv">
            <span className="muted">円換算</span>
            <strong>
              1ドル={usdRate}円で計算
            </strong>
          </div>
        )}
        <div className="kv-block">
          <span className="muted">料金の履歴</span>
          {prices.map((p, i) => (
            <div key={p.from} className={`row between${i > 0 ? ' muted' : ''}`}>
              <span>{fullDate(p.from)}〜</span>
              <span className={i === 0 ? 'bold' : ''}>{money(p.amount, sub.currency)}</span>
            </div>
          ))}
        </div>
        {sub.memo && (
          <div className="kv-block">
            <span className="muted">メモ</span>
            <p className="memo">{sub.memo}</p>
          </div>
        )}
      </div>

      {sub.cancelledAt ? (
        <button className="btn btn-outline" onClick={() => setCancelled(undefined).then(() => toast('解約を取り消しました'))}>
          解約を取り消す
        </button>
      ) : (
        <button className="btn btn-outline" onClick={cancel}>
          解約したことを記録する
        </button>
      )}
      <button className="btn btn-text-danger" onClick={remove}>
        このサブスクを削除
      </button>
    </main>
  );
}
