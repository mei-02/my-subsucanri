// 貯金箱の中に丸いアイコンを積む。
// 大きいものから順に、上からまっすぐ落として最初に止まる位置のうち、一番低い場所に置く。
// 止まる位置は他の丸に接する位置なので、丸どうしは重ならない。

export interface PackInput {
  id: string;
  /** 大きさの元になる値（月あたりの金額） */
  weight: number;
}

export interface PackedCircle {
  id: string;
  x: number;
  y: number;
  d: number;
}

interface Options {
  width: number;
  height: number;
  /** 丸どうしと壁との間のすきま */
  gap?: number;
  minD?: number;
  maxD?: number;
}

function diameters(items: PackInput[], minD: number, maxD: number, scale: number): number[] {
  const max = Math.max(...items.map((i) => i.weight), 1);
  return items.map((i) => (minD + (maxD - minD) * Math.sqrt(Math.max(i.weight, 0) / max)) * scale);
}

function drop(items: PackInput[], ds: number[], width: number, height: number, gap: number): PackedCircle[] | null {
  const order = items.map((item, i) => ({ item, d: ds[i] })).sort((a, b) => b.d - a.d);
  const placed: PackedCircle[] = [];
  for (const [n, { item, d }] of order.entries()) {
    const r = d / 2;
    let best: { x: number; y: number; score: number } | null = null;
    for (let x = r + gap; x <= width - r - gap; x += 2) {
      let y = height - r - gap;
      for (const p of placed) {
        const R = r + p.d / 2 + gap;
        const dx = Math.abs(p.x - x);
        if (dx < R) y = Math.min(y, p.y - Math.sqrt(R * R - dx * dx));
      }
      // 同じ高さなら中央寄りを選び、少しだけ揺らして自然に見せる
      const score = y - Math.abs(x - width / 2) * 0.02 - ((x * 7 + n * 13) % 5) * 0.01;
      if (!best || score > best.score) best = { x, y, score };
    }
    if (!best || best.y - r < gap) return null;
    placed.push({ id: item.id, x: best.x, y: best.y, d });
  }
  return placed;
}

/** 入りきらないときは、全体を少しずつ小さくして収める */
export function packCircles(items: PackInput[], { width, height, gap = 4, minD = 40, maxD = 92 }: Options): PackedCircle[] {
  if (items.length === 0 || width <= 0 || height <= 0) return [];
  const limit = Math.min(maxD, width - gap * 2);
  for (let scale = 1; scale > 0.15; scale *= 0.92) {
    const placed = drop(items, diameters(items, minD, limit, scale), width, height, gap);
    if (placed) return placed;
  }
  return drop(items, diameters(items, minD, limit, 0.15), width, Infinity, gap) ?? [];
}
