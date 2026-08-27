import { clsx } from 'clsx';
import type { ButtonHTMLAttributes, ReactNode } from 'react';

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'success';
  size?: 'sm' | 'md' | 'lg';
  children: ReactNode;
}

export function Button({ variant = 'primary', size = 'md', className, children, ...rest }: Props) {
  const variants = {
    primary: 'bg-gradient-to-r from-primary-600 to-indigo-600 hover:opacity-90 text-white shadow-pop',
    secondary: 'bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 shadow-card',
    danger: 'bg-gradient-to-r from-rose-600 to-red-600 hover:opacity-90 text-white shadow-pop',
    success: 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:opacity-90 text-white shadow-pop',
    ghost: 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300',
  };
  const sizes = {
    sm: 'px-2.5 py-1.5 text-xs rounded-lg',
    md: 'px-4 py-2 text-sm rounded-xl',
    lg: 'px-6 py-3 text-base rounded-xl',
  };
  return (
    <button
      {...rest}
      className={clsx(
        'inline-flex items-center justify-center gap-2 font-semibold transition-all duration-200 active:scale-[.98]',
        'disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-1 dark:focus:ring-offset-slate-900',
        variants[variant],
        sizes[size],
        className,
      )}
    >
      {children}
    </button>
  );
}
