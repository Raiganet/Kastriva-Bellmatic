import { db } from '../database/db';
import type { Schedule, SpecialSchedule, Holiday, BellLog, AudioFile, Settings } from '../types';
import { dayOfWeekToKey, toISODate, pad, uid } from '../utils/time';
import { getObjectUrl } from './audioService';
import { notify } from './notificationService';

type PlayFn = (audio: AudioFile, volume: number) => Promise<HTMLAudioElement>;

export class SchedulerService {
  private timer: number | null = null;
  private running = false;
  private lastTickMinute = '';
  private playAudio: PlayFn;
  private getVolume: () => number;
  private onTick?: () => void;

  constructor(playAudio: PlayFn, getVolume: () => number) {
    this.playAudio = playAudio;
    this.getVolume = getVolume;
  }

  setOnTick(fn: () => void) {
    this.onTick = fn;
  }

  start() {
    if (this.running) return;
    this.running = true;
    this.tick();
    // Tick setiap 250ms untuk akurasi detik, tapi eksekusi hanya sekali per menit
    this.timer = window.setInterval(() => this.tick(), 250);
  }

  stop() {
    this.running = false;
    if (this.timer !== null) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  private async tick() {
    try {
      this.onTick?.();
      const now = new Date();
      const hm = `${pad(now.getHours())}:${pad(now.getMinutes())}`;
      if (hm === this.lastTickMinute) return;
      this.lastTickMinute = hm;
      await this.evaluate(now);
    } catch (err) {
      console.error('[Scheduler] tick error', err);
    }
  }

  private async evaluate(now: Date) {
    const settings = await db.settings.get('settings');
    if (!settings?.schedulerEnabled) return;

    const dateStr = toISODate(now);
    const timeStr = `${pad(now.getHours())}:${pad(now.getMinutes())}`;
    const dayKey = dayOfWeekToKey(now);

    // Cek hari libur
    const holidays = await db.holidays.where('enabled').equals(1).toArray();
    const activeHoliday = holidays.find((h) => h.date === dateStr);
    if (activeHoliday) {
      console.log('[Scheduler] Hari libur:', activeHoliday.name);
      return;
    }

    // Cek jadwal khusus (priority tinggi)
    const specials = await db.specialSchedules
      .where('enabled').equals(1)
      .and((s) => s.date === dateStr && s.time === timeStr)
      .toArray();

    let executed = false;

    for (const spec of specials.sort((a, b) => b.priority - a.priority)) {
      const key = `${dateStr}|${spec.time}|${spec.id}`;
      const exists = await db.executed.get(key);
      if (exists) continue;
      await this.runBell(spec, spec.name, dateStr, timeStr, key);
      executed = true;
      if (spec.overrideNormal) return;
    }

    // Jadwal normal
    const schedules = await db.schedules
      .where('enabled').equals(1)
      .toArray();

    const candidates = schedules
      .filter((s) => s.days.includes(dayKey) && s.time === timeStr)
      .sort((a, b) => b.priority - a.priority);

    for (const sch of candidates) {
      const key = `${dateStr}|${sch.time}|${sch.id}`;
      const exists = await db.executed.get(key);
      if (exists) continue;
      await this.runBell(sch, sch.name, dateStr, timeStr, key);
      executed = true;
    }
  }

  private async runBell(
    sch: Schedule | SpecialSchedule,
    name: string,
    dateStr: string,
    timeStr: string,
    key: string,
  ) {
    const audio = await db.audio.get(sch.audioId);
    const logBase: Omit<BellLog, 'id'> = {
      scheduleId: sch.id,
      scheduleName: name,
      date: dateStr,
      time: timeStr + ':' + pad(new Date().getSeconds()),
      audioId: audio?.id,
      audioName: audio?.displayName,
      status: 'success',
      timestamp: Date.now(),
    };

    if (!audio) {
      const log: BellLog = { ...logBase, id: uid(), status: 'error', error: 'File audio tidak ditemukan' };
      await db.logs.add(log);
      notify(`⚠️ BEL GAGAL: ${name} (audio tidak ditemukan)`, 'error');
      await db.executed.put({ key, executedAt: Date.now() });
      return;
    }

    try {
      const volume = this.getVolume();
      const el = await this.playAudio(audio, volume / 100);
      await db.executed.put({ key, executedAt: Date.now() });
      const log: BellLog = { ...logBase, id: uid(), status: 'success' };
      await db.logs.add(log);
      notify(`🔔 ${name} dimainkan`, 'success');
      el.addEventListener('ended', () => {
        console.log('[Scheduler] Bel selesai:', name);
      });
    } catch (err: any) {
      const log: BellLog = {
        ...logBase,
        id: uid(),
        status: 'error',
        error: err?.message || 'Error tidak diketahui',
      };
      await db.logs.add(log);
      await db.executed.put({ key, executedAt: Date.now() });
      notify(`❌ BEL GAGAL: ${name} - ${err?.message || 'error'}`, 'error');
    }
  }

  async refresh() {
    this.lastTickMinute = '';
    await this.evaluate(new Date());
  }
}
