import { useMemo, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../database/db';
import { Card, CardHeader, CardBody } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { useSettingsStore } from '../stores/useSettingsStore';
import { useAppStore } from '../stores/useAppStore';
import { Play, Square, Volume2, AlertCircle, CheckCircle } from 'lucide-react';
import { playAudio, testAudioPlayback } from '../services/audioService';
import { notify } from '../services/notificationService';
import type { AudioFile } from '../types';

export function TestBellPage() {
  const audios = useLiveQuery(() => db.audio.toArray(), []) || [];
  const { settings, update } = useSettingsStore();
  const { audioUnlocked } = useAppStore();
  const [playing, setPlaying] = useState<HTMLAudioElement | null>(null);
  const [selectedId, setSelectedId] = useState<string>('');
  const [testResult, setTestResult] = useState<string>('');
  const [testing, setTesting] = useState(false);

  const audioMap = useMemo(() => new Map(audios.map((a) => [a.id, a])), [audios]);
  const selectedAudio = audioMap.get(selectedId);

  const testPlay = async () => {
    if (!selectedId) {
      notify('Pilih audio terlebih dahulu', 'warning');
      return;
    }
    if (!audioUnlocked) {
      notify('Audio belum diaktifkan. Klik "Aktifkan Sistem Bel" di dashboard.', 'warning');
      return;
    }
    
    const audio = audioMap.get(selectedId);
    if (!audio) {
      notify('Audio tidak ditemukan', 'error');
      return;
    }

    setTesting(true);
    setTestResult('');
    
    console.log('[TestBell] Starting test play for:', audio.displayName);
    
    try {
      // Stop previous
      if (playing) {
        playing.pause();
        playing.currentTime = 0;
      }
      
      const el = await playAudio(audio, settings.volume / 100);
      setPlaying(el);
      setTestResult('✅ Audio sedang diputar: ' + audio.displayName);
      notify(' Test bel dimainkan: ' + audio.displayName, 'success');
      
      el.addEventListener('ended', () => {
        setPlaying(null);
        setTestResult('✅ Audio selesai diputar');
      });
      
    } catch (err: any) {
      console.error('[TestBell] Error:', err);
      setTestResult('❌ Gagal: ' + (err?.message || 'Unknown error'));
      notify('Gagal memutar audio: ' + (err?.message || ''), 'error');
    }
    
    setTesting(false);
  };

  const stop = () => {
    if (playing) {
      playing.pause();
      playing.currentTime = 0;
      setPlaying(null);
      setTestResult('⏹ Audio dihentikan');
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
              {audios.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.displayName} ({a.name}, {Math.round(a.duration)}s, {(a.size / 1024).toFixed(1)}KB)
                </option>
              ))}
            </select>
          </div>

          {selectedAudio && (
            <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-lg text-sm">
              <div><b>Nama:</b> {selectedAudio.displayName}</div>
              <div><b>File:</b> {selectedAudio.name}</div>
              <div><b>Durasi:</b> {Math.round(selectedAudio.duration)} detik</div>
              <div><b>Ukuran:</b> {(selectedAudio.size / 1024).toFixed(1)} KB</div>
              <div><b>Type:</b> {selectedAudio.mimeType}</div>
            </div>
          )}

          <div className="flex gap-2">
            <Button onClick={testPlay} disabled={!selectedId || !audioUnlocked || testing}>
              <Play className="w-4 h-4" /> {testing ? 'Memutar...' : '▶ TEST BEL'}
            </Button>
            <Button variant="secondary" onClick={stop} disabled={!playing}>
              <Square className="w-4 h-4" /> Stop
            </Button>
          </div>

          {testResult && (
            <div className={`p-3 rounded-lg text-sm ${
              testResult.startsWith('✅') 
                ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-300' 
                : 'bg-rose-50 text-rose-700 dark:bg-rose-900/20 dark:text-rose-300'
            }`}>
              {testResult}
            </div>
          )}

          {!audioUnlocked && (
            <div className="p-3 bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300 rounded-lg text-sm flex items-start gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <div>
                <b>Audio belum diaktifkan</b>
                <p className="text-xs mt-1">Kembali ke Dashboard dan klik "Aktifkan Sistem Bel" terlebih dahulu.</p>
              </div>
            </div>
          )}

          {audios.length === 0 && (
            <div className="p-3 bg-sky-50 dark:bg-sky-900/20 text-sky-700 dark:text-sky-300 rounded-lg text-sm">
              Belum ada audio. Upload file MP3 di menu Audio terlebih dahulu.
            </div>
          )}
        </CardBody>
      </Card>

      <Card>
        <CardHeader title="Debug Info" />
        <CardBody className="text-xs text-slate-600 dark:text-slate-400 space-y-1">
          <p>• Buka <b>Console browser</b> (F12) untuk melihat log detail</p>
          <p>• Cari log dengan prefix <code>[AudioService]</code> dan <code>[TestBell]</code></p>
          <p>• Jika ada error, screenshot console dan kirim untuk analisis</p>
        </CardBody>
      </Card>
    </div>
  );
}
