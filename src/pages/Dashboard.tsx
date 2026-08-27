import { useEffect, useMemo, useState } from 'react';
import { db } from '../database/db';
import { useLiveQuery } from 'dexie-react-hooks';
import { useClock } from '../hooks/useClock';
import { useAppStore } from '../stores/useAppStore';
import { Card, CardBody, CardHeader } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Bell, Clock, Calendar as CalIcon, Music, Play, Pause, Square, AlertCircle } from 'lucide-react';
import { dayOfWeekToKey, formatCountdown, formatDateID, formatHM, pad, timeToMinutes, toISODate } from '../utils/time';
import type { Schedule, SpecialSchedule, AudioFile } from '../types';
import { getObjectUrl } from '../services/audioService';
import { notify } from '../services/notificationService';

export function Dashboard() {
  const now = useClock(250);
  const { audioUnlocked, schedulerActive, setSchedulerActive } = useAppStore();
  const [player, setPlayer] = useState<HTMLAudioElement | null>(null);
  const [playing, setPlaying] = useState(false);

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

  // Jadwal hari ini (normal + khusus)
  const todaySchedule = useMemo(() => {
    const normal = schedules
      .filter((s) => s.enabled && s.days.includes(dayKey))
      .map((s) => ({ ...s, _kind: 'normal' as const, _time: s.time }));
    const special = specials
      .filter((s) => s.enabled && s.date === dateStr)
      .map((s) => ({
        id: s.id,
        name: s.name,
        days: [dayKey] as any,
        time: s.time,
        audioId: s.audioId,
        enabled: s.enabled,
        priority: s.overrideNormal ? 10 : 1,
        notes: s.notes,
        createdAt: s.createdAt,
        _kind: 'special' as const,
        _time: s.time,
      }));
    return [...normal, ...special].sort((a, b) => timeToMinutes(a._time) - timeToMinutes(b._time));
  }, [schedules, specials, dayKey, dateStr]);

  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  // Tentukan jadwal berikutnya
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
    if (!audio) {
      notify('Audio tidak ditemukan', 'error');
      return;
    }
    if (!audioUnlocked) {
      notify('Audio belum diaktifkan', 'warning');
      return;
    }
    try {
      if (player) {
        player.pause();
        player.currentTime = 0;
      }
      const url = getObjectUrl(audio);
      const el = new Audio(url);
      el.volume = 0.8;
      await el.play();
      setPlayer(el);
      setPlaying(true);
      el.addEventListener('ended', () => setPlaying(false));
    } catch (e: any) {
      notify('Gagal memutar audio: ' + (e?.message || ''), 'error');
    }
  };

  const toggleScheduler = async () => {
    const settings = await db.settings.get('settings');
    if (!settings) return;
    await db.settings.put({ ...settings, schedulerEnabled: !settings.schedulerEnabled });
    setSchedulerActive(!settings.schedulerEnabled);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Dashboard</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">Ringkasan sistem bel sekolah</p>
      </div>

      {/* Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardBody className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-lg bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center">
              <Bell className="w-5 h-5 text-emerald-700 dark:text-emerald-300" />
            </div>
            <div>
              <div className="text-xs text-slate-500">Status Sistem</div>
              <div className="font-semibold">
                {audioUnlocked && schedulerActive ? (
                  <span className="text-emerald-600">🟢 Aktif</span>
                ) : (
                  <span className="text-rose-600">🔴 Nonaktif</span>
                )}
              </div>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardBody className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-lg bg-primary-100 dark:bg-primary-900/40 flex items-center justify-center">
              <Clock className="w-5 h-5 text-primary-700 dark:text-primary-300" />
            </div>
            <div>
              <div className="text-xs text-slate-500">Waktu</div>
              <div className="font-mono font-semibold">
                {pad(now.getHours())}:{pad(now.getMinutes())}:{pad(now.getSeconds())}
              </div>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardBody className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-lg bg-sky-100 dark:bg-sky-900/40 flex items-center justify-center">
              <CalIcon className="w-5 h-5 text-sky-700 dark:text-sky-300" />
            </div>
            <div>
              <div className="text-xs text-slate-500">Hari / Tanggal</div>
              <div className="font-semibold text-sm">{formatDateID(now)}</div>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardBody className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-lg bg-amber-100 dark:bg-amber-900/40 flex items-center justify-center">
              <Music className="w-5 h-5 text-amber-700 dark:text-amber-300" />
            </div>
            <div>
              <div className="text-xs text-slate-500">Audio Tersedia</div>
              <div className="font-semibold">{audios.length} file</div>
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Next Bell + Controls */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2">
          <CardHeader title="Bel Berikutnya" subtitle={isHoliday ? '🏖 Hari ini libur: ' + isHoliday.name : undefined} />
          <CardBody>
            {isHoliday ? (
              <div className="text-center py-8">
                <div className="text-5xl mb-3">🏖</div>
                <div className="text-lg font-semibold">Hari Libur</div>
                <div className="text-sm text-slate-500">{isHoliday.name}</div>
              </div>
            ) : nextBell ? (
              <div className="flex flex-col sm:flex-row items-center gap-6">
                <div className="text-center">
                  <div className="text-5xl font-mono font-bold text-primary-700 dark:text-primary-400">
                    {nextBell._time}
                  </div>
                  <div className="mt-1 text-sm text-slate-500">{nextBell.name}</div>
                </div>
                <div className="flex-1 text-center sm:text-left">
                  <div className="text-xs text-slate-500 mb-1">Countdown</div>
                  <div className="text-3xl font-mono font-semibold">
                    {formatCountdown(countdown)}
                  </div>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <Badge variant="info">{audioMap.get(nextBell.audioId)?.displayName || 'Audio ?'}</Badge>
                    <Badge variant={nextBell._kind === 'special' ? 'warning' : 'neutral'}>
                      {nextBell._kind === 'special' ? 'Khusus' : 'Normal'}
                    </Badge>
                  </div>
                </div>
                <Button onClick={() => testPlay(nextBell)} disabled={!audioUnlocked}>
                  <Play className="w-4 h-4" /> Test
                </Button>
              </div>
            ) : (
              <div className="text-center py-8 text-slate-500">
                Tidak ada jadwal untuk hari ini
              </div>
            )}
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Kontrol Sistem" />
          <CardBody className="space-y-2">
            <Button
              variant={schedulerActive ? 'danger' : 'success'}
              className="w-full"
              onClick={toggleScheduler}
            >
              {schedulerActive ? (
                <><Pause className="w-4 h-4" /> Nonaktifkan Sistem</>
              ) : (
                <><Play className="w-4 h-4" /> Aktifkan Sistem</>
              )}
            </Button>
            <div className="text-xs text-slate-500 text-center">
              {schedulerActive ? 'Scheduler berjalan' : 'Scheduler dijeda'}
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Today Schedule */}
      <Card>
        <CardHeader title="Jadwal Hari Ini" subtitle={`${todaySchedule.length} jadwal`} />
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 dark:bg-slate-900/50 text-xs uppercase text-slate-500">
              <tr>
                <th className="px-4 py-3 text-left">Jam</th>
                <th className="px-4 py-3 text-left">Kegiatan</th>
                <th className="px-4 py-3 text-left">Audio</th>
                <th className="px-4 py-3 text-left">Status</th>
                <th className="px-4 py-3 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
              {todaySchedule.length === 0 && (
                <tr>
                  <td colSpan={5} className="text-center py-8 text-slate-500">
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
                  <tr key={s.id + s._time} className={isNext ? 'bg-primary-50 dark:bg-primary-900/20' : ''}>
                    <td className="px-4 py-3 font-mono font-semibold">
                      {s._time}
                      {isNext && <span className="ml-2 inline-block w-2 h-2 rounded-full bg-primary-500 animate-pulse" />}
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-medium">{s.name}</div>
                      {s.notes && <div className="text-xs text-slate-500">{s.notes}</div>}
                    </td>
                    <td className="px-4 py-3">
                      {audio ? (
                        <Badge variant="info">{audio.displayName}</Badge>
                      ) : (
                        <Badge variant="danger">Audio hilang</Badge>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {isPast ? (
                        <Badge variant="neutral">Selesai</Badge>
                      ) : isNext ? (
                        <Badge variant="success">Berikutnya</Badge>
                      ) : (
                        <Badge variant="info">Menunggu</Badge>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
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

      {/* Recent Logs */}
      <Card>
        <CardHeader title="Log Hari Ini" />
        <div className="divide-y divide-slate-200 dark:divide-slate-700">
          {todayLogs.length === 0 && (
            <div className="p-5 text-sm text-slate-500 text-center">Belum ada bel yang dijalankan hari ini</div>
          )}
          {todayLogs.slice(0, 5).map((l) => (
            <div key={l.id} className="px-5 py-3 flex items-center gap-3">
              <div className={`w-2 h-2 rounded-full ${
                l.status === 'success' ? 'bg-emerald-500' : l.status === 'skipped' ? 'bg-amber-500' : 'bg-rose-500'
              }`} />
              <div className="font-mono text-xs text-slate-500">{l.time}</div>
              <div className="flex-1 text-sm">{l.scheduleName}</div>
              <Badge variant={l.status === 'success' ? 'success' : l.status === 'skipped' ? 'warning' : 'danger'}>
                {l.status === 'success' ? '✅ Berhasil' : l.status === 'skipped' ? '⚠️ Dilewati' : '❌ Gagal'}
              </Badge>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
