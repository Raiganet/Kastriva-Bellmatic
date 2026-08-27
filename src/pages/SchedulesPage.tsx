import { useState, useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../database/db';
import { Card, CardHeader, CardBody } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Modal } from '../components/ui/Modal';
import { EmptyState } from '../components/ui/EmptyState';
import { Plus, Edit2, Trash2, Search, Copy, Download, Upload } from 'lucide-react';
import { notify } from '../services/notificationService';
import { uid } from '../utils/time';
import { DAYS, DAY_LABEL, type DayOfWeek, type Schedule } from '../types';
import { parseCSV, exportCSV, parseDay } from '../utils/csv';

const EMPTY_FORM = {
  name: '',
  days: [] as DayOfWeek[],
  time: '07:00',
  audioId: '',
  enabled: true,
  priority: 0,
  notes: '',
};

export function SchedulesPage() {
  const schedules = useLiveQuery(() => db.schedules.orderBy('time').toArray(), []) || [];
  const audios = useLiveQuery(() => db.audio.toArray(), []) || [];
  const [search, setSearch] = useState('');
  const [filterDay, setFilterDay] = useState<DayOfWeek | 'all'>('all');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive'>('all');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Schedule | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const fileInputRef = useState<HTMLInputElement | null>(null);

  const audioMap = useMemo(() => new Map(audios.map((a) => [a.id, a])), [audios]);

  const filtered = useMemo(() => {
    return schedules.filter((s) => {
      if (search && !s.name.toLowerCase().includes(search.toLowerCase())) return false;
      if (filterDay !== 'all' && !s.days.includes(filterDay)) return false;
      if (filterStatus === 'active' && !s.enabled) return false;
      if (filterStatus === 'inactive' && s.enabled) return false;
      return true;
    });
  }, [schedules, search, filterDay, filterStatus]);

  const openNew = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setModalOpen(true);
  };

  const openEdit = (s: Schedule) => {
    setEditing(s);
    setForm({
      name: s.name,
      days: [...s.days],
      time: s.time,
      audioId: s.audioId,
      enabled: s.enabled,
      priority: s.priority,
      notes: s.notes || '',
    });
    setModalOpen(true);
  };

  const toggleDay = (d: DayOfWeek) => {
    setForm((f) => ({
      ...f,
      days: f.days.includes(d) ? f.days.filter((x) => x !== d) : [...f.days, d],
    }));
  };

  const save = async () => {
    if (!form.name.trim()) return notify('Nama kegiatan wajib diisi', 'error');
    if (form.days.length === 0) return notify('Pilih minimal 1 hari', 'error');
    if (!/^\d{2}:\d{2}$/.test(form.time)) return notify('Format jam tidak valid (HH:MM)', 'error');
    if (!form.audioId) return notify('Pilih audio', 'error');

    // Cek duplikat
    const duplicate = schedules.find((s) =>
      (!editing || s.id !== editing.id) &&
      s.time === form.time &&
      s.days.some((d) => form.days.includes(d)) &&
      s.name === form.name.trim()
    );
    if (duplicate) {
      return notify('Jadwal dengan nama, hari, dan waktu yang sama sudah ada', 'warning');
    }

    if (editing) {
      await db.schedules.update(editing.id, {
        name: form.name.trim(),
        days: form.days,
        time: form.time,
        audioId: form.audioId,
        enabled: form.enabled,
        priority: form.priority,
        notes: form.notes.trim(),
      });
      notify('Jadwal diperbarui', 'success');
    } else {
      await db.schedules.add({
        id: uid(),
        name: form.name.trim(),
        days: form.days,
        time: form.time,
        audioId: form.audioId,
        enabled: form.enabled,
        priority: form.priority,
        notes: form.notes.trim(),
        createdAt: Date.now(),
      });
      notify('Jadwal ditambahkan', 'success');
    }
    setModalOpen(false);
  };

  const handleDelete = async (s: Schedule) => {
    if (!confirm(`Hapus jadwal "${s.name}"?`)) return;
    await db.schedules.delete(s.id);
    notify('Jadwal dihapus', 'success');
  };

  const toggleEnabled = async (s: Schedule) => {
    await db.schedules.update(s.id, { enabled: !s.enabled });
  };

  const duplicate = async (s: Schedule) => {
    await db.schedules.add({
      ...s,
      id: uid(),
      name: s.name + ' (copy)',
      createdAt: Date.now(),
    });
    notify('Jadwal diduplikasi', 'success');
  };

  const doExport = () => {
    const rows = schedules.flatMap((s) =>
      s.days.map((d) => ({
        Hari: DAY_LABEL[d],
        Jam: s.time,
        Kegiatan: s.name,
        Audio: audioMap.get(s.audioId)?.name || '',
        Status: s.enabled ? 'Aktif' : 'Nonaktif',
      }))
    );
    const csv = exportCSV(rows);
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `jadwal-bel-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const doImport = async (file: File) => {
    const text = await file.text();
    const rows = parseCSV(text);
    let added = 0;
    for (const r of rows) {
      const day = parseDay(r.hari);
      if (!day) continue;
      const audio = audios.find((a) => a.name === r.audio || a.displayName === r.audio);
      if (!audio) continue;
      await db.schedules.add({
        id: uid(),
        name: r.kegiatan,
        days: [day],
        time: r.jam,
        audioId: audio.id,
        enabled: r.status !== 'nonaktif',
        priority: 0,
        createdAt: Date.now(),
      });
      added++;
    }
    notify(`${added} jadwal berhasil diimpor`, 'success');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold">Jadwal Bel</h1>
          <p className="text-sm text-slate-500">Kelola jadwal bel otomatis</p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={doExport}><Download className="w-4 h-4" /> Export CSV</Button>
          <label className="inline-flex items-center gap-2 px-3.5 py-2 text-sm font-medium rounded-lg bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-600">
            <Upload className="w-4 h-4" /> Import CSV
            <input type="file" accept=".csv" className="hidden" onChange={(e) => e.target.files && doImport(e.target.files[0])} />
          </label>
          <Button onClick={openNew}><Plus className="w-4 h-4" /> Tambah Jadwal</Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardBody className="flex flex-wrap gap-3">
          <div className="flex items-center gap-2 flex-1 min-w-[200px]">
            <Search className="w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Cari jadwal..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="flex-1 bg-transparent outline-none text-sm"
            />
          </div>
          <select value={filterDay} onChange={(e) => setFilterDay(e.target.value as any)} className="px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-sm">
            <option value="all">Semua Hari</option>
            {DAYS.map((d) => <option key={d.key} value={d.key}>{d.label}</option>)}
          </select>
          <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value as any)} className="px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-sm">
            <option value="all">Semua Status</option>
            <option value="active">Aktif</option>
            <option value="inactive">Nonaktif</option>
          </select>
        </CardBody>
      </Card>

      {/* Table */}
      {filtered.length === 0 ? (
        <EmptyState
          title="Belum ada jadwal"
          description="Tambahkan jadwal bel pertama Anda"
          action={<Button onClick={openNew}><Plus className="w-4 h-4" /> Tambah Jadwal</Button>}
        />
      ) : (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 dark:bg-slate-900/50 text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-4 py-3 text-left">Jam</th>
                  <th className="px-4 py-3 text-left">Kegiatan</th>
                  <th className="px-4 py-3 text-left">Hari</th>
                  <th className="px-4 py-3 text-left">Audio</th>
                  <th className="px-4 py-3 text-left">Prioritas</th>
                  <th className="px-4 py-3 text-left">Status</th>
                  <th className="px-4 py-3 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                {filtered.map((s) => (
                  <tr key={s.id}>
                    <td className="px-4 py-3 font-mono font-semibold">{s.time}</td>
                    <td className="px-4 py-3">
                      <div className="font-medium">{s.name}</div>
                      {s.notes && <div className="text-xs text-slate-500">{s.notes}</div>}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {s.days.map((d) => (
                          <span key={d} className="px-1.5 py-0.5 text-[10px] rounded bg-slate-100 dark:bg-slate-700">
                            {DAY_LABEL[d].slice(0, 3)}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {audioMap.get(s.audioId) ? (
                        <Badge variant="info">{audioMap.get(s.audioId)!.displayName}</Badge>
                      ) : (
                        <Badge variant="danger">Audio hilang</Badge>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={s.priority === 0 ? 'neutral' : s.priority === 1 ? 'warning' : 'danger'}>
                        {s.priority === 0 ? 'Normal' : s.priority === 1 ? 'Khusus' : 'Sangat Khusus'}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <button onClick={() => toggleEnabled(s)}>
                        <Badge variant={s.enabled ? 'success' : 'neutral'}>
                          {s.enabled ? 'Aktif' : 'Nonaktif'}
                        </Badge>
                      </button>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end gap-1">
                        <Button size="sm" variant="ghost" onClick={() => duplicate(s)} title="Duplikat">
                          <Copy className="w-4 h-4" />
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => openEdit(s)}>
                          <Edit2 className="w-4 h-4" />
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => handleDelete(s)}>
                          <Trash2 className="w-4 h-4 text-rose-500" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Form Modal */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit Jadwal' : 'Tambah Jadwal'} size="lg">
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium">Nama Kegiatan</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Contoh: Bel Masuk"
              className="mt-1 w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900"
            />
          </div>

          <div>
            <label className="text-sm font-medium">Hari</label>
            <div className="mt-1 flex flex-wrap gap-2">
              {DAYS.map((d) => (
                <button
                  key={d.key}
                  type="button"
                  onClick={() => toggleDay(d.key)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition ${
                    form.days.includes(d.key)
                      ? 'bg-primary-700 text-white border-primary-700'
                      : 'bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-600'
                  }`}
                >
                  {d.label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium">Jam</label>
              <input
                type="time"
                value={form.time}
                onChange={(e) => setForm({ ...form, time: e.target.value })}
                className="mt-1 w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Prioritas</label>
              <select
                value={form.priority}
                onChange={(e) => setForm({ ...form, priority: Number(e.target.value) })}
                className="mt-1 w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900"
              >
                <option value={0}>Normal</option>
                <option value={1}>Khusus</option>
                <option value={2}>Sangat Khusus</option>
              </select>
            </div>
          </div>

          <div>
            <label className="text-sm font-medium">Audio</label>
            <select
              value={form.audioId}
              onChange={(e) => setForm({ ...form, audioId: e.target.value })}
              className="mt-1 w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900"
            >
              <option value="">-- Pilih Audio --</option>
              {audios.map((a) => (
                <option key={a.id} value={a.id}>{a.displayName}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-sm font-medium">Keterangan</label>
            <textarea
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              rows={2}
              className="mt-1 w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900"
            />
          </div>

          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={form.enabled} onChange={(e) => setForm({ ...form, enabled: e.target.checked })} />
            Jadwal Aktif
          </label>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-700">
            <Button variant="secondary" onClick={() => setModalOpen(false)}>Batal</Button>
            <Button onClick={save}>{editing ? 'Perbarui' : 'Simpan'}</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
