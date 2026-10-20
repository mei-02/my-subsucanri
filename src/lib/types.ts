export type Currency = 'JPY' | 'USD';

export type CycleUnit = 'week' | 'month' | 'year';

export interface Cycle {
  unit: CycleUnit;
  every: number;
}

/** 料金の履歴。from（YYYY-MM-DD）以降の支払いにこの金額を使う */
export interface PricePeriod {
  from: string;
  amount: number;
}

export type ServiceIcon =
  | { kind: 'preset'; slug: string }
  | { kind: 'image'; dataUrl: string }
  | { kind: 'letter' };

export type TileColor = 'pink' | 'blue' | 'green' | 'yellow' | 'purple' | 'orange';

export interface Subscription {
  id: string;
  name: string;
  icon: ServiceIcon;
  color: TileColor;
  categoryId: string;
  paymentMethodId: string;
  loginId: string;
  password: string;
  currency: Currency;
  cycle: Cycle;
  /** 契約開始日 YYYY-MM-DD */
  startDate: string;
  /** 無料トライアル終了日。設定時はこの日が最初の支払日になる */
  trialEndDate?: string;
  prices: PricePeriod[];
  cancelledAt?: string;
  memo: string;
}

export interface NamedItem {
  id: string;
  name: string;
}

export interface Settings {
  usdRate: number;
  lunchPrice: number;
}

export interface AppData {
  version: 1;
  subscriptions: Subscription[];
  categories: NamedItem[];
  paymentMethods: NamedItem[];
  settings: Settings;
}

export const AUTO_LOCK_MINUTES = 10;

export function createInitialData(): AppData {
  const categories = ['動画', '音楽', 'ゲーム', '仕事・ツール', '学習', '生活', 'その他'];
  return {
    version: 1,
    subscriptions: [],
    categories: categories.map((name, i) => ({ id: `cat-${i + 1}`, name })),
    paymentMethods: [],
    settings: { usdRate: 150, lunchPrice: 1000 },
  };
}

export function newId(): string {
  return crypto.randomUUID();
}
