import { create } from 'zustand';
import { db, DEFAULT_SETTINGS, ensureSettings } from '../database/db';
import type { Settings } from '../types';

interface SettingsState {
  settings: Settings;
  loaded: boolean;
  load: () => Promise<void>;
  update: (patch: Partial<Settings>) => Promise<void>;
}

export const useSettingsStore = create<SettingsState>((set, get) => ({
  settings: DEFAULT_SETTINGS,
  loaded: false,
  load: async () => {
    const s = await ensureSettings();
    set({ settings: s, loaded: true });
  },
  update: async (patch) => {
    const next = { ...get().settings, ...patch };
    await db.settings.put(next);
    set({ settings: next });
  },
}));
