import Dexie, { type Table } from 'dexie';
import type {
  AudioFile, Schedule, SpecialSchedule, Holiday,
  BellLog, Settings, ScheduleTemplate, ExecutedBell,
} from '../types';

export class BellDB extends Dexie {
  audio!: Table<AudioFile, string>;
  schedules!: Table<Schedule, string>;
  specialSchedules!: Table<SpecialSchedule, string>;
  holidays!: Table<Holiday, string>;
  logs!: Table<BellLog, string>;
  settings!: Table<Settings, string>;
  templates!: Table<ScheduleTemplate, string>;
  executed!: Table<ExecutedBell, string>;

  constructor() {
    super('BellSekolahDB');
    this.version(1).stores({
      audio: 'id, name, displayName, createdAt',
      schedules: 'id, time, enabled, createdAt',
      specialSchedules: 'id, date, time, enabled',
      holidays: 'id, date, enabled',
      logs: 'id, timestamp, date, scheduleId, status',
      settings: 'id',
      templates: 'id, name, createdAt',
      executed: 'key, executedAt',
    });
  }
}

export const db = new BellDB();

// ============================================================
// DEFAULT SETTINGS
// ============================================================
export const DEFAULT_SETTINGS: Settings = {
  id: 'settings',
  volume: 80,
  fadeIn: 200,
  fadeOut: 300,
  autoStart: true,
  schedulerEnabled: true,
  theme: 'light',
  activeProfile: 'default',
};

export async function ensureSettings(): Promise<Settings> {
  const existing = await db.settings.get('settings');
  if (!existing) {
    await db.settings.put(DEFAULT_SETTINGS);
    return DEFAULT_SETTINGS;
  }
  return existing;
}
