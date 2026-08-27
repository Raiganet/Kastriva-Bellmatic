import { useMemo, useState } from 'react';
import { db } from '../database/db';
import { useLiveQuery } from 'dexie-react-hooks';
import { useClock } from '../hooks/useClock';
import { useAppStore } from '../stores/useAppStore';
import { Card, CardBody, CardHeader } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import {
  Bell, Clock, CalendarDays, Music, Play, Pause, Activity,
  ArrowRight, Monitor, Timer,
} from 'lucide-react';
import { dayOfWeekToKey, formatCountdown, formatDateID, pad, timeToMinutes, toISODate } from '../utils/time';
import { playAudio } from '../services/audioService';
import { notify } from '../services/notificationService';

export function Dashboard() {
  const now = useClock(250);
  const { audioUnlocked, schedulerActive, setSchedulerActive, setPage } = useAppStore();
  const [player, setPlayer] = useState<HTMLAudioElement | null>(null);

  const schedules = useLiveQuery(() => db.schedules.toArray(), []) || [];
  const specials = useLiveQuery(() => db.specialSchedules.toArray(), []) || [];
  const holidays = useLiveQuery(() => db.holidays.toArray(), []) || [];
  const audios = useLiveQuery(() => db.audio.toArray(), []) || [];
  const todayLogs = useLiveQuery(
    () => db.logs.where('date').equals(toISODate(now)).reverse().sortBy('timestamp'),
    [now],
  ) || [];

  const dayKey = dayOfWeekToKey(now);
  const dateStr = toISODate(now);

  const isHoliday = useMemo(() => holidays.find((h) => h.enabled && h.date === dateStr), [holidays, dateStr]);

  const todaySchedule = useMemo(() => {
    const normal = schedules
      .filter((s) => s.enabled && s.days.includes(dayKey))
      .map((s) => ({ ...s, _kind: 'normal' as const, _time: s.time }));
    const special = specials
      .filter((s) => s.enabled && s.date === dateStr)
      .map((s) => ({
        id: s.id, name: s.name, days: [dayKey] as any, time: s.time, audioId: s.audioId,
        enabled: s.enabled, priority: s.overrideNormal ? 10 : 1, notes: s.notes,
        createdAt: s.createdAt, _kind: 'special' as const, _time: s.time,
      }));
    return [...normal, ...special].sort((a, b) => timeToMinutes(a._time) - timeToMinutes(b._time));
  }, [schedules, specials, dayKey, dateStr]);

  const currentMinutes = now.getHours() * 60 + now.getMinutes();

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

  const audioMap = useMemo(() => new Map(audios.map((a) => [a.id, a])), [audios]);

  const testPlay = async (sch: typeof todaySchedule[0]) => {
    const audio = audioMap.get(sch.audioId);
    if (!audio) return notify('Audio tidak ditemukan', 'error');
    if (!audioUnlocked) return notify('Audio belum diaktifkan', 'warning');
    try {
      if (player) { player.pause(); player.currentTime = 0; }
      const el = await playAudio(audio, 0.8);
      setPlayer(el);
      notify('🔔 Test: ' + sch.name, 'success');
      el.addEventListener('ended', () => setPlayer(null));
    } catch (e: any) {
      notify('Gagal: ' + (e?.message || ''), 'error');
    }
  };

  const toggleScheduler = async () => {
    const settings = await db.settings.get('settings');
    if (!settings) return;
    await db.settings.put({ ...settings, schedulerEnabled: !settings.schedulerEnabled });
    setSchedulerActive(!settings.schedulerEnabled);
  };

  const stats = [
    {
      icon: Bell,
      tint: 'bg-emerald-500',
      soft: 'bg-emerald-50 dark:bg-emerald-900/20',
      label: 'Status Sistem',
      value: audioUnlocked && schedulerActive ? 'Aktif' : 'Nonaktif',
      sub: schedulerActive ? 'Scheduler berjalan' : 'Scheduler dijeda',
      ok: audioUnlocked && schedulerActive,
    },
    {
      icon: Clock,
      tint: 'bg-primary-500',
      soft: 'bg-primary-50 dark:bg-primary-900/20',
      label: 'Waktu Perangkat',
      value: `${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`,
      sub: 'Sinkron lokal',
      mono: true,
    },
    {
      icon: CalendarDays,
      tint: 'bg-sky-500',
      soft: 'bg-sky-50 dark:bg-sky-900/20',
      label: 'Jadwal Hari Ini',
      value: String(todaySchedule.length),
      sub: isHoliday ? '🏖 ' + isHoliday.name : 'Jadwal aktif',
    },
    {
      icon: Music,
      tint: 'bg-amber-500',
      soft: 'bg-amber-50 dark:bg-amber-900/20',
      label: 'Audio Library',
      value: String(audios.length),
      sub: 'File tersimpan lokal',
    },
  ];

  return (
    <div className="space-y-6 animate-fade-up">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="text-[11px] font-bold uppercase tracking-widest text-primary-600 dark:text-primary-400">
            Command Center
          </div>
          <h1 className="text-2xl lg:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
            Dashboard
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{formatDateID(now)}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={() => setPage('monitor')}>
            <Monitor className="w-4 h-4" /> <span className="hidden sm:inline">Mode Monitor</span>
          </Button>
          <Button onClick={() => setPage('schedules')}>
            Kelola Jadwal <ArrowRight className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {stats.map((s) => {
          const Icon = s.icon;
          return (
            <Card key={s.label} className="overflow-hidden">
              <CardBody className="flex items-start justify-between">
                <div>
                  <div className="text-xs font-medium text-slate-500 dark:text-slate-400">{s.label}</div>
                  <div className={`mt-1.5 text-xl font-bold tracking-tight text-slate-900 dark:text-white ${s.mono ? 'font-mono tabular' : ''}`}>
                    {s.ok !== undefined ? (
                      <span className={s.ok ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}>
                        {s.value}
                      </span>
                    ) : (
                      s.value
                    )}
                  </div>
                  <div className="mt-1 text-[11px] text-slate-400 dark:text-slate-500">{s.sub}</div>
                </div>
                <div className={`w-11 h-11 rounded-xl ${s.soft} flex items-center justify-center`}>
                  <Icon className={`w-5 h-5 ${s.tint.replace('bg-', 'text-')}`} />
                </div>
              </CardBody>
            </Card>
          );
        })}
      </div>

      {/* Hero next bell + control */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 rounded-2xl bg-brand text-white shadow-lift overflow-hidden relative">
          <div className="absolute -top-16 -right-16 w-56 h-56 rounded-full bg-white/10" />
          <div className="absolute -bottom-24 -left-16 w-64 h-64 rounded-full bg-white/5" />
          <div className="relative p-6 lg:p-8">
            <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest text-primary-200">
              <Timer className="w-3.5 h-3.5" /> Bel Berikutnya
            </div>

            {isHoliday ? (
              <div className="mt-6 text-center py-6">
                <div className="text-5xl mb-3">🏖</div>
                <div className="text-2xl font-bold">Hari Libur</div>
                <div className="text-primary-200 text-sm mt-1">{isHoliday.name}</div>
              </div>
            ) : nextBell ? (
              <div className="mt-4 flex flex-col sm:flex-row sm:items-center gap-6">
                <div>
                  <div className="font-mono tabular text-6xl lg:text-7xl font-bold tracking-tight">
                    {nextBell._time}
                  </div>
                  <div className="mt-2 text-lg font-semibold text-primary-100">{nextBell.name}</div>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <span className="px-2.5 py-1 rounded-lg bg-white/10 border border-white/15 text-[11px] font-semibold">
                      🎵 {audioMap.get(nextBell.audioId)?.displayName || 'Audio ?'}
                    </span>
                    <span className="px-2.5 py-1 rounded-lg bg-white/10 border border-white/15 text-[11px] font-semibold">
                      {nextBell._kind === 'special' ? '⭐ Khusus' : ' Normal'}
                    </span>
                  </div>
                </div>
                <div className="sm:ml-auto sm:text-right">
                  <div className="text-[11px] font-bold uppercase tracking-widest text-primary-200">Countdown</div>
                  <div className="font-mono tabular text-4xl lg:text-5xl font-bold mt-1">
                    {formatCountdown(countdown)}
                  </div>
                  <Button
                    onClick={() => testPlay(nextBell)}
                    disabled={!audioUnlocked}
                    className="mt-4 bg-white/10 border border-white/20 backdrop-blur hover:bg-white/20 shadow-none"
                  >
                    <Play className="w-4 h-4" /> Test Bel
                  </Button>
                </div>
              </div>
            ) : (
              <div className="mt-6 text-center py-6 text-primary-200">
                Tidak ada jadwal untuk hari ini
              </div>
            )}
          </div>
        </div>

        {/* Control */}
        <Card>
          <CardHeader title="Kontrol Sistem" subtitle="Manajemen scheduler" />
          <CardBody className="space-y-3">
            <Button
              variant={schedulerActive ? 'danger' : 'success'}
              className="w-full"
              size="lg"
              onClick={toggleScheduler}
            >
              {schedulerActive ? (
                <><Pause className="w-4 h-4" /> Nonaktifkan Sistem</>
              ) : (
                <><Play className="w-4 h-4" /> Aktifkan Sistem</>
              )}
            </Button>

            <div className="rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-3 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500 dark:text-slate-400">Scheduler</span>
                <Badge variant={schedulerActive ? 'success' : 'neutral'}>
                  {schedulerActive ? 'Running' : 'Paused'}
                </Badge>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500 dark:text-slate-400">Audio Engine</span>
                <Badge variant={audioUnlocked ? 'success' : 'warning'}>
                  {audioUnlocked ? 'Ready' : 'Locked'}
                </Badge>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500 dark:text-slate-400">Eksekusi Hari Ini</span>
                <Badge variant="info">{todayLogs.length} bel</Badge>
              </div>
            </div>

            <div className="flex items-center gap-2 text-[11px] text-slate-400">
              <Activity className="w-3.5 h-3.5" />
              Anti-duplikasi aktif • Interval 250ms
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Today schedule */}
      <Card>
        <CardHeader
          title="Jadwal Hari Ini"
          subtitle={`${todaySchedule.length} jadwal terprogram`}
          action={<Button size="sm" variant="ghost" onClick={() => setPage('schedules')}>Lihat Semua</Button>}
        />
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 dark:bg-slate-800/60 text-[11px] uppercase tracking-wider text-slate-500">
              <tr>
                <th className="px-5 py-3 text-left font-semibold">Jam</th>
                <th className="px-5 py-3 text-left font-semibold">Kegiatan</th>
                <th className="px-5 py-3 text-left font-semibold">Audio</th>
                <th className="px-5 py-3 text-left font-semibold">Status</th>
                <th className="px-5 py-3 text-right font-semibold">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {todaySchedule.length === 0 && (
                <tr>
                  <td colSpan={5} className="text-center py-10 text-slate-400">
                    Tidak ada jadwal untuk hari ini
                  </td>
                </tr>
              )}
              {todaySchedule.map((s) => {
                const mins = timeToMinutes(s._time);
                const isPast = mins < currentMinutes;
                const isNext = nextBell?.id === s.id;
                const audio = audioMap.get(s.audioId);
                return (
                  <tr key={s.id + s._time} className={`transition-colors ${isNext ? 'bg-primary-50/60 dark:bg-primary-900/10' : 'hover:bg-slate-50 dark:hover:bg-slate-800/40'}`}>
                    <td className="px-5 py-3.5">
                      <span className="font-mono tabular font-bold text-slate-900 dark:text-white">{s._time}</span>
                      {isNext && <span className="ml-2 inline-block w-2 h-2 rounded-full bg-primary-500 animate-pulse-soft" />}
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="font-semibold text-slate-800 dark:text-slate-200">{s.name}</div>
                      {s.notes && <div className="text-xs text-slate-400 mt-0.5">{s.notes}</div>}
                    </td>
                    <td className="px-5 py-3.5">
                      {audio ? <Badge variant="info">{audio.displayName}</Badge> : <Badge variant="danger">Audio hilang</Badge>}
                    </td>
                    <td className="px-5 py-3.5">
                      {isPast ? <Badge variant="neutral">Selesai</Badge>
                        : isNext ? <Badge variant="success">Berikutnya</Badge>
                        : <Badge variant="default">Menunggu</Badge>}
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <Button size="sm" variant="ghost" onClick={() => testPlay(s)} disabled={!audio}>
                        <Play className="w-3.5 h-3.5" />
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Logs */}
      <Card>
        <CardHeader
          title="Aktivitas Hari Ini"
          subtitle="Log eksekusi bel real-time"
          action={<Button size="sm" variant="ghost" onClick={() => setPage('history')}>Riwayat Lengkap</Button>}
        />
        <div className="divide-y divide-slate-100 dark:divide-slate-800">
          {todayLogs.length === 0 && (
            <div className="p-8 text-sm text-slate-400 text-center">
              Belum ada bel yang dijalankan hari ini
            </div>
          )}
          {todayLogs.slice(0, 5).map((l) => (
            <div key={l.id} className="px-5 py-3.5 flex items-center gap-3">
              <div className={`w-2 h-2 rounded-full ${
                l.status === 'success' ? 'bg-emerald-500' : l.status === 'skipped' ? 'bg-amber-500' : 'bg-rose-500'
              }`} />
              <div className="font-mono tabular text-xs text-slate-400 w-16">{l.time.slice(0, 5)}</div>
              <div className="flex-1 text-sm font-medium text-slate-700 dark:text-slate-300">{l.scheduleName}</div>
              <Badge variant={l.status === 'success' ? 'success' : l.status === 'skipped' ? 'warning' : 'danger'}>
                {l.status === 'success' ? 'Berhasil' : l.status === 'skipped' ? 'Dilewati' : 'Gagal'}
              </Badge>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
