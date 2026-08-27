import { useSettingsStore } from '../stores/useSettingsStore';
import { Card, CardHeader, CardBody } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Download, Upload, Volume2, Moon, Sun, Monitor } from 'lucide-react';
import { exportBackup, importBackup, downloadText } from '../services/backupService';
import { notify } from '../services/notificationService';
import { useState } from 'react';

export function SettingsPage() {
  const { settings, update } = useSettingsStore();
  const [importing, setImporting] = useState(false);

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
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Pengaturan</h1>
        <p className="text-sm text-slate-500">Konfigurasi sistem bel</p>
      </div>

      <Card>
        <CardHeader title="Audio" />
        <CardBody className="space-y-4">
          <div>
            <label className="text-sm font-medium flex items-center gap-2">
              <Volume2 className="w-4 h-4" /> Volume Bel: {settings.volume}%
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
              <label className="text-sm font-medium">Fade In (ms)</label>
              <input type="number" value={settings.fadeIn} onChange={(e) => update({ fadeIn: Number(e.target.value) })}
                className="mt-1 w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900" />
            </div>
            <div>
              <label className="text-sm font-medium">Fade Out (ms)</label>
              <input type="number" value={settings.fadeOut} onChange={(e) => update({ fadeOut: Number(e.target.value) })}
                className="mt-1 w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900" />
            </div>
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardHeader title="Tampilan" />
        <CardBody>
          <label className="text-sm font-medium mb-2 block">Tema</label>
          <div className="grid grid-cols-3 gap-2">
            {([
              { v: 'light', label: 'Light', icon: Sun },
              { v: 'dark', label: 'Dark', icon: Moon },
              { v: 'system', label: 'System', icon: Monitor },
            ] as const).map(({ v, label, icon: Icon }) => (
              <button
                key={v}
                onClick={() => update({ theme: v })}
                className={`flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg border text-sm font-medium transition ${
                  settings.theme === v
                    ? 'bg-primary-700 text-white border-primary-700'
                    : 'bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-600'
                }`}
              >
                <Icon className="w-4 h-4" /> {label}
              </button>
            ))}
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardHeader title="Backup & Restore" />
        <CardBody className="space-y-3">
          <div className="text-xs text-slate-500">
            <p>• <b>Export Config</b>: jadwal, pengaturan, kalender (tanpa file MP3)</p>
            <p>• <b>Export Full</b>: termasuk file MP3 (ukuran file bisa besar)</p>
            <p>• <b>Import</b>: restore dari file backup JSON</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" onClick={() => doExport(false)}>
              <Download className="w-4 h-4" /> Export Config
            </Button>
            <Button variant="secondary" onClick={() => doExport(true)}>
              <Download className="w-4 h-4" /> Export Full (+MP3)
            </Button>
            <label className={`inline-flex items-center gap-2 px-3.5 py-2 text-sm font-medium rounded-lg cursor-pointer ${
              importing ? 'bg-slate-300 text-slate-500' : 'bg-primary-700 hover:bg-primary-800 text-white'
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
          <div><b>Bell Sekolah Otomatis</b> v1.0.0</div>
          <div>Tech: React + TypeScript + Vite + Tailwind + IndexedDB</div>
          <div>Data disimpan lokal di browser (IndexedDB)</div>
        </CardBody>
      </Card>
    </div>
  );
}
