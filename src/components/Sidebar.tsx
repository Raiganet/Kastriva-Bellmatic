import { useAppStore } from '../stores/useAppStore';
import {
  LayoutDashboard, Bell, Music, Calendar, LayoutTemplate, History, Settings as SettingsIcon, Monitor, TestTube, X,
} from 'lucide-react';
import { clsx } from 'clsx';
import type { PageKey } from '../types';

const items: { key: PageKey; label: string; icon: any }[] = [
  { key: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { key: 'schedules', label: 'Jadwal Bel', icon: Bell },
  { key: 'audio', label: 'Audio', icon: Music },
  { key: 'calendar', label: 'Kalender', icon: Calendar },
  { key: 'templates', label: 'Template', icon: LayoutTemplate },
  { key: 'history', label: 'Riwayat', icon: History },
  { key: 'test', label: 'Test Bell', icon: TestTube },
  { key: 'monitor', label: 'Monitor', icon: Monitor },
  { key: 'settings', label: 'Pengaturan', icon: SettingsIcon },
];

export function Sidebar() {
  const { page, setPage, sidebarOpen, setSidebarOpen } = useAppStore();

  return (
    <>
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="lg:hidden fixed inset-0 bg-black/40 z-30" onClick={() => setSidebarOpen(false)} />
      )}
      <aside
        className={clsx(
          'fixed lg:static inset-y-0 left-0 z-40 w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col transition-transform',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0',
        )}
      >
        <div className="h-16 flex items-center justify-between px-5 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2">
  <img 
    src="/icons/logo.png" 
    alt="Kastriva Bellmatic" 
    className="w-9 h-9 object-contain"
  />
  <div>
    <div className="font-bold text-slate-900 dark:text-white">Kastriva Bellmatic</div>
    <div className="text-[10px] text-slate-500">Sistem Bell Otomatis</div>
  </div>
</div>
          <button className="lg:hidden p-1" onClick={() => setSidebarOpen(false)}>
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto py-3 px-3">
          {items.map((it) => {
            const Icon = it.icon;
            const active = page === it.key;
            return (
              <button
                key={it.key}
                onClick={() => setPage(it.key)}
                className={clsx(
                  'w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition mb-0.5',
                  active
                    ? 'bg-primary-50 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800',
                )}
              >
                <Icon className="w-4.5 h-4.5" />
                {it.label}
              </button>
            );
          })}
        </nav>

        <div className="p-3 border-t border-slate-200 dark:border-slate-800">
          <div className="text-[11px] text-slate-500 px-2">
            © 2026 Bell Sekolah Otomatis
          </div>
        </div>
      </aside>
    </>
  );
}
