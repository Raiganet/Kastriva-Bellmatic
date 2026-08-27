import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';
import { ToastContainer } from './ui/Toast';
import { useAppStore } from '../stores/useAppStore';
import { Bell, Volume2, Zap, ShieldCheck } from 'lucide-react';
import { Button } from './ui/Button';
import { db } from '../database/db';

export function Layout({ children }: { children: React.ReactNode }) {
  const { audioUnlocked, setAudioUnlocked } = useAppStore();

  const unlockAudio = async () => {
    try {
      console.log('[Layout] Attempting to unlock audio...');
      const AC = (window.AudioContext || (window as any).webkitAudioContext);
      if (!AC) throw new Error('Web Audio API tidak didukung browser ini');

      const ctx = new AC();
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();
      oscillator.frequency.value = 0;
      gainNode.gain.value = 0;
      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);
      oscillator.start();
      setTimeout(() => {
        oscillator.stop();
        oscillator.disconnect();
        gainNode.disconnect();
      }, 100);

      await ctx.resume();
      setAudioUnlocked(true);
      console.log('[Layout] Audio unlocked successfully!');
      const audioCount = await db.audio.count();
      console.log('[Layout] Audio files in database:', audioCount);
    } catch (e: any) {
      console.error('[Layout] Failed to unlock audio:', e);
      alert('Gagal mengaktifkan audio: ' + (e?.message || 'Unknown error'));
    }
  };

  return (
    <div className="flex min-h-screen bg-slate-100 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Topbar />
        <main className="flex-1 p-4 lg:p-6">{children}</main>
      </div>
      <ToastContainer />

      {!audioUnlocked && (
        <div className="fixed inset-0 z-[60] bg-slate-950/70 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl max-w-md w-full overflow-hidden animate-in zoom-in-95">
            <div className="bg-brand p-8 text-center relative overflow-hidden">
              <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-white/10" />
              <div className="absolute -bottom-16 -left-10 w-48 h-48 rounded-full bg-white/5" />
              <div className="relative w-16 h-16 mx-auto rounded-2xl bg-white/15 backdrop-blur flex items-center justify-center mb-4 border border-white/20">
                <Bell className="w-8 h-8 text-white" />
              </div>
              <h2 className="relative text-2xl font-bold text-white tracking-tight">Kastriva Bellmatic</h2>
              <p className="relative text-xs text-primary-200 uppercase tracking-widest mt-1">Smart School Bell System</p>
            </div>

            <div className="p-8">
              <p className="text-sm text-slate-600 dark:text-slate-400 text-center mb-6">
                Aktifkan sistem untuk memulai otomatisasi bel sekolah pada perangkat ini.
              </p>

              <div className="space-y-3 mb-6">
                <div className="flex items-center gap-3 text-sm text-slate-600 dark:text-slate-300">
                  <div className="w-8 h-8 rounded-lg bg-primary-50 dark:bg-primary-900/30 flex items-center justify-center">
                    <Volume2 className="w-4 h-4 text-primary-600 dark:text-primary-400" />
                  </div>
                  Izinkan pemutaran audio otomatis
                </div>
                <div className="flex items-center gap-3 text-sm text-slate-600 dark:text-slate-300">
                  <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-900/30 flex items-center justify-center">
                    <Zap className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  Jalankan scheduler bel otomatis
                </div>
                <div className="flex items-center gap-3 text-sm text-slate-600 dark:text-slate-300">
                  <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center">
                    <ShieldCheck className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                  </div>
                  Data tersimpan aman secara lokal
                </div>
              </div>

              <Button size="lg" onClick={unlockAudio} className="w-full">
                🔊 AKTIFKAN SISTEM BEL
              </Button>
              <p className="text-[11px] text-slate-400 text-center mt-4">
                Status aktif tersimpan selama sesi browser berlangsung.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
