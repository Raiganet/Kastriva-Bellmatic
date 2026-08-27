import { useAppStore } from '../stores/useAppStore';
import {
  LayoutDashboard, Bell, Music, Calendar, LayoutTemplate, History,
  Settings as SettingsIcon, Monitor, TestTube, X, ShieldCheck,
} from 'lucide-react';
import { clsx } from 'clsx';
import type { PageKey } from '../types';

type NavItem = { key: PageKey; label: string; icon: any };

const groups: { label: string; items: NavItem[] }[] = [
  {
    label: 'Menu Utama',
    items: [
      { key: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
      { key: 'schedules', label: 'Jadwal Bel', icon: Bell },
      { key: 'audio', label: 'Audio Library', icon: Music },
      { key: 'calendar', label: 'Kalender', icon: Calendar },
      { key: 'templates', label: 'Template', icon: LayoutTemplate },
    ],
  },
  {
    label: 'Operasional',
    items: [
      { key: 'monitor', label: 'Monitor Bel', icon: Monitor },
      { key: 'test', label: 'Test Bell', icon: TestTube },
      { key: 'history', label: 'Riwayat', icon: History },
    ],
  },
  {
    label: 'Sistem',
    items: [
      { key: 'settings', label: 'Pengaturan', icon: SettingsIcon },
    ],
  },
];

export function Sidebar() {
  const { page, setPage, sidebarOpen, setSidebarOpen } = useAppStore();

  return (
    <>
      {sidebarOpen && (
        <div className="lg:hidden fixed inset-0 bg-black/50 backdrop-blur-sm z-30" onClick={() => setSidebarOpen(false)} />
      )}
      <aside
        className={clsx(
          'fixed lg:static inset-y-0 left-0 z-40 w-72 bg-sidebar flex flex-col transition-transform duration-300',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0',
        )}
      >
        {/* Brand */}
        <div className="h-16 flex items-center justify-between px-5 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white shadow-pop flex items-center justify-center overflow-hidden">
              <img src="/icons/logo.png" alt="Logo" className="w-8 h-8 object-contain" />
            </div>
            <div>
              <div className="font-bold text-white leading-tight tracking-tight">Kastriva Bellmatic</div>
              <div className="text-[10px] font-medium text-primary-300 uppercase tracking-widest">Smart Bell System</div>
            </div>
          </div>
          <button className="lg:hidden p-1 text-slate-300 hover:text-white" onClick={() => setSidebarOpen(false)}>
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-4 py-5 space-y-6">
          {groups.map((g) => (
            <div key={g.label}>
              <div className="px-3 mb-2 text-[10px] font-semibold uppercase tracking-widest text-slate-500">
                {g.label}
              </div>
              <div className="space-y-1">
                {g.items.map((it) => {
                  const Icon = it.icon;
                  const active = page === it.key;
                  return (
                    <button
                      key={it.key}
                      onClick={() => setPage(it.key)}
                      className={clsx(
                        'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200',
                        active
                          ? 'bg-gradient-to-r from-primary-600 to-indigo-600 text-white shadow-lift'
                          : 'text-slate-400 hover:text-white hover:bg-white/5',
                      )}
                    >
                      <Icon className={clsx('w-[18px] h-[18px]', active ? 'text-white' : 'text-slate-500')} />
                      {it.label}
                      {active && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-emerald-400" />}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-white/10">
          <div className="rounded-xl bg-white/5 border border-white/10 p-3 flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-emerald-500/15 flex items-center justify-center">
              <ShieldCheck className="w-4.5 h-4.5 text-emerald-400" />
            </div>
            <div className="min-w-0">
              <div className="text-xs font-semibold text-white">Enterprise Edition</div>
              <div className="text-[10px] text-slate-400">v1.0 • Offline Ready</div>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
