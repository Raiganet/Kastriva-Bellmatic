import { useAppStore } from '../stores/useAppStore';
import { useSettingsStore } from '../stores/useSettingsStore';
import { useClock } from '../hooks/useClock';
import { Menu, Bell as BellIcon, Moon, Sun } from 'lucide-react';
import { formatTime } from '../utils/time';

export function Topbar() {
  const { toggleSidebar, audioUnlocked, schedulerActive } = useAppStore();
  const { settings, update } = useSettingsStore();
  const now = useClock(1000);

  const toggleTheme = () => {
    update({ theme: settings.theme === 'dark' ? 'light' : 'dark' });
  };

  return (
    <header className="h-16 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-4 lg:px-6 sticky top-0 z-20">
      <div className="flex items-center gap-3">
        <button className="lg:hidden p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800" onClick={toggleSidebar}>
          <Menu className="w-5 h-5" />
        </button>
        <div className="hidden sm:block">
          <div className="text-xs text-slate-500">Waktu Perangkat</div>
          <div className="font-mono font-semibold text-slate-900 dark:text-white">{formatTime(now)}</div>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium ${
          audioUnlocked && schedulerActive
            ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300'
            : 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300'
        }`}>
          <span className={`w-2 h-2 rounded-full ${audioUnlocked && schedulerActive ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
          {audioUnlocked && schedulerActive ? 'Sistem Aktif' : 'Sistem Nonaktif'}
        </div>

        <button
          onClick={toggleTheme}
          className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
          title="Ganti tema"
        >
          {settings.theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
        </button>
      </div>
    </header>
  );
}
