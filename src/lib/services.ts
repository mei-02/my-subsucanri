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
  siX,
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
  siX,
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
