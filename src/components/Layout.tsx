import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';
import { ToastContainer } from './ui/Toast';
import { useAppStore } from '../stores/useAppStore';
import { Bell } from 'lucide-react';
import { Button } from './ui/Button';
import { db } from '../database/db';

export function Layout({ children }: { children: React.ReactNode }) {
  const { audioUnlocked, setAudioUnlocked } = useAppStore();

  const unlockAudio = async () => {
    try {
      console.log('[Layout] Attempting to unlock audio...');
      
      // Method 1: AudioContext
      const AC = (window.AudioContext || (window as any).webkitAudioContext);
      if (AC) {
        const ctx = new AC();
        await ctx.resume();
        console.log('[Layout] AudioContext resumed, state:', ctx.state);
      }
      
      // Method 2: Play silent audio
      const silent = new Audio('data:audio/wav;base64,UklGixAAAAABAAEARKwAAIhFQVZFZm10IBAAAAABAAEAESsAACJWAAACABAAZGF0YQAAAAA=');
      silent.volume = 0.01;
      
      const playPromise = silent.play();
      if (playPromise !== undefined) {
        await playPromise;
        console.log('[Layout] Silent audio played successfully');
      }
      
      setAudioUnlocked(true);
      console.log('[Layout] Audio unlocked!');
      
      // Cek audio di database
      const audioCount = await db.audio.count();
      console.log('[Layout] Audio files in database:', audioCount);
      
    } catch (e: any) {
      console.error('[Layout] Failed to unlock audio:', e);
      alert('Gagal mengaktifkan audio: ' + (e?.message || 'Unknown error'));
    }
  };

  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Topbar />
        <main className="flex-1 p-4 lg:p-6">{children}</main>
      </div>
      <ToastContainer />

      {!audioUnlocked && (
        <div className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-md w-full p-8 text-center">
            <div className="w-16 h-16 mx-auto rounded-full bg-primary-100 dark:bg-primary-900/40 flex items-center justify-center mb-4">
              <Bell className="w-8 h-8 text-primary-700 dark:text-primary-300" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Aktifkan Sistem Bel</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
              Browser memerlukan interaksi pengguna untuk memutar audio otomatis. Klik tombol di bawah untuk mengaktifkan sistem bel.
            </p>
            <Button size="lg" onClick={unlockAudio} className="w-full">
              🔊 AKTIFKAN SISTEM BEL
            </Button>
            <p className="text-[11px] text-slate-400 mt-4">
              Status akan tersimpan selama sesi browser aktif.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
