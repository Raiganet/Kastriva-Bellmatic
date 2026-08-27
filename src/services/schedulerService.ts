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
      console.log('[Scheduler] Tick:', hm);
      await this.evaluate(now);
    } catch (err) {
      console.error('[Scheduler] tick error', err);
    }
  }

  private async evaluate(now: Date) {
    const settings = await db.settings.get('settings');
    if (!settings?.schedulerEnabled) {
      console.log('[Scheduler] Scheduler disabled');
      return;
    }

    const dateStr = toISODate(now);
    const timeStr = `${pad(now.getHours())}:${pad(now.getMinutes())}`;
    const dayKey = dayOfWeekToKey(now);

    console.log('[Scheduler] Evaluating:', { dateStr, timeStr, dayKey });

    // Cek hari libur
    const holidays = await db.holidays.where('enabled').equals(1).toArray();
    const activeHoliday = holidays.find((h) => h.date === dateStr);
    if (activeHoliday) {
      console.log('[Scheduler] Holiday today:', activeHoliday.name);
      return;
    }

    // Cek jadwal khusus
    const specials = await db.specialSchedules
      .where('enabled').equals(1)
      .and((s) => s.date === dateStr && s.time === timeStr)
      .toArray();

    console.log('[Scheduler] Special schedules found:', specials.length);

    for (const spec of specials) {
      const key = `${dateStr}|${spec.time}|${spec.id}`;
      const exists = await db.executed.get(key);
      if (exists) {
        console.log('[Scheduler] Special already executed:', key);
        continue;
      }
      console.log('[Scheduler] Playing special:', spec.name);
      await this.runBell(spec, spec.name, dateStr, timeStr, key);
      if (spec.overrideNormal) return;
    }

    // Jadwal normal - ambil semua jadwal enabled
    const allSchedules = await db.schedules
      .where('enabled').equals(1)
      .toArray();

    console.log('[Scheduler] Total enabled schedules:', allSchedules.length);
    
    // Log semua jadwal untuk debug
    allSchedules.forEach(s => {
      console.log('[Scheduler] Schedule:', {
        id: s.id,
        name: s.name,
        days: s.days,
        time: s.time,
        enabled: s.enabled,
        matchesDay: s.days.includes(dayKey),
        matchesTime: s.time === timeStr
      });
    });

    // Filter jadwal yang match hari dan waktu
    const candidates = allSchedules
      .filter((s) => {
        const dayMatch = s.days.includes(dayKey);
        const timeMatch = s.time === timeStr;
        console.log('[Scheduler] Checking schedule:', s.name, '- Day match:', dayMatch, 'Time match:', timeMatch);
        return dayMatch && timeMatch;
      })
      .sort((a, b) => b.priority - a.priority);

    console.log('[Scheduler] Candidates for', timeStr, ':', candidates.length);

    for (const sch of candidates) {
      const key = `${dateStr}|${sch.time}|${sch.id}`;
      const exists = await db.executed.get(key);
      if (exists) {
        console.log('[Scheduler] Already executed:', key);
        continue;
      }
      console.log('[Scheduler] Playing schedule:', sch.name);
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
    console.log('[Scheduler] runBell:', name, 'audioId:', sch.audioId);
    
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
      console.error('[Scheduler] Audio not found:', sch.audioId);
      const log: BellLog = { ...logBase, id: uid(), status: 'error', error: 'File audio tidak ditemukan' };
      await db.logs.add(log);
      notify(`⚠️ BEL GAGAL: ${name} (audio tidak ditemukan)`, 'error');
      await db.executed.put({ key, executedAt: Date.now() });
      return;
    }

    try {
      const volume = this.getVolume();
      console.log('[Scheduler] Volume:', volume);
      
      const el = await this.playAudio(audio, volume / 100);
      await db.executed.put({ key, executedAt: Date.now() });
      
      const log: BellLog = { ...logBase, id: uid(), status: 'success' };
      await db.logs.add(log);
      
      notify(`🔔 ${name} dimainkan`, 'success');
      
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

  // Manual trigger untuk testing
  async forcePlayNext() {
    console.log('[Scheduler] Force play next bell');
    const now = new Date();
    const dateStr = toISODate(now);
    const dayKey = dayOfWeekToKey(now);
    
    const schedules = await db.schedules
      .where('enabled').equals(1)
      .toArray();
    
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
      });
    
    if (!nextSchedule) {
      console.log('[Scheduler] No next schedule found');
      notify('Tidak ada jadwal berikutnya', 'warning');
      return;
    }
    
    console.log('[Scheduler] Force playing:', nextSchedule.name);
    const timeStr = nextSchedule.time;
    const key = `${dateStr}|${timeStr}|${nextSchedule.id}`;
    
    await this.runBell(nextSchedule, nextSchedule.name, dateStr, timeStr, key);
  }

  // Reset executed logs untuk testing
  async resetExecuted() {
    console.log('[Scheduler] Resetting executed logs');
    await db.executed.clear();
    notify('Executed logs direset', 'success');
  }

  async refresh() {
    this.lastTickMinute = '';
    await this.evaluate(new Date());
  }
}
