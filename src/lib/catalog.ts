import type { Currency, Cycle, TileColor } from './types';

// よく使われるサブスクの一覧。料金は2026年10月時点で確認できた参考価格（税込）。
// 公式の料金が確認できなかったプランは amount を null にして、登録時に入力してもらう。
export const CATALOG_CHECKED_AT = '2026年10月';

export interface CatalogPlan {
  name: string;
  amount: number | null;
  currency?: Currency;
  cycle: Cycle;
}

export interface CatalogService {
  id: string;
  name: string;
  category: string;
  /** 内蔵アイコン（Simple Icons） */
  slug?: string;
  /** 内蔵アイコンがない場合に、アイコンを取得するドメイン */
  domain?: string;
  color: TileColor;
  popular?: boolean;
  plans: CatalogPlan[];
}

const M: Cycle = { unit: 'month', every: 1 };
const Y: Cycle = { unit: 'year', every: 1 };
const usd = (name: string, amount: number, cycle: Cycle): CatalogPlan => ({ name, amount, currency: 'USD', cycle });

export const CATALOG: CatalogService[] = [
  // 動画
  { id: 'netflix', name: 'Netflix', category: '動画', slug: 'netflix', color: 'pink', popular: true, plans: [
    { name: '広告つきスタンダード', amount: 890, cycle: M },
    { name: 'スタンダード', amount: 1590, cycle: M },
    { name: 'プレミアム', amount: 2290, cycle: M },
  ] },
  { id: 'amazon-prime', name: 'Amazonプライム', category: '動画', domain: 'amazon.co.jp', color: 'blue', popular: true, plans: [
    { name: '月額', amount: 600, cycle: M },
    { name: '年額', amount: 5900, cycle: Y },
    { name: 'Prime Student（年額）', amount: 2950, cycle: Y },
  ] },
  { id: 'disney-plus', name: 'Disney+', category: '動画', domain: 'disneyplus.com', color: 'purple', popular: true, plans: [
    { name: 'スタンダード', amount: 1250, cycle: M },
    { name: 'プレミアム', amount: 1670, cycle: M },
    { name: 'スタンダード（年額）', amount: 12500, cycle: Y },
  ] },
  { id: 'hulu', name: 'Hulu', category: '動画', domain: 'hulu.jp', color: 'green', popular: true, plans: [{ name: '月額', amount: 1320, cycle: M }] },
  { id: 'unext', name: 'U-NEXT', category: '動画', domain: 'video.unext.jp', color: 'blue', popular: true, plans: [{ name: '月額', amount: 2189, cycle: M }] },
  { id: 'abema', name: 'ABEMAプレミアム', category: '動画', domain: 'abema.tv', color: 'green', popular: true, plans: [
    { name: '広告つき', amount: 680, cycle: M },
    { name: '広告なし', amount: 1180, cycle: M },
  ] },
  { id: 'dazn', name: 'DAZN', category: '動画', slug: 'dazn', color: 'yellow', plans: [
    { name: 'Standard（月額）', amount: 4200, cycle: M },
    { name: 'Standard（年間一括）', amount: 32000, cycle: Y },
  ] },
  { id: 'danime', name: 'dアニメストア', category: '動画', domain: 'animestore.docomo.ne.jp', color: 'orange', popular: true, plans: [{ name: '月額', amount: 660, cycle: M }] },
  { id: 'lemino', name: 'Leminoプレミアム', category: '動画', domain: 'lemino.docomo.ne.jp', color: 'purple', plans: [{ name: '月額', amount: 1540, cycle: M }] },
  { id: 'fod', name: 'FODプレミアム', category: '動画', domain: 'fod.fujitv.co.jp', color: 'pink', plans: [{ name: '月額', amount: 976, cycle: M }] },
  { id: 'telasa', name: 'TELASA', category: '動画', domain: 'telasa.jp', color: 'blue', plans: [{ name: '月額', amount: 990, cycle: M }] },
  { id: 'dmm-tv', name: 'DMM TV', category: '動画', slug: 'dmm', color: 'yellow', plans: [{ name: 'DMMプレミアム', amount: 550, cycle: M }] },
  { id: 'wowow', name: 'WOWOWオンデマンド', category: '動画', domain: 'wowow.co.jp', color: 'purple', plans: [{ name: '月額', amount: 2530, cycle: M }] },
  { id: 'youtube-premium', name: 'YouTube Premium', category: '動画', slug: 'youtube', color: 'orange', popular: true, plans: [
    { name: '個人', amount: 1280, cycle: M },
    { name: 'ファミリー', amount: 2280, cycle: M },
    { name: '学生', amount: 780, cycle: M },
    { name: 'Lite', amount: 780, cycle: M },
  ] },
  { id: 'apple-tv', name: 'Apple TV', category: '動画', slug: 'appletv', color: 'blue', plans: [{ name: '月額', amount: 1200, cycle: M }] },
  { id: 'niconico', name: 'ニコニコプレミアム', category: '動画', slug: 'niconico', color: 'yellow', plans: [{ name: '月額', amount: null, cycle: M }] },

  // 音楽
  { id: 'apple-music', name: 'Apple Music', category: '音楽', slug: 'applemusic', color: 'pink', popular: true, plans: [
    { name: '個人', amount: 1180, cycle: M },
    { name: 'ファミリー', amount: 1980, cycle: M },
    { name: '学生', amount: 680, cycle: M },
  ] },
  { id: 'spotify', name: 'Spotify', category: '音楽', slug: 'spotify', color: 'green', popular: true, plans: [
    { name: 'Standard', amount: 1080, cycle: M },
    { name: 'Duo', amount: 1480, cycle: M },
    { name: 'Family', amount: 1880, cycle: M },
    { name: 'Student', amount: 580, cycle: M },
  ] },
  { id: 'youtube-music', name: 'YouTube Music Premium', category: '音楽', slug: 'youtubemusic', color: 'orange', plans: [{ name: '個人', amount: 1080, cycle: M }] },
  { id: 'amazon-music', name: 'Amazon Music Unlimited', category: '音楽', domain: 'music.amazon.co.jp', color: 'blue', plans: [
    { name: 'プライム会員（月額）', amount: 1080, cycle: M },
    { name: 'プライム会員（年額）', amount: 10800, cycle: Y },
    { name: '一般（月額）', amount: 1180, cycle: M },
  ] },
  { id: 'line-music', name: 'LINE MUSIC', category: '音楽', domain: 'music.line.me', color: 'green', plans: [{ name: '一般', amount: 1080, cycle: M }] },
  { id: 'awa', name: 'AWA', category: '音楽', domain: 'awa.fm', color: 'purple', plans: [{ name: 'Standard', amount: null, cycle: M }] },

  // 学習・本
  { id: 'kindle-unlimited', name: 'Kindle Unlimited', category: '学習', domain: 'amazon.co.jp', color: 'yellow', plans: [{ name: '月額', amount: 980, cycle: M }] },
  { id: 'audible', name: 'Audible', category: '学習', slug: 'audible', color: 'orange', plans: [{ name: '月額', amount: 1500, cycle: M }] },
  { id: 'duolingo', name: 'Duolingo', category: '学習', slug: 'duolingo', color: 'green', popular: true, plans: [
    { name: 'Super（月額）', amount: null, cycle: M },
    { name: 'Super（年額）', amount: null, cycle: Y },
  ] },
  { id: 'd-magazine', name: 'dマガジン', category: '学習', domain: 'magazine.dmkt-sp.jp', color: 'pink', plans: [{ name: '月額', amount: null, cycle: M }] },
  { id: 'rakuten-magazine', name: '楽天マガジン', category: '学習', domain: 'magazine.rakuten.co.jp', color: 'orange', plans: [{ name: '月額', amount: null, cycle: M }] },

  // 生活
  { id: 'uber-one', name: 'Uber One', category: '生活', slug: 'uber', color: 'yellow', popular: true, plans: [
    { name: '月額', amount: 698, cycle: M },
    { name: '年額', amount: 5598, cycle: Y },
    { name: '学生（月額）', amount: 298, cycle: M },
    { name: '学生（年額）', amount: 2298, cycle: Y },
  ] },
  { id: 'icloud', name: 'iCloud+', category: '生活', slug: 'icloud', color: 'blue', popular: true, plans: [
    { name: '50GB', amount: 180, cycle: M },
    { name: '200GB', amount: 540, cycle: M },
    { name: '2TB', amount: 1800, cycle: M },
  ] },
  { id: 'apple-one', name: 'Apple One', category: '生活', slug: 'apple', color: 'purple', plans: [
    { name: '個人', amount: 1350, cycle: M },
    { name: 'ファミリー', amount: 2500, cycle: M },
  ] },
  { id: 'google-one', name: 'Google One', category: '生活', slug: 'googledrive', color: 'blue', plans: [
    { name: '100GB', amount: null, cycle: M },
    { name: '2TB', amount: null, cycle: M },
  ] },

  // ゲーム
  { id: 'nintendo-switch-online', name: 'Nintendo Switch Online', category: 'ゲーム', domain: 'nintendo.com', color: 'pink', popular: true, plans: [
    { name: '個人（1か月）', amount: 400, cycle: M },
    { name: '個人（12か月）', amount: 3000, cycle: Y },
    { name: 'ファミリー（12か月）', amount: 5800, cycle: Y },
    { name: '+追加パック 個人（12か月）', amount: 5900, cycle: Y },
    { name: '+追加パック ファミリー（12か月）', amount: 9900, cycle: Y },
  ] },
  { id: 'playstation-plus', name: 'PlayStation Plus', category: 'ゲーム', slug: 'playstation', color: 'blue', plans: [
    { name: 'エッセンシャル（1か月）', amount: 850, cycle: M },
    { name: 'エッセンシャル（12か月）', amount: 6800, cycle: Y },
    { name: 'エクストラ（12か月）', amount: 11700, cycle: Y },
    { name: 'プレミアム（1か月）', amount: 1550, cycle: M },
    { name: 'プレミアム（12か月）', amount: 13900, cycle: Y },
  ] },
  { id: 'xbox-game-pass', name: 'Xbox Game Pass', category: 'ゲーム', domain: 'xbox.com', color: 'green', plans: [{ name: 'Ultimate', amount: null, cycle: M }] },

  // 仕事・ツール
  { id: 'chatgpt', name: 'ChatGPT', category: '仕事・ツール', domain: 'chatgpt.com', color: 'green', popular: true, plans: [
    { name: 'Go', amount: 1400, cycle: M },
    { name: 'Plus', amount: 3000, cycle: M },
    { name: 'Pro', amount: 16800, cycle: M },
  ] },
  { id: 'claude', name: 'Claude', category: '仕事・ツール', domain: 'claude.ai', color: 'orange', plans: [
    usd('Pro（月額）', 20, M),
    usd('Pro（年額）', 200, Y),
    usd('Max 5x', 100, M),
    usd('Max 20x', 200, M),
  ] },
  { id: 'microsoft-365', name: 'Microsoft 365', category: '仕事・ツール', domain: 'microsoft.com', color: 'blue', plans: [
    { name: 'Personal（年額）', amount: 21300, cycle: Y },
    { name: 'Personal（月額）', amount: 2130, cycle: M },
  ] },
  { id: 'adobe-cc', name: 'Adobe Creative Cloud', category: '仕事・ツール', domain: 'adobe.com', color: 'pink', plans: [{ name: 'プラン', amount: null, cycle: M }] },
  { id: 'canva', name: 'Canva', category: '仕事・ツール', domain: 'canva.com', color: 'purple', plans: [
    { name: 'Pro（月額）', amount: 1500, cycle: M },
    { name: 'Pro（年額）', amount: 14999, cycle: Y },
  ] },
  { id: 'notion', name: 'Notion', category: '仕事・ツール', slug: 'notion', color: 'yellow', plans: [
    usd('Plus（月額）', 12, M),
    usd('Plus（年額）', 120, Y),
  ] },
  { id: 'github-copilot', name: 'GitHub Copilot', category: '仕事・ツール', slug: 'githubcopilot', color: 'purple', plans: [
    usd('Pro（月額）', 10, M),
    usd('Pro（年額）', 100, Y),
  ] },
  { id: 'dropbox', name: 'Dropbox', category: '仕事・ツール', slug: 'dropbox', color: 'blue', plans: [{ name: 'Plus', amount: null, cycle: M }] },

  // その他
  { id: 'discord-nitro', name: 'Discord Nitro', category: 'その他', slug: 'discord', color: 'purple', plans: [{ name: 'Nitro', amount: null, cycle: M }] },
  { id: 'pixiv', name: 'pixivプレミアム', category: 'その他', slug: 'pixiv', color: 'blue', plans: [{ name: '月額', amount: null, cycle: M }] },
  { id: 'x-premium', name: 'X Premium', category: 'その他', slug: 'x', color: 'yellow', plans: [{ name: 'Premium', amount: null, cycle: M }] },
];

export function findCatalog(id: string | undefined): CatalogService | undefined {
  return id ? CATALOG.find((s) => s.id === id) : undefined;
}

export function searchCatalog(query: string, category: string): CatalogService[] {
  const q = query.trim().toLowerCase();
  return CATALOG.filter((s) => {
    if (q) return s.name.toLowerCase().includes(q);
    if (category === 'popular') return s.popular;
    return !category || s.category === category;
  });
}

/** 一番安いプラン（月あたり）の表示用 */
export function lowestPlan(service: CatalogService): CatalogPlan | undefined {
  const perMonth = (p: CatalogPlan) => (p.amount ?? Infinity) / (p.cycle.unit === 'year' ? 12 : 1);
  const priced = service.plans.filter((p) => p.amount !== null);
  return priced.sort((a, b) => perMonth(a) - perMonth(b))[0];
}
