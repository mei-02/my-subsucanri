import {
  siApple,
  siAppletv,
  siApplemusic,
  siAudible,
  siCrunchyroll,
  siDazn,
  siDiscord,
  siDmm,
  siDropbox,
  siDuolingo,
  siFigma,
  siGithubcopilot,
  siGoogledrive,
  siIcloud,
  siLine,
  siNetflix,
  siNiconico,
  siNotion,
  siParamountplus,
  siPixiv,
  siPlaystation,
  siSpotify,
  siTwitch,
  siUber,
  siUbereats,
  siYoutube,
  siYoutubemusic,
  type SimpleIcon,
} from 'simple-icons';

// アプリに内蔵するブランドアイコン（Simple Icons, CC0）
const ICONS: SimpleIcon[] = [
  siApple,
  siAppletv,
  siApplemusic,
  siAudible,
  siCrunchyroll,
  siDazn,
  siDiscord,
  siDmm,
  siDropbox,
  siDuolingo,
  siFigma,
  siGithubcopilot,
  siGoogledrive,
  siIcloud,
  siLine,
  siNetflix,
  siNiconico,
  siNotion,
  siParamountplus,
  siPixiv,
  siPlaystation,
  siSpotify,
  siTwitch,
  siUber,
  siUbereats,
  siYoutube,
  siYoutubemusic,
];

export interface PresetIcon {
  slug: string;
  title: string;
  path: string;
  color: string;
}

function readableColor(hex: string): string {
  const n = parseInt(hex, 16);
  const luminance = (0.299 * ((n >> 16) & 255) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255)) / 255;
  // 白に近いブランドカラーは背景に溶けるので黒で描く
  return luminance > 0.85 ? '#111111' : `#${hex}`;
}

export const PRESET_ICONS: Record<string, PresetIcon> = Object.fromEntries(
  ICONS.map((i) => [i.slug, { slug: i.slug, title: i.title, path: i.path, color: readableColor(i.hex) }]),
);

export interface ServiceSuggestion {
  name: string;
  category: string;
  /** 内蔵アイコン */
  slug?: string;
  /** 内蔵アイコンがない場合に、アイコンを取得するドメイン */
  domain?: string;
}

export const SERVICE_SUGGESTIONS: ServiceSuggestion[] = [
  { name: 'Netflix', category: '動画', slug: 'netflix' },
  { name: 'Amazonプライム', category: '動画', domain: 'amazon.co.jp' },
  { name: 'Prime Video', category: '動画', domain: 'primevideo.com' },
  { name: 'Disney+', category: '動画', domain: 'disneyplus.com' },
  { name: 'Hulu', category: '動画', domain: 'hulu.jp' },
  { name: 'U-NEXT', category: '動画', domain: 'video.unext.jp' },
  { name: 'ABEMAプレミアム', category: '動画', domain: 'abema.tv' },
  { name: 'DAZN', category: '動画', slug: 'dazn' },
  { name: 'dアニメストア', category: '動画', domain: 'animestore.docomo.ne.jp' },
  { name: 'Lemino', category: '動画', domain: 'lemino.docomo.ne.jp' },
  { name: 'FOD', category: '動画', domain: 'fod.fujitv.co.jp' },
  { name: 'TELASA', category: '動画', domain: 'telasa.jp' },
  { name: 'DMM TV', category: '動画', slug: 'dmm' },
  { name: 'YouTube Premium', category: '動画', slug: 'youtube' },
  { name: 'Apple TV+', category: '動画', slug: 'appletv' },
  { name: 'Crunchyroll', category: '動画', slug: 'crunchyroll' },
  { name: 'Paramount+', category: '動画', slug: 'paramountplus' },
  { name: 'ニコニコプレミアム', category: '動画', slug: 'niconico' },
  { name: 'Twitch', category: '動画', slug: 'twitch' },
  { name: 'Apple Music', category: '音楽', slug: 'applemusic' },
  { name: 'Spotify', category: '音楽', slug: 'spotify' },
  { name: 'YouTube Music', category: '音楽', slug: 'youtubemusic' },
  { name: 'Audible', category: '学習', slug: 'audible' },
  { name: 'Duolingo', category: '学習', slug: 'duolingo' },
  { name: 'Uber One', category: '生活', slug: 'uber' },
  { name: 'Uber Eats', category: '生活', slug: 'ubereats' },
  { name: 'iCloud+', category: '生活', slug: 'icloud' },
  { name: 'Apple One', category: '生活', slug: 'apple' },
  { name: 'LINE', category: '生活', slug: 'line' },
  { name: 'PlayStation Plus', category: 'ゲーム', slug: 'playstation' },
  { name: 'Nintendo Switch Online', category: 'ゲーム', domain: 'nintendo.com' },
  { name: 'ChatGPT', category: '仕事・ツール', domain: 'chatgpt.com' },
  { name: 'GitHub Copilot', category: '仕事・ツール', slug: 'githubcopilot' },
  { name: 'Notion', category: '仕事・ツール', slug: 'notion' },
  { name: 'Dropbox', category: '仕事・ツール', slug: 'dropbox' },
  { name: 'Google One', category: '仕事・ツール', slug: 'googledrive' },
  { name: 'Figma', category: '仕事・ツール', slug: 'figma' },
  { name: 'Evernote', category: '仕事・ツール', slug: 'evernote' },
  { name: 'Discord Nitro', category: 'その他', slug: 'discord' },
  { name: 'pixivプレミアム', category: 'その他', slug: 'pixiv' },
];

export function searchServices(query: string): ServiceSuggestion[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  return SERVICE_SUGGESTIONS.filter((s) => s.name.toLowerCase().includes(q)).slice(0, 6);
}
