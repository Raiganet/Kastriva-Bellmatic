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
      
      // Method: Gunakan AudioContext + Oscillator (paling reliable)
      const AC = (window.AudioContext || (window as any).webkitAudioContext);
      if (!AC) {
        throw new Error('Web Audio API tidak didukung browser ini');
      }
      
      const ctx = new AC();
      console.log('[Layout] AudioContext created, state:', ctx.state);
      
      // Buat oscillator silent (frequency sangat rendah, volume 0)
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();
      
      oscillator.frequency.value = 0; // Silent
      gainNode.gain.value = 0; // Volume 0
      
      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);
      
      oscillator.start();
      console.log('[Layout] Oscillator started');
      
      // Stop setelah 100ms
      setTimeout(() => {
        oscillator.stop();
        oscillator.disconnect();
        gainNode.disconnect();
        console.log('[Layout] Oscillator stopped');
      }, 100);
      
      // Resume context (penting untuk mobile)
      await ctx.resume();
      console.log('[Layout] AudioContext resumed, state:', ctx.state);
      
      setAudioUnlocked(true);
      console.log('[Layout] Audio unlocked successfully!');
      
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
