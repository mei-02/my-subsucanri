import type { Subscription } from '../lib/types';

type Props = Pick<Subscription, 'icon' | 'color' | 'name'> & { size?: number; round?: boolean };

export function ServiceIcon({ icon, color, name, size = 44, round = false }: Props) {
  const style = { width: size, height: size, borderRadius: round ? '50%' : size * 0.32 };

  if (icon.kind === 'image') {
    return <img className="tile tile-image" style={style} src={icon.dataUrl} alt="" />;
  }
  return (
    <div className={`tile tile-${color}`} style={{ ...style, fontSize: size * 0.42 }} aria-hidden="true">
      {[...name.trim()][0]?.toUpperCase() ?? '?'}
    </div>
  );
}
