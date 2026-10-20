import { useEffect, useState } from 'react';

// #/list のようなハッシュで画面を切り替える（スマホの戻る操作がそのまま使える）
function current(): string {
  return location.hash.replace(/^#/, '') || '/';
}

export function useRoute(): string {
  const [route, setRoute] = useState(current);
  useEffect(() => {
    const onChange = () => {
      setRoute(current());
      window.scrollTo(0, 0);
    };
    window.addEventListener('hashchange', onChange);
    return () => window.removeEventListener('hashchange', onChange);
  }, []);
  return route;
}

export function navigate(path: string, { replace = false } = {}): void {
  if (replace) location.replace(`#${path}`);
  else location.hash = path;
}

export function goBack(fallback = '/'): void {
  if (history.length > 1) history.back();
  else navigate(fallback, { replace: true });
}
