import { useMemo, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../database/db';
import { Card, CardHeader } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Trash2, Download } from 'lucide-react';
import { toISODate } from '../utils/time';

export function HistoryPage() {
  const allLogs = useLiveQuery(() => db.logs.orderBy('timestamp').reverse().toArray(), []) || [];
  const [filter, setFilter] = useState<'all' | 'today' | 'week'>('today');
  const [statusFilter, setStatusFilter] = useState<'all' | 'success' | 'error' | 'skipped'>('all');

  const filtered = useMemo(() => {
    const now = new Date();
    const today = toISODate(now);
    return allLogs.filter((l) => {
      if (filter === 'today' && l.date !== today) return false;
      if (filter === 'week') {
        const d = new Date(l.timestamp);
        const diff = (now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24);
        if (diff > 7) return false;
      }
      if (statusFilter !== 'all' && l.status !== statusFilter) return false;
      return true;
    });
  }, [allLogs, filter, statusFilter]);

  const clearAll = async () => {
    if (!confirm('Hapus semua riwayat?')) return;
    await db.logs.clear();
  };

  const exportLogs = () => {
    const rows = filtered.map((l) => ({
      Tanggal: l.date,
      Jam: l.time,
      Kegiatan: l.scheduleName,
      Audio: l.audioName || '',
      Status: l.status,
      Error: l.error || '',
    }));
    const csv = 'Tanggal,Jam,Kegiatan,Audio,Status,Error\n' +
      rows.map((r) => Object.values(r).map((v) => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `riwayat-bel-${toISODate(new Date())}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold">Riwayat Bel</h1>
          <p className="text-sm text-slate-500">Catatan semua bel yang dijalankan</p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={exportLogs}><Download className="w-4 h-4" /> Export</Button>
          <Button variant="danger" onClick={clearAll}><Trash2 className="w-4 h-4" /> Hapus Semua</Button>
        </div>
      </div>

      <Card>
        <div className="p-4 flex flex-wrap gap-3">
          <select value={filter} onChange={(e) => setFilter(e.target.value as any)} className="px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-sm">
            <option value="today">Hari Ini</option>
            <option value="week">7 Hari Terakhir</option>
            <option value="all">Semua</option>
          </select>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as any)} className="px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-sm">
            <option value="all">Semua Status</option>
            <option value="success">Berhasil</option>
            <option value="skipped">Dilewati</option>
            <option value="error">Gagal</option>
          </select>
          <div className="ml-auto text-sm text-slate-500">{filtered.length} entri</div>
        </div>
      </Card>

      <Card>
        <div className="divide-y divide-slate-200 dark:divide-slate-700">
          {filtered.length === 0 && (
            <div className="p-8 text-center text-slate-500">Tidak ada riwayat</div>
          )}
          {filtered.map((l) => (
            <div key={l.id} className="p-4 flex items-center gap-3">
              <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
                l.status === 'success' ? 'bg-emerald-500' : l.status === 'skipped' ? 'bg-amber-500' : 'bg-rose-500'
              }`} />
              <div className="font-mono text-xs text-slate-500 w-28 flex-shrink-0">
                {l.date}<br/>{l.time}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-medium truncate">{l.scheduleName}</div>
                <div className="text-xs text-slate-500 truncate">{l.audioName || '-'}</div>
                {l.error && <div className="text-xs text-rose-500 mt-0.5">{l.error}</div>}
              </div>
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
