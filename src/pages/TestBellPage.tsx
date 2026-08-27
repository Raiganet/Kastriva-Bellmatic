import { useMemo, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../database/db';
import { Card, CardHeader, CardBody } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { useSettingsStore } from '../stores/useSettingsStore';
import { useAppStore } from '../stores/useAppStore';
import { Play, Square, Volume2, AlertCircle, CheckCircle, Music } from 'lucide-react';
import { playAudio } from '../services/audioService';
import { playTestTone } from '../services/audioTestService';
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
  const [testingTone, setTestingTone] = useState(false);

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
    setTestResult('🔊 Memutar audio...');
    
    console.log('[TestBell] Starting test play for:', audio.displayName);
    console.log('[TestBell] Volume:', settings.volume);
    
    try {
      if (playing) {
        playing.pause();
        playing.currentTime = 0;
      }
      
      const el = await playAudio(audio, settings.volume / 100);
      setPlaying(el);
      setTestResult('✅ Audio sedang diputar: ' + audio.displayName);
      notify('🔔 Test bel dimainkan: ' + audio.displayName, 'success');
      
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

  const testTone = async () => {
    if (!audioUnlocked) {
      notify('Audio belum diaktifkan', 'warning');
      return;
    }
    
    setTestingTone(true);
    setTestResult(' Memutar test tone 440Hz...');
    
    try {
      const success = await playTestTone(440, 2, settings.volume / 100);
      if (success) {
        setTestResult('✅ Test tone berhasil diputar! Speaker berfungsi.');
        notify('✅ Speaker berfungsi! Test tone dimainkan.', 'success');
      } else {
        setTestResult('❌ Test tone gagal');
        notify('Gagal memutar test tone', 'error');
      }
    } catch (err: any) {
      console.error('[TestBell] Test tone error:', err);
      setTestResult('❌ Error: ' + (err?.message || 'Unknown'));
    }
    
    setTestingTone(false);
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
        <p className="text-sm text-slate-500">Uji audio dan speaker</p>
      </div>

      <Card>
        <CardHeader title="Test Speaker" />
        <CardBody className="space-y-4">
          <div className="p-4 bg-sky-50 dark:bg-sky-900/20 rounded-lg">
            <p className="text-sm text-sky-800 dark:text-sky-300 mb-3">
              <b>Test Tone</b> - Memutar suara beep 440Hz selama 2 detik untuk memastikan speaker berfungsi.
            </p>
            <Button 
              onClick={testTone} 
              disabled={!audioUnlocked || testingTone}
              variant="secondary"
              className="w-full"
            >
              <Music className="w-4 h-4" />
              {testingTone ? 'Memutar...' : '🎵 TEST SPEAKER (Tone)'}
            </Button>
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardHeader title="Test Audio Upload" />
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
            <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-lg text-sm space-y-1">
              <div><b>Nama:</b> {selectedAudio.displayName}</div>
              <div><b>File:</b> {selectedAudio.name}</div>
              <div><b>Durasi:</b> {Math.round(selectedAudio.duration)} detik</div>
              <div><b>Ukuran:</b> {(selectedAudio.size / 1024).toFixed(1)} KB</div>
              <div><b>Type:</b> {selectedAudio.mimeType}</div>
            </div>
          )}

          <div>
            <label className="text-sm font-medium flex items-center gap-2 mb-2">
              <Volume2 className="w-4 h-4" /> Volume: {settings.volume}%
            </label>
            <input
              type="range"
              min={0}
              max={100}
              value={settings.volume}
              onChange={(e) => update({ volume: Number(e.target.value) })}
              className="w-full"
            />
            <div className="flex gap-2 mt-1 text-xs text-slate-500">
              <span>0%</span>
              <span className="flex-1 text-right">50%</span>
              <span>100%</span>
            </div>
          </div>

          <div className="flex gap-2">
            <Button onClick={testPlay} disabled={!selectedId || !audioUnlocked || testing} className="flex-1">
              <Play className="w-4 h-4" /> {testing ? 'Memutar...' : '▶ TEST BEL'}
            </Button>
            <Button variant="secondary" onClick={stop} disabled={!playing}>
              <Square className="w-4 h-4" />
            </Button>
          </div>

          {testResult && (
            <div className={`p-3 rounded-lg text-sm ${
              testResult.startsWith('✅') 
                ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-300' 
                : testResult.startsWith('❌')
                ? 'bg-rose-50 text-rose-700 dark:bg-rose-900/20 dark:text-rose-300'
                : 'bg-sky-50 text-sky-700 dark:bg-sky-900/20 dark:text-sky-300'
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
        <CardHeader title="Troubleshooting" />
        <CardBody className="text-xs text-slate-600 dark:text-slate-400 space-y-2">
          <p> <b>Jika test tone berbunyi tapi audio upload tidak:</b></p>
          <ul className="list-disc list-inside ml-2 space-y-1">
            <li>File audio mungkin corrupt atau format tidak didukung</li>
            <li>Coba upload ulang dengan file MP3 yang berbeda</li>
            <li>Periksa volume sistem komputer</li>
          </ul>
          
          <p className="mt-3">📋 <b>Jika test tone TIDAK berbunyi:</b></p>
          <ul className="list-disc list-inside ml-2 space-y-1">
            <li>Periksa volume sistem komputer (Windows)</li>
            <li>Periksa speaker/headphone terpasang dengan benar</li>
            <li>Browser tab mungkin di-mute (klik icon speaker di tab)</li>
            <li>Coba browser lain (Chrome, Edge, Firefox)</li>
          </ul>
          
          <p className="mt-3">💡 <b>Debug:</b> Buka Console browser (F12) untuk melihat log detail</p>
        </CardBody>
      </Card>
    </div>
  );
}
