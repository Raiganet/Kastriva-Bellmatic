import { useAppStore } from '../stores/useAppStore';
import { useSettingsStore } from '../stores/useSettingsStore';
import { useClock } from '../hooks/useClock';
import { usePwaInstall } from '../hooks/usePwaInstall';
import { Menu, Moon, Sun, Download, CheckCircle2, CalendarDays } from 'lucide-react';
import { formatTime, formatDateID } from '../utils/time';

export function Topbar() {
  const { toggleSidebar, audioUnlocked, schedulerActive } = useAppStore();
  const { settings, update } = useSettingsStore();
  const { canInstall, installed, install } = usePwaInstall();
  const now = useClock(1000);

  const toggleTheme = () => {
    update({ theme: settings.theme === 'dark' ? 'light' : 'dark' });
  };

  return (
    <header className="h-16 bg-white/80 dark:bg-slate-900/80 backdrop-blur-lg border-b border-slate-200/80 dark:border-slate-800 flex items-center justify-between px-4 lg:px-6 sticky top-0 z-20">
      <div className="flex items-center gap-3">
        <button className="lg:hidden p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800" onClick={toggleSidebar}>
          <Menu className="w-5 h-5" />
        </button>
        <div className="hidden md:flex items-center gap-2.5 px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
          <CalendarDays className="w-4 h-4 text-primary-600 dark:text-primary-400" />
          <div className="text-xs font-medium text-slate-600 dark:text-slate-300">{formatDateID(now)}</div>
          <div className="w-px h-4 bg-slate-300 dark:bg-slate-600" />
          <div className="font-mono tabular text-xs font-bold text-slate-900 dark:text-white">{formatTime(now)}</div>
        </div>
      </div>

      <div className="flex items-center gap-2">
        {canInstall && (
          <button
            onClick={() => install()}
            className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-gradient-to-r from-primary-600 to-indigo-600 text-white hover:opacity-90 shadow-pop transition"
          >
            <Download className="w-3.5 h-3.5" /> Install Aplikasi
          </button>
        )}

        {installed && (
          <span className="hidden md:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-800">
            <CheckCircle2 className="w-3.5 h-3.5" /> App Terinstall
          </span>
        )}

        <div className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold border ${
          audioUnlocked && schedulerActive
            ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-800'
            : 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-800'
        }`}>
          <span className={`w-2 h-2 rounded-full ${audioUnlocked && schedulerActive ? 'bg-emerald-500 animate-pulse-soft' : 'bg-amber-500'}`} />
          {audioUnlocked && schedulerActive ? 'Sistem Aktif' : 'Nonaktif'}
        </div>

        <button
          onClick={toggleTheme}
          className="p-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition"
          title="Ganti tema"
        >
          {settings.theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
        </button>

        <div className="w-9 h-9 rounded-xl bg-brand text-white flex items-center justify-center text-xs font-bold shadow-pop">
          KB
        </div>
      </div>
    </header>
  );
}
