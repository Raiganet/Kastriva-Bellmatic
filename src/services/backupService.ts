import { db } from '../database/db';
import type { AudioFile, Schedule, SpecialSchedule, Holiday, Settings, ScheduleTemplate } from '../types';

interface BackupData {
  version: 1;
  exportedAt: number;
  settings: Settings | null;
  schedules: Schedule[];
  specialSchedules: SpecialSchedule[];
  holidays: Holiday[];
  templates: ScheduleTemplate[];
  audioMeta: Omit<AudioFile, 'blob'>[];
}

export async function exportBackup(includeAudio = false): Promise<string> {
  const [settings, schedules, specialSchedules, holidays, templates, audioAll] = await Promise.all([
    db.settings.get('settings'),
    db.schedules.toArray(),
    db.specialSchedules.toArray(),
    db.holidays.toArray(),
    db.templates.toArray(),
    db.audio.toArray(),
  ]);

  const data: BackupData & { audio?: AudioFile[] } = {
    version: 1,
    exportedAt: Date.now(),
    settings: settings || null,
    schedules,
    specialSchedules,
    holidays,
    templates,
    audioMeta: audioAll.map(({ blob, ...rest }) => rest),
  };

  if (includeAudio) {
    data.audio = audioAll;
  }

  return JSON.stringify(data, null, 2);
}

export async function importBackup(json: string): Promise<{ ok: boolean; message: string }> {
  try {
    const data = JSON.parse(json);
    if (data.version !== 1) return { ok: false, message: 'Versi backup tidak dikenali' };

    if (data.settings) await db.settings.put(data.settings);
    if (Array.isArray(data.schedules)) await db.schedules.bulkPut(data.schedules);
    if (Array.isArray(data.specialSchedules)) await db.specialSchedules.bulkPut(data.specialSchedules);
    if (Array.isArray(data.holidays)) await db.holidays.bulkPut(data.holidays);
    if (Array.isArray(data.templates)) await db.templates.bulkPut(data.templates);
    if (Array.isArray(data.audio)) {
      // Backup lengkap dengan blob audio
      await db.audio.bulkPut(data.audio);
    }

    return { ok: true, message: 'Backup berhasil diimpor' };
  } catch (err: any) {
    return { ok: false, message: err?.message || 'File backup tidak valid' };
  }
}

export function downloadText(filename: string, content: string) {
  const blob = new Blob([content], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
