import { useMemo, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../database/db';
import { Card, CardHeader, CardBody } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { useSettingsStore } from '../stores/useSettingsStore';
import { useAppStore } from '../stores/useAppStore';
import { Play, Square, Volume2, AlertCircle, Repeat } from 'lucide-react';
import { playAudioRepeated } from '../services/audioService';
import { notify } from '../services/notificationService';

export function TestBellPage() {
  const audios = useLiveQuery(() => db.audio.toArray(), []) || [];
  const { settings } = useSettingsStore();
  const { audioUnlocked } = useAppStore();
  const [playing, setPlaying] = useState<HTMLAudioElement | null>(null);
  const [selectedId, setSelectedId] = useState<string>('');
  const [testResult, setTestResult] = useState<string>('');

  const repeat = settings.repeatCount ?? 1;
  const audioMap = useMemo(() => new Map(audios.map((a) => [a.id, a])), [audios]);

  const testPlay = async () => {
    if (!selectedId) return notify('Pilih audio terlebih dahulu', 'warning');
    if (!audioUnlocked) return notify('Audio belum diaktifkan', 'warning');
    const audio = audioMap.get(selectedId);
    if (!audio) return;

    setTestResult(`🔊 Memutar audio ${repeat}x...`);
    try {
      if (playing) { playing.pause(); playing.currentTime = 0; }
      const el = await playAudioRepeated(audio, settings.volume / 100, repeat);
      setPlaying(el);
      setTestResult(`✅ Audio diputar ${repeat}x beruntun`);
      notify(`🔔 Test bel (${repeat}x)`, 'success');
      el.addEventListener('ended', () => {
        setPlaying(null);
        setTestResult('✅ Selesai');
      });
    } catch (e: any) {
      setTestResult('❌ Gagal: ' + (e?.message || ''));
      notify('Gagal memutar audio', 'error');
    }
  };

  const stop = () => {
    if (playing) {
      playing.pause();
      playing.currentTime = 0;
      setPlaying(null);
      setTestResult('⏹ Dihentikan');
    }
  };

  return (
    <div className="space-y-6 animate-fade-up">
      <div>
        <div className="text-[11px] font-bold uppercase tracking-widest text-primary-600 dark:text-primary-400">
          Operasional
        </div>
        <h1 className="text-2xl lg:text-3xl font-bold tracking-tight">Test Bell</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Uji audio sesuai konfigurasi pemutaran</p>
      </div>

      <Card>
        <CardHeader title="Test Audio" subtitle={`Konfigurasi aktif: volume ${settings.volume}% • repeat ${repeat}x`} />
        <CardBody className="space-y-4">
          <div>
            <label className="text-sm font-semibold">Pilih Audio</label>
            <select
              value={selectedId}
              onChange={(e) => setSelectedId(e.target.value)}
              className="mt-1 w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
            >
              <option value="">-- Pilih Audio --</option>
              {audios.map((a) => <option key={a.id} value={a.id}>{a.displayName}</option>)}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <Badge variant="info"><Repeat className="w-3 h-3" /> Repeat {repeat}x</Badge>
            <Badge variant="neutral"><Volume2 className="w-3 h-3" /> {settings.volume}%</Badge>
            <span className="text-[11px] text-slate-400">Ubah di menu Pengaturan</span>
          </div>

          <div className="flex gap-2">
            <Button onClick={testPlay} disabled={!selectedId || !audioUnlocked} className="flex-1">
              <Play className="w-4 h-4" /> ▶ TEST BEL ({repeat}x)
            </Button>
            <Button variant="secondary" onClick={stop} disabled={!playing}>
              <Square className="w-4 h-4" />
            </Button>
          </div>

          {testResult && (
            <div className={`p-3 rounded-xl text-sm font-medium ${
              testResult.startsWith('✅') ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-300'
              : testResult.startsWith('❌') ? 'bg-rose-50 text-rose-700 dark:bg-rose-900/20 dark:text-rose-300'
              : 'bg-sky-50 text-sky-700 dark:bg-sky-900/20 dark:text-sky-300'
            }`}>
              {testResult}
            </div>
          )}

          {!audioUnlocked && (
            <div className="p-3 bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300 rounded-xl text-sm flex items-start gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              Audio belum diaktifkan. Klik "Aktifkan Sistem Bel" di halaman utama.
            </div>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
