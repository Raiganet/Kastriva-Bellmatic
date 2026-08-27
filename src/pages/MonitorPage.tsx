import { useMemo, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../database/db';
import { useClock } from '../hooks/useClock';
import { useAppStore } from '../stores/useAppStore';
import { useSettingsStore } from '../stores/useSettingsStore';
import { Button } from '../components/ui/Button';
import { Play, Pause, RefreshCw, Maximize, Minimize, Volume2, AlertTriangle, Bug, Trash2 } from 'lucide-react';
import { dayOfWeekToKey, formatCountdown, formatDateID, pad, timeToMinutes, toISODate } from '../utils/time';
import { getObjectUrl } from '../services/audioService';
import { notify } from '../services/notificationService';
import type { Schedule, SpecialSchedule } from '../types';

// Import scheduler dari App
let schedulerInstance: any = null;

export function setSchedulerInstance(scheduler: any) {
  schedulerInstance = scheduler;
}

export function MonitorPage() {
  const now = useClock(250);
  const { audioUnlocked, schedulerActive, setSchedulerActive } = useAppStore();
  const { settings } = useSettingsStore();
  const [isFullscreen, setIsFullscreen] = useState(false);

  const schedules = useLiveQuery(() => db.schedules.toArray(), []) || [];
  const specials = useLiveQuery(() => db.specialSchedules.toArray(), []) || [];
  const holidays = useLiveQuery(() => db.holidays.toArray(), []) || [];
  const audios = useLiveQuery(() => db.audio.toArray(), []) || [];

  const dayKey = dayOfWeekToKey(now);
  const dateStr = toISODate(now);
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const audioMap = useMemo(() => new Map(audios.map((a) => [a.id, a])), [audios]);

  const isHoliday = useMemo(() => holidays.find((h) => h.enabled && h.date === dateStr), [holidays, dateStr]);

  const todaySchedule = useMemo(() => {
    const normal = schedules
      .filter((s) => s.enabled && s.days.includes(dayKey))
      .map((s) => ({ ...s, _time: s.time }));
    const special = specials
      .filter((s) => s.enabled && s.date === dateStr)
      .map((s) => ({ ...s, days: [dayKey] as any, _time: s.time, priority: s.overrideNormal ? 10 : 1 }));
    return [...normal, ...special].sort((a, b) => timeToMinutes(a._time) - timeToMinutes(b._time));
  }, [schedules, specials, dayKey, dateStr]);

  const nextBell = useMemo(() => {
    return todaySchedule.find((s) => timeToMinutes(s._time) > currentMinutes) || todaySchedule[0];
  }, [todaySchedule, currentMinutes]);

  const countdown = useMemo(() => {
    if (!nextBell) return 0;
    const [h, m] = nextBell._time.split(':').map(Number);
    const target = new Date(now);
    target.setHours(h, m, 0, 0);
    if (target < now) target.setDate(target.getDate() + 1);
    return target.getTime() - now.getTime();
  }, [nextBell, now]);

  const testBell = async () => {
    if (!nextBell) return notify('Tidak ada jadwal untuk dites', 'warning');
    const audio = audioMap.get(nextBell.audioId);
    if (!audio) return notify('Audio tidak ditemukan', 'error');
    if (!audioUnlocked) return notify('Audio belum diaktifkan', 'warning');
    try {
      const el = new Audio(getObjectUrl(audio));
      el.volume = settings.volume / 100;
      await el.play();
      notify('🔔 Test bel dimainkan: ' + nextBell.name, 'success');
    } catch (e: any) {
      notify('Gagal: ' + (e?.message || ''), 'error');
    }
  };

  const toggleFullscreen = async () => {
    if (!document.fullscreenElement) {
      await document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      await document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  const toggleScheduler = async () => {
    const s = await db.settings.get('settings');
    if (!s) return;
    await db.settings.put({ ...s, schedulerEnabled: !s.schedulerEnabled });
    setSchedulerActive(!s.schedulerEnabled);
  };

  const forcePlayNext = async () => {
    if (schedulerInstance) {
      await schedulerInstance.forcePlayNext();
    } else {
      notify('Scheduler belum diinisialisasi', 'error');
    }
  };

  const resetExecuted = async () => {
    if (confirm('Reset semua executed logs? Ini akan memungkinkan jadwal dieksekusi ulang.')) {
      if (schedulerInstance) {
        await schedulerInstance.resetExecuted();
      }
    }
  };

  return (
    <div className="min-h-[calc(100vh-8rem)] flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-4xl space-y-8 text-center">
        <div>
          <div className="font-mono font-bold text-7xl md:text-9xl text-primary-700 dark:text-primary-400 tracking-tight">
            {pad(now.getHours())}:{pad(now.getMinutes())}<span className="text-5xl md:text-7xl text-primary-500">:{pad(now.getSeconds())}</span>
          </div>
          <div className="mt-2 text-lg md:text-xl text-slate-600 dark:text-slate-400">
            {formatDateID(now)}
          </div>
        </div>

        <div className={`inline-flex items-center gap-2 px-5 py-2 rounded-full text-sm font-medium ${
          audioUnlocked && schedulerActive
            ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300'
            : 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300'
        }`}>
          <span className={`w-2.5 h-2.5 rounded-full ${audioUnlocked && schedulerActive ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
          {audioUnlocked && schedulerActive ? 'SISTEM BEL AKTIF' : 'SISTEM BEL NONAKTIF'}
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-2xl p-8 shadow-lg border border-slate-200 dark:border-slate-700">
          {isHoliday ? (
            <>
              <div className="text-5xl mb-3"></div>
              <div className="text-sm text-slate-500">Hari ini</div>
              <div className="text-2xl font-bold">LIBUR</div>
              <div className="text-slate-500">{isHoliday.name}</div>
            </>
          ) : nextBell ? (
            <>
              <div className="text-sm text-slate-500 uppercase tracking-wider">Bel Berikutnya</div>
              <div className="font-mono font-bold text-5xl md:text-6xl text-primary-700 dark:text-primary-400 mt-2">
                {nextBell._time}
              </div>
              <div className="text-xl font-semibold mt-2">{nextBell.name}</div>
              <div className="text-sm text-slate-500 mt-1">{audioMap.get(nextBell.audioId)?.displayName || '-'}</div>
              <div className="mt-4 font-mono text-3xl font-semibold text-slate-700 dark:text-slate-200">
                {formatCountdown(countdown)}
              </div>
            </>
          ) : (
            <>
              <div className="text-sm text-slate-500">Tidak ada jadwal hari ini</div>
            </>
          )}
        </div>

        <div className="flex flex-wrap justify-center gap-2">
          <Button onClick={testBell} disabled={!audioUnlocked || !nextBell}>
            <Volume2 className="w-4 h-4" /> Tes Bel
          </Button>
          <Button variant="success" onClick={forcePlayNext} disabled={!audioUnlocked}>
            <Play className="w-4 h-4" /> Force Play Next
          </Button>
          <Button variant="secondary" onClick={resetExecuted}>
            <Trash2 className="w-4 h-4" /> Reset Executed
          </Button>
          <Button variant={schedulerActive ? 'danger' : 'success'} onClick={toggleScheduler}>
            {schedulerActive ? <><Pause className="w-4 h-4" /> Nonaktifkan</> : <><Play className="w-4 h-4" /> Aktifkan</>}
          </Button>
          <Button variant="secondary" onClick={() => location.reload()}>
            <RefreshCw className="w-4 h-4" /> Refresh
          </Button>
          <Button variant="secondary" onClick={toggleFullscreen}>
            {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />} Fullscreen
          </Button>
        </div>

        {!audioUnlocked && (
          <div className="flex items-center justify-center gap-2 text-amber-600 text-sm">
            <AlertTriangle className="w-4 h-4" /> Audio belum diaktifkan. Klik "Aktifkan Sistem Bel" di layar utama.
          </div>
        )}

        <div className="bg-sky-50 dark:bg-sky-900/20 rounded-lg p-4 text-left text-sm text-sky-800 dark:text-sky-300">
          <h3 className="font-semibold mb-2">Debug Info:</h3>
          <ul className="space-y-1 text-xs">
            <li>• Hari ini: {dayKey} ({dateStr})</li>
            <li>• Waktu sekarang: {pad(now.getHours())}:{pad(now.getMinutes())}</li>
            <li>• Total jadwal: {schedules.length}</li>
            <li>• Jadwal hari ini: {todaySchedule.length}</li>
            <li>• Audio tersedia: {audios.length}</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
