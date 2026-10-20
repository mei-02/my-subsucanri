import { createContext, useContext } from 'react';
import type { AppData } from './lib/types';

export interface AppApi {
  data: AppData;
  today: string;
  update: (fn: (data: AppData) => AppData) => Promise<void>;
  lock: () => void;
  changePassword: (current: string, next: string) => Promise<void>;
  exportBackup: () => Promise<void>;
  importBackup: (file: File, password: string) => Promise<void>;
}

export const AppContext = createContext<AppApi | null>(null);

export function useApp(): AppApi {
  const api = useContext(AppContext);
  if (!api) throw new Error('AppContext がありません');
  return api;
}
