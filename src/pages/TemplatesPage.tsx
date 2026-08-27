import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../database/db';
import { Card, CardHeader, CardBody } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { EmptyState } from '../components/ui/EmptyState';
import { Plus, Trash2, LayoutTemplate, Copy } from 'lucide-react';
import { notify } from '../services/notificationService';
import { uid } from '../utils/time';
import { DAYS, DAY_LABEL, type DayOfWeek, type ScheduleTemplate } from '../types';

export function TemplatesPage() {
  const templates = useLiveQuery(() => db.templates.orderBy('createdAt').reverse().toArray(), []) || [];
  const audios = useLiveQuery(() => db.audio.toArray(), []) || [];

  const [modal, setModal] = useState(false);
  const [name, setName] = useState('');
  const [items, setItems] = useState<{ time: string; name: string; audioId: string; priority: number }[]>([]);
  const [applyModal, setApplyModal] = useState<ScheduleTemplate | null>(null);
  const [applyDays, setApplyDays] = useState<DayOfWeek[]>([]);

  const addItem = () => setItems([...items, { time: '07:00', name: '', audioId: '', priority: 0 }]);
  const removeItem = (i: number) => setItems(items.filter((_, idx) => idx !== i));
  const updateItem = (i: number, patch: Partial<typeof items[0]>) =>
    setItems(items.map((it, idx) => idx === i ? { ...it, ...patch } : it));

  const saveTemplate = async () => {
    if (!name.trim()) return notify('Nama template wajib diisi', 'error');
    if (items.length === 0) return notify('Minimal 1 item', 'error');
    if (items.some((i) => !i.name.trim() || !i.audioId)) return notify('Lengkapi semua item', 'error');
    await db.templates.add({
      id: uid(),
      name: name.trim(),
      items,
      createdAt: Date.now(),
    });
    notify('Template disimpan', 'success');
    setModal(false);
    setName('');
    setItems([]);
  };

  const deleteTemplate = async (t: ScheduleTemplate) => {
    if (!confirm(`Hapus template "${t.name}"?`)) return;
    await db.templates.delete(t.id);
    notify('Template dihapus', 'success');
  };

  const applyTemplate = async () => {
    if (!applyModal || applyDays.length === 0) return notify('Pilih minimal 1 hari', 'error');
    for (const day of applyDays) {
      for (const it of applyModal.items) {
        await db.schedules.add({
          id: uid(),
          name: it.name,
          days: [day],
          time: it.time,
          audioId: it.audioId,
          enabled: true,
          priority: it.priority,
          createdAt: Date.now(),
        });
      }
    }
    notify(`Template diterapkan ke ${applyDays.length} hari`, 'success');
    setApplyModal(null);
    setApplyDays([]);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold">Template Jadwal</h1>
          <p className="text-sm text-slate-500">Buat template untuk diterapkan ke beberapa hari sekaligus</p>
        </div>
        <Button onClick={() => setModal(true)}><Plus className="w-4 h-4" /> Template Baru</Button>
      </div>

      {templates.length === 0 ? (
        <EmptyState
          title="Belum ada template"
          description="Buat template jadwal untuk diterapkan ke beberapa hari"
          action={<Button onClick={() => setModal(true)}><Plus className="w-4 h-4" /> Buat Template</Button>}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {templates.map((t) => (
            <Card key={t.id}>
              <CardHeader
                title={t.name}
                subtitle={`${t.items.length} item`}
                action={
                  <div className="flex gap-1">
                    <Button size="sm" variant="ghost" onClick={() => { setApplyModal(t); setApplyDays([]); }} title="Terapkan">
                      <Copy className="w-4 h-4" />
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => deleteTemplate(t)}>
                      <Trash2 className="w-4 h-4 text-rose-500" />
                    </Button>
                  </div>
                }
              />
              <CardBody className="space-y-1">
                {t.items.map((it, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm">
                    <span className="font-mono text-xs text-slate-500 w-12">{it.time}</span>
                    <span className="flex-1 truncate">{it.name}</span>
                  </div>
                ))}
              </CardBody>
            </Card>
          ))}
        </div>
      )}

      {/* Create modal */}
      <Modal open={modal} onClose={() => setModal(false)} title="Template Baru" size="xl">
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium">Nama Template</label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)}
              placeholder="Contoh: Senin-Kamis Reguler"
              className="mt-1 w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900" />
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium">Item Jadwal</label>
              <Button size="sm" variant="secondary" onClick={addItem}><Plus className="w-3 h-3" /> Tambah</Button>
            </div>
            <div className="space-y-2 max-h-80 overflow-y-auto">
              {items.map((it, i) => (
                <div key={i} className="flex items-center gap-2 p-2 rounded-lg border border-slate-200 dark:border-slate-700">
                  <input type="time" value={it.time} onChange={(e) => updateItem(i, { time: e.target.value })}
                    className="px-2 py-1 rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-sm" />
                  <input type="text" value={it.name} onChange={(e) => updateItem(i, { name: e.target.value })}
                    placeholder="Nama kegiatan"
                    className="flex-1 px-2 py-1 rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-sm" />
                  <select value={it.audioId} onChange={(e) => updateItem(i, { audioId: e.target.value })}
                    className="px-2 py-1 rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-sm">
                    <option value="">-- Audio --</option>
                    {audios.map((a) => <option key={a.id} value={a.id}>{a.displayName}</option>)}
                  </select>
                  <button onClick={() => removeItem(i)} className="p-1 text-rose-500">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setModal(false)}>Batal</Button>
            <Button onClick={saveTemplate}>Simpan Template</Button>
          </div>
        </div>
      </Modal>

      {/* Apply modal */}
      <Modal open={!!applyModal} onClose={() => setApplyModal(null)} title={`Terapkan Template: ${applyModal?.name || ''}`}>
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium">Pilih Hari</label>
            <div className="mt-2 flex flex-wrap gap-2">
              {DAYS.map((d) => (
                <button
                  key={d.key}
                  onClick={() => setApplyDays((prev) => prev.includes(d.key) ? prev.filter((x) => x !== d.key) : [...prev, d.key])}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition ${
                    applyDays.includes(d.key)
                      ? 'bg-primary-700 text-white border-primary-700'
                      : 'bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-600'
                  }`}
                >
                  {d.label}
                </button>
              ))}
            </div>
          </div>
          <div className="text-xs text-slate-500">
            Template akan menambahkan {applyModal?.items.length || 0} jadwal untuk setiap hari yang dipilih.
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setApplyModal(null)}>Batal</Button>
            <Button onClick={applyTemplate}>Terapkan</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
