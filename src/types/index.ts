// ============================================================
// TYPE DEFINITIONS
// ============================================================

export type DayOfWeek = 'senin' | 'selasa' | 'rabu' | 'kamis' | 'jumat' | 'sabtu' | 'minggu';

export const DAYS: { key: DayOfWeek; label: string }[] = [
  { key: 'senin', label: 'Senin' },
  { key: 'selasa', label: 'Selasa' },
  { key: 'rabu', label: 'Rabu' },
  { key: 'kamis', label: 'Kamis' },
  { key: 'jumat', label: 'Jumat' },
  { key: 'sabtu', label: 'Sabtu' },
  { key: 'minggu', label: 'Minggu' },
];

export const DAY_LABEL: Record<DayOfWeek, string> = {
  senin: 'Senin', selasa: 'Selasa', rabu: 'Rabu',
  kamis: 'Kamis', jumat: 'Jumat', sabtu: 'Sabtu', minggu: 'Minggu',
};

export interface AudioFile {
  id: string;
  name: string;
  displayName: string;
  blob: Blob;
  mimeType: string;
  size: number;
  duration: number;
  createdAt: number;
}

export interface Schedule {
  id: string;
  name: string;
  days: DayOfWeek[];
  time: string;
  audioId: string;
  enabled: boolean;
  priority: number;
  notes?: string;
  createdAt: number;
}

export interface SpecialSchedule {
  id: string;
  name: string;
  date: string;
  time: string;
  audioId: string;
  enabled: boolean;
  overrideNormal: boolean;
  priority: number;
  notes?: string;
  createdAt: number;
}

export interface Holiday {
  id: string;
  date: string;
  name: string;
  enabled: boolean;
}

export interface BellLog {
  id: string;
  scheduleId?: string;
  scheduleName: string;
  date: string;
  time: string;
  audioId?: string;
  audioName?: string;
  status: 'success' | 'skipped' | 'error';
  error?: string;
  timestamp: number;
}

export interface Settings {
  id: 'settings';
  volume: number;         // 0-100
  fadeIn: number;         // ms
  fadeOut: number;        // ms
  repeatCount: number;    // berapa kali bel diputar beruntun (1-5)
  autoStart: boolean;
  schedulerEnabled: boolean;
  theme: 'light' | 'dark' | 'system';
  activeProfile: string;
}

export interface ScheduleTemplate {
  id: string;
  name: string;
  items: {
    time: string;
    name: string;
    audioId: string;
    priority: number;
  }[];
  createdAt: number;
}

export interface ExecutedBell {
  key: string;
  executedAt: number;
}

export type PageKey =
  | 'dashboard'
  | 'schedules'
  | 'audio'
  | 'calendar'
  | 'templates'
  | 'history'
  | 'settings'
  | 'monitor'
  | 'test';
