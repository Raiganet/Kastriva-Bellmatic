import { db } from '../database/db';
import type { Schedule, SpecialSchedule, BellLog, AudioFile } from '../types';
import { dayOfWeekToKey, toISODate, pad, uid } from '../utils/time';
import { playAudioRepeated } from './audioService';
import { notify } from './notificationService';

type PlayFn = (audio: AudioFile, volume: number) => Promise<HTMLAudioElement>;

function isEnabled(v: any): boolean {
  return v === true || v === 1;
}

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
    console.log('[Scheduler] Started');
    this.tick();
    this.timer = window.setInterval(() => this.tick(), 250);
  }

  stop() {
    this.running = false;
    console.log('[Scheduler] Stopped');
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
    if (!settings || !isEnabled(settings.schedulerEnabled)) {
      console.log('[Scheduler] Scheduler disabled');
      return;
    }

    const dateStr = toISODate(now);
    const timeStr = `${pad(now.getHours())}:${pad(now.getMinutes())}`;
    const dayKey = dayOfWeekToKey(now);

    const allHolidays = await db.holidays.toArray();
    const activeHoliday = allHolidays.find((h) => isEnabled(h.enabled) && h.date === dateStr);
    if (activeHoliday) {
      console.log('[Scheduler] Holiday today:', activeHoliday.name);
      return;
    }

    const allSpecials = await db.specialSchedules.toArray();
    const specials = allSpecials.filter(
      (s) => isEnabled(s.enabled) && s.date === dateStr && s.time === timeStr
    );

    for (const spec of specials) {
      const key = `${dateStr}|${spec.time}|${spec.id}`;
      const exists = await db.executed.get(key);
      if (exists) continue;
      await this.runBell(spec, spec.name, dateStr, timeStr, key);
      if (spec.overrideNormal) return;
    }

    const allSchedules = await db.schedules.toArray();
    const enabledSchedules = allSchedules.filter((s) => isEnabled(s.enabled));

    const candidates = enabledSchedules
      .filter((s) => s.days.includes(dayKey) && s.time === timeStr)
      .sort((a, b) => b.priority - a.priority);

    console.log('[Scheduler] Candidates for', timeStr, ':', candidates.length);

    for (const sch of candidates) {
      const key = `${dateStr}|${sch.time}|${sch.id}`;
      const exists = await db.executed.get(key);
      if (exists) continue;
      await this.runBell(sch, sch.name, dateStr, timeStr, key);
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
      const settings = await db.settings.get('settings');
      const repeat = Math.max(1, Math.floor(settings?.repeatCount || 1));
      const volume = this.getVolume();

      console.log('[Scheduler] Playing:', name, '| volume:', volume, '| repeat:', repeat + 'x');

      // BARU: putar beruntun sesuai repeatCount
      const el = await playAudioRepeated(audio, volume / 100, repeat);

      await db.executed.put({ key, executedAt: Date.now() });
      const log: BellLog = { ...logBase, id: uid(), status: 'success' };
      await db.logs.add(log);

      notify(`🔔 ${name} dimainkan (${repeat}x)`, 'success');

      el.addEventListener('ended', () => {
        console.log('[Scheduler] Bell finished:', name);
      });
    } catch (err: any) {
      console.error('[Scheduler] Error playing bell:', err);
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

  async forcePlayNext() {
    const now = new Date();
    const dateStr = toISODate(now);
    const dayKey = dayOfWeekToKey(now);

    const allSchedules = await db.schedules.toArray();
    const schedules = allSchedules.filter((s) => isEnabled(s.enabled));
    const currentMinutes = now.getHours() * 60 + now.getMinutes();

    const nextSchedule = schedules
      .filter((s) => s.days.includes(dayKey))
      .sort((a, b) => {
        const [ah, am] = a.time.split(':').map(Number);
        const [bh, bm] = b.time.split(':').map(Number);
        return (ah * 60 + am) - (bh * 60 + bm);
      })
      .find((s) => {
        const [h, m] = s.time.split(':').map(Number);
        return (h * 60 + m) > currentMinutes;
      }) || schedules.find((s) => s.days.includes(dayKey));

    if (!nextSchedule) {
      notify('Tidak ada jadwal untuk hari ini', 'warning');
      return;
    }

    const key = `${dateStr}|${nextSchedule.time}|${nextSchedule.id}`;
    await this.runBell(nextSchedule, nextSchedule.name, dateStr, nextSchedule.time, key);
  }

  async resetExecuted() {
    await db.executed.clear();
    notify('Executed logs direset', 'success');
  }

  async refresh() {
    this.lastTickMinute = '';
    await this.evaluate(new Date());
  }
}
