import { useMemo, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../database/db';
import { Card, CardHeader, CardBody } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { useSettingsStore } from '../stores/useSettingsStore';
import { useAppStore } from '../stores/useAppStore';
import { Play, Square, Volume2 } from 'lucide-react';
import { getObjectUrl } from '../services/audioService';
import { notify } from '../services/notificationService';

export function TestBellPage() {
  const audios = useLiveQuery(() => db.audio.toArray(), []) || [];
  const { settings, update } = useSettingsStore();
  const { audioUnlocked } = useAppStore();
  const [playing, setPlaying] = useState<HTMLAudioElement | null>(null);
  const [selectedId, setSelectedId] = useState<string>('');

  const audioMap = useMemo(() => new Map(audios.map((a) => [a.id, a])), [audios]);

  const testPlay = async () => {
    if (!selectedId) return notify('Pilih audio', 'warning');
    if (!audioUnlocked) return notify('Audio belum diaktifkan', 'warning');
    const audio = audioMap.get(selectedId);
    if (!audio) return;
    try {
      if (playing) {
        playing.pause();
        playing.currentTime = 0;
      }
      const el = new Audio(getObjectUrl(audio));
      el.volume = settings.volume / 100;
      await el.play();
      setPlaying(el);
      el.addEventListener('ended', () => setPlaying(null));
      notify('🔔 Test bel dimainkan', 'success');
    } catch (e: any) {
      notify('Gagal: ' + (e?.message || ''), 'error');
    }
  };

  const stop = () => {
    if (playing) {
      playing.pause();
      playing.currentTime = 0;
      setPlaying(null);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Test Bell</h1>
        <p className="text-sm text-slate-500">Uji audio sebelum digunakan pada jadwal</p>
      </div>

      <Card>
        <CardHeader title="Pengaturan Volume" />
        <CardBody>
          <label className="text-sm font-medium flex items-center gap-2">
            <Volume2 className="w-4 h-4" /> Volume: {settings.volume}%
          </label>
          <input
            type="range"
            min={0}
            max={100}
            value={settings.volume}
            onChange={(e) => update({ volume: Number(e.target.value) })}
            className="w-full mt-2"
          />
        </CardBody>
      </Card>

      <Card>
        <CardHeader title="Test Audio" />
        <CardBody className="space-y-4">
          <div>
            <label className="text-sm font-medium">Pilih Audio</label>
            <select
              value={selectedId}
              onChange={(e) => setSelectedId(e.target.value)}
              className="mt-1 w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900"
            >
              <option value="">-- Pilih Audio --</option>
              {audios.map((a) => <option key={a.id} value={a.id}>{a.displayName}</option>)}
            </select>
          </div>
          <div className="flex gap-2">
            <Button onClick={testPlay} disabled={!selectedId || !audioUnlocked}>
              <Play className="w-4 h-4" /> ▶ TEST BEL
            </Button>
            <Button variant="secondary" onClick={stop} disabled={!playing}>
              <Square className="w-4 h-4" /> Stop
            </Button>
          </div>
          {!audioUnlocked && (
            <div className="text-sm text-amber-600">
              ⚠️ Audio belum diaktifkan. Kembali ke Dashboard dan klik "Aktifkan Sistem Bel".
            </div>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
