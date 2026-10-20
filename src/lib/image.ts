// アイコン画像は中央を正方形に切り抜き、128pxのPNGにして端末内に保存する
const SIZE = 128;

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('画像を読み込めませんでした'));
    img.src = src;
  });
}

function toSquareDataUrl(img: HTMLImageElement): string {
  const side = Math.min(img.naturalWidth, img.naturalHeight);
  const canvas = document.createElement('canvas');
  canvas.width = SIZE;
  canvas.height = SIZE;
  const ctx = canvas.getContext('2d')!;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(img, (img.naturalWidth - side) / 2, (img.naturalHeight - side) / 2, side, side, 0, 0, SIZE, SIZE);
  return canvas.toDataURL('image/png');
}

export async function imageFileToIcon(file: File): Promise<string> {
  const url = URL.createObjectURL(file);
  try {
    return toSquareDataUrl(await loadImage(url));
  } finally {
    URL.revokeObjectURL(url);
  }
}
