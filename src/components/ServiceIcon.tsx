import { PRESET_ICONS } from '../lib/services';
import type { Subscription } from '../lib/types';

type Props = Pick<Subscription, 'icon' | 'color' | 'name'> & { size?: number; round?: boolean };

export function ServiceIcon({ icon, color, name, size = 44, round = false }: Props) {
  const style = { width: size, height: size, borderRadius: round ? '50%' : size * 0.32 };
  const preset = icon.kind === 'preset' ? PRESET_ICONS[icon.slug] : undefined;

  if (preset) {
    return (
      <div className={`tile tile-${color}`} style={style}>
        <svg width={size * 0.5} height={size * 0.5} viewBox="0 0 24 24" role="img" aria-label={preset.title}>
          <path d={preset.path} fill={preset.color} />
        </svg>
      </div>
    );
  }
  if (icon.kind === 'image') {
    return <img className="tile tile-image" style={style} src={icon.dataUrl} alt="" />;
  }
  return (
    <div className={`tile tile-${color}`} style={{ ...style, fontSize: size * 0.42 }} aria-hidden="true">
      {[...name.trim()][0]?.toUpperCase() ?? '?'}
    </div>
  );
}
