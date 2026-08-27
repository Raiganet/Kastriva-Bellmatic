import { useState } from 'react';
import { useSettingsStore } from '../stores/useSettingsStore';
import { Card, CardHeader, CardBody } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Download, Upload, Volume2, Moon, Sun, Monitor, Repeat, Info, Copy, Check, LockKeyhole } from 'lucide-react';
import { exportBackup, importBackup, downloadText } from '../services/backupService';
import { notify } from '../services/notificationService';
import { getDeviceCode, deactivate } from '../services/licenseService';

export function SettingsPage() {
  const { settings, update } = useSettingsStore();
  const [importing, setImporting] = useState(false);
  const [copied, setCopied] = useState(false);

  const repeat = settings.repeatCount ?? 1;
  const deviceCode = getDeviceCode();

  const copyDev = async () => {
    try {
      await navigator.clipboard.writeText(deviceCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
      notify('Kode perangkat disalin', 'success');
    } catch {}
  };

  const relock = () => {
    if (confirm('Kunci ulang aplikasi? Lisensi di perangkat ini akan dihapus dan aplikasi kembali ke layar aktivasi.')) {
      deactivate();
      location.reload();
    }
  };

  const doExport = async (includeAudio: boolean) => {
    try {
      const json = await exportBackup(includeAudio);
      const name = `backup-bell-${new Date().toISOString().slice(0, 10)}${includeAudio ? '-full' : ''}.json`;
      downloadText(name, json);
      notify('Backup berhasil diexport', 'success');
    } catch (e: any) {
      notify('Gagal export: ' + (e?.message || ''), 'error');
    }
  };

  const doImport = async (file: File) => {
    setImporting(true);
    try {
      const text = await file.text();
      const res = await importBackup(text);
      if (res.ok) {
        notify(res.message, 'success');
        await useSettingsStore.getState().load();
      } else {
        notify(res.message, 'error');
      }
    } catch (e: any) {
      notify('Gagal import: ' + (e?.message || ''), 'error');
    }
    setImporting(false);
  };

  return (
    <div className="space-y-6 animate-fade-up">
      <div>
        <div className="text-[11px] font-bold uppercase tracking-widest text-primary-600 dark:text-primary-400">
          Sistem
        </div>
        <h1 className="text-2xl lg:text-3xl font-bold tracking-tight">Pengaturan</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Konfigurasi sistem bel sekolah</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Audio */}
        <Card>
          <CardHeader title="Audio" subtitle="Volume & efek transisi" />
          <CardBody className="space-y-4">
            <div>
              <label className="text-sm font-semibold flex items-center gap-2">
                <Volume2 className="w-4 h-4 text-primary-600" /> Volume Bel: {settings.volume}%
              </label>
              <input
                type="range"
                min={0}
                max={100}
                value={settings.volume}
                onChange={(e) => update({ volume: Number(e.target.value) })}
                className="w-full mt-2"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-slate-600 dark:text-slate-300">Fade In (ms)</label>
                <input type="number" value={settings.fadeIn} onChange={(e) => update({ fadeIn: Number(e.target.value) })}
                  className="mt-1 w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800" />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-600 dark:text-slate-300">Fade Out (ms)</label>
                <input type="number" value={settings.fadeOut} onChange={(e) => update({ fadeOut: Number(e.target.value) })}
                  className="mt-1 w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800" />
              </div>
            </div>
          </CardBody>
        </Card>

        {/* Repeat */}
        <Card>
          <CardHeader title="Pemutaran Bel" subtitle="Durasi & pengulangan" />
          <CardBody className="space-y-4">
            <div>
              <label className="text-sm font-semibold flex items-center gap-2">
                <Repeat className="w-4 h-4 text-primary-600" /> Putar Bel Berulang
              </label>
              <div className="flex gap-2 mt-3">
                {[1, 2, 3, 4, 5].map((n) => (
                  <button
                    key={n}
                    onClick={() => update({ repeatCount: n })}
                    className={`flex-1 py-2.5 rounded-xl text-sm font-bold border transition-all ${
                      repeat === n
                        ? 'bg-gradient-to-r from-primary-600 to-indigo-600 text-white border-transparent shadow-pop'
                        : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-primary-400'
                    }`}
                  >
                    {n}x
                  </button>
                ))}
              </div>
              <div className="mt-3 flex items-start gap-2 p-3 rounded-xl bg-primary-50 dark:bg-primary-900/20 border border-primary-100 dark:border-primary-800">
                <Info className="w-4 h-4 text-primary-600 dark:text-primary-400 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-primary-800 dark:text-primary-300 leading-relaxed">
                  Audio bel diputar beruntun sebanyak <b>{repeat}x</b> setiap jadwal tiba.
                  Pilih nilai lebih besar untuk durasi bel yang lebih panjang.
                </p>
              </div>
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Lisensi */}
      <Card>
        <CardHeader title="Lisensi" subtitle="Status aktivasi & kode perangkat" />
        <CardBody className="space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <div className="text-xs text-slate-500 dark:text-slate-400 mb-1">Kode Perangkat</div>
              <div className="font-mono tabular text-2xl font-bold tracking-[0.3em] text-slate-900 dark:text-white">
                {deviceCode}
              </div>
            </div>
            <Badge variant="success">✅ TERAKTIVASI</Badge>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" size="sm" onClick={copyDev}>
              {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              Salin Kode Perangkat
            </Button>
            <Button variant="danger" size="sm" onClick={relock}>
              <LockKeyhole className="w-3.5 h-3.5" /> Kunci Ulang Aplikasi
            </Button>
          </div>
          <p className="text-[11px] text-slate-400 leading-relaxed">
            Lisensi terikat pada kode perangkat ini. "Kunci Ulang" berguna untuk uji coba
            atau memindahkan lisensi ke perangkat lain.
          </p>
        </CardBody>
      </Card>

      {/* Tampilan */}
      <Card>
        <CardHeader title="Tampilan" subtitle="Mode tema aplikasi" />
        <CardBody>
          <div className="grid grid-cols-3 gap-2">
            {([
              { v: 'light', label: 'Light', icon: Sun },
              { v: 'dark', label: 'Dark', icon: Moon },
              { v: 'system', label: 'System', icon: Monitor },
            ] as const).map(({ v, label, icon: Icon }) => (
              <button
                key={v}
                onClick={() => update({ theme: v })}
                className={`flex items-center justify-center gap-2 px-3 py-3 rounded-xl border text-sm font-semibold transition-all ${
                  settings.theme === v
                    ? 'bg-gradient-to-r from-primary-600 to-indigo-600 text-white border-transparent shadow-pop'
                    : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
                }`}
              >
                <Icon className="w-4 h-4" /> {label}
              </button>
            ))}
          </div>
        </CardBody>
      </Card>

      {/* Backup */}
      <Card>
        <CardHeader title="Backup & Restore" subtitle="Amankan data konfigurasi & audio" />
        <CardBody className="space-y-3">
          <div className="text-xs text-slate-500 dark:text-slate-400 space-y-1">
            <p>• <b>Export Config</b>: jadwal, pengaturan, kalender (tanpa MP3)</p>
            <p>• <b>Export Full</b>: termasuk file MP3 (ukuran besar)</p>
            <p>• <b>Import</b>: restore dari file backup JSON</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" onClick={() => doExport(false)}>
              <Download className="w-4 h-4" /> Export Config
            </Button>
            <Button variant="secondary" onClick={() => doExport(true)}>
              <Download className="w-4 h-4" /> Export Full (+MP3)
            </Button>
            <label className={`inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-xl cursor-pointer transition ${
              importing ? 'bg-slate-200 text-slate-400' : 'bg-gradient-to-r from-primary-600 to-indigo-600 text-white hover:opacity-90 shadow-pop'
            }`}>
              <Upload className="w-4 h-4" /> {importing ? 'Mengimport...' : 'Import Backup'}
              <input type="file" accept=".json" className="hidden" disabled={importing}
                onChange={(e) => e.target.files && doImport(e.target.files[0])} />
            </label>
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardHeader title="Tentang" />
        <CardBody className="text-sm text-slate-600 dark:text-slate-400 space-y-1">
          <div><b>Kastriva Bellmatic</b> v1.0 — Enterprise Edition • Licensed</div>
          <div>React + TypeScript + Vite + Tailwind + IndexedDB</div>
          <div>Data tersimpan 100% lokal • Offline ready • PWA</div>
        </CardBody>
      </Card>
    </div>
  );
}
