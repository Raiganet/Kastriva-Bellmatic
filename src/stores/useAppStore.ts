import { create } from 'zustand';
import type { PageKey } from '../types';

interface AppState {
  page: PageKey;
  audioUnlocked: boolean;
  schedulerActive: boolean;
  sidebarOpen: boolean;
  setPage: (p: PageKey) => void;
  setAudioUnlocked: (v: boolean) => void;
  setSchedulerActive: (v: boolean) => void;
  toggleSidebar: () => void;
  setSidebarOpen: (v: boolean) => void;
}

export const useAppStore = create<AppState>((set) => ({
  page: 'dashboard',
  audioUnlocked: false,
  schedulerActive: false,
  sidebarOpen: false,
  setPage: (p) => set({ page: p, sidebarOpen: false }),
  setAudioUnlocked: (v) => set({ audioUnlocked: v }),
  setSchedulerActive: (v) => set({ schedulerActive: v }),
  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
  setSidebarOpen: (v) => set({ sidebarOpen: v }),
}));
