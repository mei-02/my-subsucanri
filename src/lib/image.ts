// アイコン画像は中央を正方形に切り抜き、128pxのPNGにして端末内に保存する
const SIZE = 128;

function loadImage(src: string, crossOrigin: boolean): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    if (crossOrigin) img.crossOrigin = 'anonymous';
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
    return toSquareDataUrl(await loadImage(url, false));
  } finally {
    URL.revokeObjectURL(url);
  }
}

/**
 * ボタンを押したときだけ呼ぶ。ドメイン名だけを外部のアイコン取得サービスに送り、
 * 取得した画像は端末内に保存するので、以降は通信しない。
 */
export async function fetchSiteIcon(domain: string): Promise<string> {
  const host = domain.trim().replace(/^https?:\/\//, '').replace(/\/.*$/, '');
  if (!host) throw new Error('ドメインを入力してください');
  const sources = [
    `https://icons.duckduckgo.com/ip3/${encodeURIComponent(host)}.ico`,
    `https://www.google.com/s2/favicons?domain=${encodeURIComponent(host)}&sz=128`,
  ];
  for (const src of sources) {
    try {
      const img = await loadImage(src, true);
      if (img.naturalWidth >= 16) return toSquareDataUrl(img);
    } catch {
      // 次の取得先を試す
    }
  }
  throw new Error('アイコンを取得できませんでした。画像を選んで登録してください');
}
