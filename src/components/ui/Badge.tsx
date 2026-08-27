import { clsx } from 'clsx';

type Variant = 'default' | 'success' | 'warning' | 'danger' | 'info' | 'neutral';

export function Badge({ children, variant = 'default' }: { children: React.ReactNode; variant?: Variant }) {
  const map: Record<Variant, string> = {
    default: 'bg-primary-50 text-primary-700 border-primary-200 dark:bg-primary-900/30 dark:text-primary-300 dark:border-primary-800',
    success: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-800',
    warning: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-800',
    danger: 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-900/30 dark:text-rose-300 dark:border-rose-800',
    info: 'bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-900/30 dark:text-sky-300 dark:border-sky-800',
    neutral: 'bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700',
  };
  return (
    <span className={clsx('inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold border', map[variant])}>
      {children}
    </span>
  );
}
