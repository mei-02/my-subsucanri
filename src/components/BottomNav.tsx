import { navigate } from '../router';
import { ChartIcon, GearIcon, HomeIcon, ListIcon, PlusIcon } from './Icons';

const TABS = [
  { path: '/', label: 'ホーム', Icon: HomeIcon },
  { path: '/list', label: '一覧', Icon: ListIcon },
  { path: '/analysis', label: '分析', Icon: ChartIcon },
  { path: '/settings', label: '設定', Icon: GearIcon },
];

export function BottomNav({ current }: { current: string }) {
  const tab = (t: (typeof TABS)[number]) => (
    <a key={t.path} href={`#${t.path}`} className={`nav-tab${current === t.path ? ' active' : ''}`}>
      <t.Icon />
      {t.label}
    </a>
  );
  return (
    <nav className="bottom-nav">
      {TABS.slice(0, 2).map(tab)}
      <button className="nav-add" aria-label="サブスクを追加" onClick={() => navigate('/new')}>
        <PlusIcon size={26} />
      </button>
      {TABS.slice(2).map(tab)}
    </nav>
  );
}
