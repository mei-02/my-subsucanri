import { describe, expect, it } from 'vitest';
import { packCircles, type PackedCircle } from './pack';

function overlaps(circles: PackedCircle[]): boolean {
  for (let i = 0; i < circles.length; i++) {
    for (let j = i + 1; j < circles.length; j++) {
      const a = circles[i];
      const b = circles[j];
      if (Math.hypot(a.x - b.x, a.y - b.y) < (a.d + b.d) / 2 - 0.01) return true;
    }
  }
  return false;
}

function inside(c: PackedCircle, width: number, height: number): boolean {
  return c.x - c.d / 2 >= 0 && c.x + c.d / 2 <= width && c.y - c.d / 2 >= 0 && c.y + c.d / 2 <= height;
}

const items = (n: number) => Array.from({ length: n }, (_, i) => ({ id: String(i), weight: 300 + ((i * 937) % 2500) }));

describe('packCircles', () => {
  it('重ならず、枠の中に収まる', () => {
    const packed = packCircles(items(12), { width: 340, height: 480 });
    expect(packed).toHaveLength(12);
    expect(overlaps(packed)).toBe(false);
    expect(packed.every((c) => inside(c, 340, 480))).toBe(true);
  });

  it('金額が高いほど大きい', () => {
    const packed = packCircles(
      [
        { id: 'cheap', weight: 500 },
        { id: 'expensive', weight: 3000 },
      ],
      { width: 340, height: 480 },
    );
    const d = (id: string) => packed.find((c) => c.id === id)!.d;
    expect(d('expensive')).toBeGreaterThan(d('cheap'));
  });

  it('下に積もる', () => {
    const packed = packCircles(items(3), { width: 340, height: 480 });
    expect(Math.max(...packed.map((c) => c.y + c.d / 2))).toBeGreaterThan(470);
  });

  it('多すぎるときは小さくして収める', () => {
    const packed = packCircles(items(60), { width: 340, height: 480 });
    expect(packed).toHaveLength(60);
    expect(overlaps(packed)).toBe(false);
    expect(packed.every((c) => inside(c, 340, 480))).toBe(true);
  });

  it('空なら何もしない', () => {
    expect(packCircles([], { width: 340, height: 480 })).toEqual([]);
  });
});
