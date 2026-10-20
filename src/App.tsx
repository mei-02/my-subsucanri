import { useCallback, useEffect, useRef, useState } from 'react';
import { BottomNav } from './components/BottomNav';
import { FeedbackProvider } from './components/Feedback';
import { todayStr } from './lib/calc';
import { createVault, decrypt, encrypt, type EncryptedEnvelope, type Vault } from './lib/crypto';
import { loadEnvelope, requestPersistence, saveEnvelope } from './lib/storage';
import { AUTO_LOCK_MINUTES, createInitialData, type AppData } from './lib/types';
import { useRoute } from './router';
import { Analysis } from './screens/Analysis';
import { Detail } from './screens/Detail';
import { Edit } from './screens/Edit';
import { Home } from './screens/Home';
import { List } from './screens/List';
import { LockScreen } from './screens/LockScreen';
import { Settings } from './screens/Settings';
import { AppContext, type AppApi } from './state';

type Phase = { kind: 'loading' } | { kind: 'setup' } | { kind: 'locked'; envelope: EncryptedEnvelope } | { kind: 'open' };

export function App() {
  const [phase, setPhase] = useState<Phase>({ kind: 'loading' });
  const [data, setData] = useState<AppData | null>(null);
  const vault = useRef<Vault | null>(null);
  const saving = useRef(Promise.resolve());

  useEffect(() => {
    loadEnvelope().then((envelope) => setPhase(envelope ? { kind: 'locked', envelope } : { kind: 'setup' }));
  }, []);

  const persist = useCallback((next: AppData) => {
    const v = vault.current;
    if (!v) return Promise.resolve();
    // 保存は順番に行う（古い内容で上書きしないため）
    saving.current = saving.current.then(async () => saveEnvelope(await encrypt(v, next)));
    return saving.current;
  }, []);

  const lock = useCallback(() => {
    saving.current.finally(async () => {
      const envelope = await loadEnvelope();
      vault.current = null;
      setData(null);
      setPhase(envelope ? { kind: 'locked', envelope } : { kind: 'setup' });
    });
  }, []);

  useAutoLock(phase.kind === 'open', lock);

  const setup = async (password: string) => {
    vault.current = await createVault(password);
    const initial = createInitialData();
    await persist(initial);
    await requestPersistence();
    setData(initial);
    setPhase({ kind: 'open' });
  };

  const unlock = async (password: string) => {
    if (phase.kind !== 'locked') return;
    const opened = await decrypt<AppData>(phase.envelope, password);
    vault.current = opened.vault;
    setData(opened.data);
    setPhase({ kind: 'open' });
  };

  if (phase.kind === 'loading') return <div className="screen" />;
  if (phase.kind !== 'open' || !data) {
    return <LockScreen mode={phase.kind === 'setup' ? 'setup' : 'unlock'} onSubmit={phase.kind === 'setup' ? setup : unlock} />;
  }

  const api: AppApi = {
    data,
    today: todayStr(),
    update: async (fn) => {
      const next = fn(data);
      setData(next);
      await persist(next);
    },
    lock,
    changePassword: async (current, next) => {
      const envelope = await loadEnvelope();
      if (!envelope) throw new Error('データが見つかりません');
      await decrypt(envelope, current);
      vault.current = await createVault(next);
      await persist(data);
    },
    exportBackup: async () => {
      if (!vault.current) return;
      const envelope = await encrypt(vault.current, data);
      const blob = new Blob([JSON.stringify(envelope)], { type: 'application/json' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `my-subsucanri-backup-${todayStr()}.json`;
      a.click();
      URL.revokeObjectURL(a.href);
    },
    importBackup: async (file, password) => {
      const envelope = JSON.parse(await file.text()) as EncryptedEnvelope;
      const imported = await decrypt<AppData>(envelope, password);
      if (imported.data?.version !== 1 || !Array.isArray(imported.data.subscriptions)) {
        throw new Error('バックアップの形式が正しくありません');
      }
      // 読み込んだデータは今のマスターパスワードで暗号化し直す
      setData(imported.data);
      await persist(imported.data);
    },
  };

  return (
    <AppContext.Provider value={api}>
      <Routes />
    </AppContext.Provider>
  );
}

function Routes() {
  const route = useRoute();
  const [, section, id] = route.split('/');
  let screen;
  if (section === 'list') screen = <List />;
  else if (section === 'analysis') screen = <Analysis />;
  else if (section === 'settings') screen = <Settings />;
  else if (section === 'sub' && id) screen = <Detail id={id} />;
  else if (section === 'new') screen = <Edit />;
  else if (section === 'edit' && id) screen = <Edit id={id} />;
  else screen = <Home />;

  const tabs = ['/', '/list', '/analysis', '/settings'];
  const path = route === '' ? '/' : route;
  return (
    <>
      {screen}
      {tabs.includes(path) && <BottomNav current={path} />}
    </>
  );
}

/** 操作がないまま一定時間たったらロックする。アプリを閉じていた時間も数える */
function useAutoLock(enabled: boolean, lock: () => void) {
  useEffect(() => {
    if (!enabled) return;
    let last = Date.now();
    const limit = AUTO_LOCK_MINUTES * 60_000;
    const touch = () => (last = Date.now());
    const check = () => {
      if (Date.now() - last >= limit) lock();
    };
    const onVisible = () => {
      if (document.visibilityState === 'visible') check();
    };
    const events = ['pointerdown', 'keydown', 'scroll', 'touchstart'] as const;
    events.forEach((e) => window.addEventListener(e, touch, { passive: true }));
    document.addEventListener('visibilitychange', onVisible);
    const timer = window.setInterval(check, 15_000);
    return () => {
      events.forEach((e) => window.removeEventListener(e, touch));
      document.removeEventListener('visibilitychange', onVisible);
      window.clearInterval(timer);
    };
  }, [enabled, lock]);
}

export function Root() {
  return (
    <FeedbackProvider>
      <App />
    </FeedbackProvider>
  );
}
