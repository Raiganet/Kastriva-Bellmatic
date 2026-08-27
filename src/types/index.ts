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
  name: string;           // nama file asli
  displayName: string;    // nama tampilan
  blob: Blob;             // file disimpan sebagai Blob
  mimeType: string;
  size: number;
  duration: number;       // detik
  createdAt: number;
}

export interface Schedule {
  id: string;
  name: string;           // nama kegiatan
  days: DayOfWeek[];      // hari aktif
  time: string;           // "HH:mm"
  audioId: string;        // referensi ke AudioFile.id
  enabled: boolean;
  priority: number;       // 0=normal, 1=khusus, 2=sangat khusus
  notes?: string;
  createdAt: number;
}

export interface SpecialSchedule {
  id: string;
  name: string;
  date: string;           // "YYYY-MM-DD"
  time: string;           // "HH:mm"
  audioId: string;
  enabled: boolean;
  overrideNormal: boolean; // jika true, menonaktifkan jadwal normal di tanggal tsb
  notes?: string;
  createdAt: number;
}

export interface Holiday {
  id: string;
  date: string;           // "YYYY-MM-DD"
  name: string;
  enabled: boolean;
}

export interface BellLog {
  id: string;
  scheduleId?: string;
  scheduleName: string;
  date: string;           // "YYYY-MM-DD"
  time: string;           // "HH:mm:ss"
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
  autoStart: boolean;
  schedulerEnabled: boolean;
  theme: 'light' | 'dark' | 'system';
  activeProfile: string;  // untuk multi-shift (future)
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
  // Anti-duplikasi: key = "YYYY-MM-DD|HH:mm|scheduleId"
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
