import { useState, useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../database/db';
import { Card, CardHeader, CardBody } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Modal } from '../components/ui/Modal';
import { Plus, Trash2, Calendar as CalIcon, Palmtree } from 'lucide-react';
import { notify } from '../services/notificationService';
import { uid, toISODate, formatDateID } from '../utils/time';
import type { Holiday, SpecialSchedule } from '../types';

export function CalendarPage() {
  const [tab, setTab] = useState<'holidays' | 'special'>('holidays');
  const holidays = useLiveQuery(() => db.holidays.orderBy('date').reverse().toArray(), []) || [];
  const specials = useLiveQuery(() => db.specialSchedules.orderBy('date').reverse().toArray(), []) || [];
  const audios = useLiveQuery(() => db.audio.toArray(), []) || [];

  const [holidayModal, setHolidayModal] = useState(false);
  const [specialModal, setSpecialModal] = useState(false);
  const [hForm, setHForm] = useState({ date: '', name: '', enabled: true });
  const [sForm, setSForm] = useState<Omit<SpecialSchedule, 'id' | 'createdAt'>>({
    name: '', date: '', time: '07:00', audioId: '', enabled: true, overrideNormal: false, priority: 0, notes: '',
  });

  const audioMap = useMemo(() => new Map(audios.map((a) => [a.id, a])), [audios]);

  const addHoliday = async () => {
    if (!hForm.date || !hForm.name.trim()) return notify('Lengkapi data', 'error');
    await db.holidays.add({ id: uid(), date: hForm.date, name: hForm.name.trim(), enabled: hForm.enabled });
    notify('Libur ditambahkan', 'success');
    setHolidayModal(false);
    setHForm({ date: '', name: '', enabled: true });
  };

  const addSpecial = async () => {
    if (!sForm.date || !sForm.time || !sForm.name.trim() || !sForm.audioId) return notify('Lengkapi data', 'error');
    await db.specialSchedules.add({ id: uid(), ...sForm, name: sForm.name.trim(), notes: sForm.notes?.trim(), createdAt: Date.now() });
    notify('Jadwal khusus ditambahkan', 'success');
    setSpecialModal(false);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Kalender Sekolah</h1>
        <p className="text-sm text-slate-500">Kelola hari libur dan jadwal khusus</p>
      </div>

      <div className="flex gap-2 border-b border-slate-200 dark:border-slate-700">
        <button
          onClick={() => setTab('holidays')}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition ${
            tab === 'holidays' ? 'border-primary-600 text-primary-700 dark:text-primary-300' : 'border-transparent text-slate-500'
          }`}
        >
          🏖 Hari Libur ({holidays.length})
        </button>
        <button
          onClick={() => setTab('special')}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition ${
            tab === 'special' ? 'border-primary-600 text-primary-700 dark:text-primary-300' : 'border-transparent text-slate-500'
          }`}
        >
          ⭐ Jadwal Khusus ({specials.length})
        </button>
      </div>

      {tab === 'holidays' && (
        <>
          <div className="flex justify-end">
            <Button onClick={() => setHolidayModal(true)}><Plus className="w-4 h-4" /> Tambah Libur</Button>
          </div>
          <Card>
            <div className="divide-y divide-slate-200 dark:divide-slate-700">
              {holidays.length === 0 && (
                <div className="p-8 text-center text-slate-500">Belum ada hari libur</div>
              )}
              {holidays.map((h) => (
                <div key={h.id} className="p-4 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-amber-100 dark:bg-amber-900/40 flex items-center justify-center">
                    <Palmtree className="w-5 h-5 text-amber-700 dark:text-amber-300" />
                  </div>
                  <div className="flex-1">
                    <div className="font-medium">{h.name}</div>
                    <div className="text-xs text-slate-500">{h.date}</div>
                  </div>
                  <Badge variant={h.enabled ? 'success' : 'neutral'}>{h.enabled ? 'Aktif' : 'Nonaktif'}</Badge>
                  <Button size="sm" variant="ghost" onClick={async () => {
                    if (confirm('Hapus libur ini?')) {
                      await db.holidays.delete(h.id);
                      notify('Libur dihapus', 'success');
                    }
                  }}>
                    <Trash2 className="w-4 h-4 text-rose-500" />
                  </Button>
                </div>
              ))}
            </div>
          </Card>
        </>
      )}

      {tab === 'special' && (
        <>
          <div className="flex justify-end">
            <Button onClick={() => setSpecialModal(true)}><Plus className="w-4 h-4" /> Tambah Jadwal Khusus</Button>
          </div>
          <Card>
            <div className="divide-y divide-slate-200 dark:divide-slate-700">
              {specials.length === 0 && (
                <div className="p-8 text-center text-slate-500">Belum ada jadwal khusus</div>
              )}
              {specials.map((s) => (
                <div key={s.id} className="p-4 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-primary-100 dark:bg-primary-900/40 flex items-center justify-center">
                    <CalIcon className="w-5 h-5 text-primary-700 dark:text-primary-300" />
                  </div>
                  <div className="flex-1">
                    <div className="font-medium">{s.name}</div>
                    <div className="text-xs text-slate-500">{s.date} • {s.time} • {audioMap.get(s.audioId)?.displayName || 'Audio ?'}</div>
                    {s.overrideNormal && <Badge variant="warning">Menggantikan jadwal normal</Badge>}
                  </div>
                  <Button size="sm" variant="ghost" onClick={async () => {
                    if (confirm('Hapus jadwal khusus ini?')) {
                      await db.specialSchedules.delete(s.id);
                      notify('Jadwal khusus dihapus', 'success');
                    }
                  }}>
                    <Trash2 className="w-4 h-4 text-rose-500" />
                  </Button>
                </div>
              ))}
            </div>
          </Card>
        </>
      )}

      {/* Holiday modal */}
      <Modal open={holidayModal} onClose={() => setHolidayModal(false)} title="Tambah Hari Libur">
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium">Tanggal</label>
            <input type="date" value={hForm.date} onChange={(e) => setHForm({ ...hForm, date: e.target.value })}
              className="mt-1 w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900" />
          </div>
          <div>
            <label className="text-sm font-medium">Nama Libur</label>
            <input type="text" value={hForm.name} onChange={(e) => setHForm({ ...hForm, name: e.target.value })}
              placeholder="Contoh: Hari Kemerdekaan"
              className="mt-1 w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900" />
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={hForm.enabled} onChange={(e) => setHForm({ ...hForm, enabled: e.target.checked })} /> Aktif
          </label>
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setHolidayModal(false)}>Batal</Button>
            <Button onClick={addHoliday}>Simpan</Button>
          </div>
        </div>
      </Modal>

      {/* Special schedule modal */}
      <Modal open={specialModal} onClose={() => setSpecialModal(false)} title="Tambah Jadwal Khusus">
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium">Nama Kegiatan</label>
            <input type="text" value={sForm.name} onChange={(e) => setSForm({ ...sForm, name: e.target.value })}
              className="mt-1 w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium">Tanggal</label>
              <input type="date" value={sForm.date} onChange={(e) => setSForm({ ...sForm, date: e.target.value })}
                className="mt-1 w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900" />
            </div>
            <div>
              <label className="text-sm font-medium">Jam</label>
              <input type="time" value={sForm.time} onChange={(e) => setSForm({ ...sForm, time: e.target.value })}
                className="mt-1 w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900" />
            </div>
          </div>
          <div>
            <label className="text-sm font-medium">Audio</label>
            <select value={sForm.audioId} onChange={(e) => setSForm({ ...sForm, audioId: e.target.value })}
              className="mt-1 w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900">
              <option value="">-- Pilih Audio --</option>
              {audios.map((a) => <option key={a.id} value={a.id}>{a.displayName}</option>)}
            </select>
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={sForm.overrideNormal} onChange={(e) => setSForm({ ...sForm, overrideNormal: e.target.checked })} />
            Nonaktifkan jadwal normal pada tanggal ini
          </label>
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setSpecialModal(false)}>Batal</Button>
            <Button onClick={addSpecial}>Simpan</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
