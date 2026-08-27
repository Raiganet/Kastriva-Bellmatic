import { useState, useRef } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../database/db';
import { Card, CardHeader, CardBody } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Modal } from '../components/ui/Modal';
import { EmptyState } from '../components/ui/EmptyState';
import { Upload, Play, Pause, Square, Edit2, Trash2, Music, Search } from 'lucide-react';
import { saveAudioFile, deleteAudio, updateAudio, getObjectUrl } from '../services/audioService';
import { notify } from '../services/notificationService';
import { formatDuration, formatSize } from '../utils/time';
import { useAppStore } from '../stores/useAppStore';
import type { AudioFile } from '../types';

export function AudioPage() {
  const audios = useLiveQuery(() => db.audio.orderBy('createdAt').reverse().toArray(), []) || [];
  const [search, setSearch] = useState('');
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [editing, setEditing] = useState<AudioFile | null>(null);
  const [editName, setEditName] = useState('');
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const audioUnlocked = useAppStore((s) => s.audioUnlocked);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const filtered = audios.filter((a) =>
    a.displayName.toLowerCase().includes(search.toLowerCase()) ||
    a.name.toLowerCase().includes(search.toLowerCase())
  );

  const handleFiles = async (files: FileList | File[]) => {
    if (!files || files.length === 0) return;
    setUploading(true);
    setProgress(0);
    let done = 0;
    for (const file of Array.from(files)) {
      try {
        await saveAudioFile(file);
        done++;
        setProgress(Math.round((done / files.length) * 100));
      } catch (e: any) {
        notify(`Gagal upload ${file.name}: ${e.message}`, 'error');
      }
    }
    setUploading(false);
    notify(`${done} file audio berhasil diupload`, 'success');
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    handleFiles(e.dataTransfer.files);
  };

  const togglePlay = async (a: AudioFile) => {
    if (!audioUnlocked) {
      notify('Aktifkan sistem bel terlebih dahulu', 'warning');
      return;
    }
    if (playingId === a.id) {
      audioRef.current?.pause();
      setPlayingId(null);
      return;
    }
    try {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      const url = getObjectUrl(a);
      const el = new Audio(url);
      el.volume = 0.8;
      await el.play();
      audioRef.current = el;
      setPlayingId(a.id);
      el.addEventListener('ended', () => setPlayingId(null));
    } catch (e: any) {
      notify('Gagal memutar: ' + (e?.message || ''), 'error');
    }
  };

  const stop = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current = null;
      setPlayingId(null);
    }
  };

  const handleDelete = async (a: AudioFile) => {
    if (!confirm(`Hapus audio "${a.displayName}"? Jadwal yang menggunakan audio ini akan kehilangan referensi.`)) return;
    await deleteAudio(a.id);
    notify('Audio dihapus', 'success');
  };

  const openEdit = (a: AudioFile) => {
    setEditing(a);
    setEditName(a.displayName);
  };

  const saveEdit = async () => {
    if (!editing) return;
    await updateAudio(editing.id, { displayName: editName.trim() || editing.name });
    setEditing(null);
    notify('Nama audio diperbarui', 'success');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold">Audio / MP3 Library</h1>
          <p className="text-sm text-slate-500">Kelola file audio untuk bel sekolah</p>
        </div>
        <Button onClick={() => fileInputRef.current?.click()}>
          <Upload className="w-4 h-4" /> Upload MP3
        </Button>
        <input
          ref={fileInputRef}
          type="file"
          accept="audio/*,.mp3,.wav,.ogg,.m4a,.aac"
          multiple
          className="hidden"
          onChange={(e) => e.target.files && handleFiles(e.target.files)}
        />
      </div>

      {/* Drop zone */}
      <Card>
        <CardBody>
          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={onDrop}
            className="border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-xl p-8 text-center hover:border-primary-500 transition"
          >
            <Music className="w-10 h-10 mx-auto text-slate-400 mb-2" />
            <div className="font-medium">Drag & drop file MP3 di sini</div>
            <div className="text-xs text-slate-500 mt-1">atau klik tombol Upload MP3 di atas</div>
            {uploading && (
              <div className="mt-4 max-w-xs mx-auto">
                <div className="h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                  <div className="h-full bg-primary-600 transition-all" style={{ width: `${progress}%` }} />
                </div>
                <div className="text-xs text-slate-500 mt-1">Mengupload... {progress}%</div>
              </div>
            )}
          </div>
        </CardBody>
      </Card>

      {/* Search */}
      <Card>
        <CardBody className="flex items-center gap-2">
          <Search className="w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Cari audio..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 bg-transparent outline-none text-sm"
          />
          <div className="text-xs text-slate-500">{filtered.length} audio</div>
        </CardBody>
      </Card>

      {/* List */}
      {filtered.length === 0 ? (
        <EmptyState
          title="Belum ada audio"
          description="Upload file MP3 untuk memulai"
          action={<Button onClick={() => fileInputRef.current?.click()}><Upload className="w-4 h-4" /> Upload MP3</Button>}
        />
      ) : (
        <Card>
          <div className="divide-y divide-slate-200 dark:divide-slate-700">
            {filtered.map((a) => (
              <div key={a.id} className="p-4 flex items-center gap-3 hover:bg-slate-50 dark:hover:bg-slate-900/40">
                <div className="w-10 h-10 rounded-lg bg-primary-100 dark:bg-primary-900/40 flex items-center justify-center flex-shrink-0">
                  <Music className="w-5 h-5 text-primary-700 dark:text-primary-300" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium truncate">{a.displayName}</div>
                  <div className="text-xs text-slate-500 flex flex-wrap gap-x-3">
                    <span>{a.name}</span>
                    <span>⏱ {formatDuration(a.duration)}</span>
                    <span>📦 {formatSize(a.size)}</span>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <Button size="sm" variant="ghost" onClick={() => togglePlay(a)} title={playingId === a.id ? 'Pause' : 'Play'}>
                    {playingId === a.id ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                  </Button>
                  <Button size="sm" variant="ghost" onClick={stop} title="Stop">
                    <Square className="w-4 h-4" />
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => openEdit(a)} title="Edit">
                    <Edit2 className="w-4 h-4" />
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => handleDelete(a)} title="Hapus">
                    <Trash2 className="w-4 h-4 text-rose-500" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Edit modal */}
      <Modal open={!!editing} onClose={() => setEditing(null)} title="Edit Audio">
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium">Nama Tampilan</label>
            <input
              type="text"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              className="mt-1 w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900"
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setEditing(null)}>Batal</Button>
            <Button onClick={saveEdit}>Simpan</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
