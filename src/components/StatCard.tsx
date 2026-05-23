import { memo } from 'react';

interface StatCardProps {
  label: string;
  value: string;
  subtext?: string;
  color?: 'green' | 'red' | 'blue' | 'amber' | 'indigo' | 'slate';
  featured?: boolean;
}

const colorMap: Record<
  string,
  { bg: string; text: string; sub: string; border: string }
> = {
  green: {
    bg: 'bg-emerald-50 dark:bg-emerald-500/[0.08]',
    text: 'text-emerald-700 dark:text-emerald-300',
    sub: 'text-emerald-600 dark:text-emerald-400/90',
    border: 'border-emerald-200/60 dark:border-emerald-500/20',
  },
  red: {
    bg: 'bg-red-50 dark:bg-red-500/[0.08]',
    text: 'text-red-700 dark:text-red-300',
    sub: 'text-red-600 dark:text-red-400/90',
    border: 'border-red-200/60 dark:border-red-500/20',
  },
  blue: {
    bg: 'bg-blue-50 dark:bg-blue-500/[0.08]',
    text: 'text-blue-700 dark:text-blue-300',
    sub: 'text-blue-600 dark:text-blue-400/90',
    border: 'border-blue-200/60 dark:border-blue-500/20',
  },
  amber: {
    bg: 'bg-amber-50 dark:bg-amber-500/[0.08]',
    text: 'text-amber-700 dark:text-amber-300',
    sub: 'text-amber-600 dark:text-amber-400/90',
    border: 'border-amber-200/60 dark:border-amber-500/20',
  },
  indigo: {
    bg: 'bg-indigo-50 dark:bg-indigo-500/[0.08]',
    text: 'text-indigo-700 dark:text-indigo-300',
    sub: 'text-indigo-600 dark:text-indigo-400/90',
    border: 'border-indigo-200/60 dark:border-indigo-500/20',
  },
  slate: {
    bg: 'bg-white dark:bg-[var(--surface-secondary)]',
    text: 'text-slate-800 dark:text-zinc-100',
    sub: 'text-slate-500 dark:text-zinc-400',
    border: 'border-slate-200/80 dark:border-white/[0.08]',
  },
};

export const StatCard = memo(function StatCard({
  label,
  value,
  subtext,
  color = 'slate',
  featured,
}: StatCardProps) {
  const c = colorMap[color];
  return (
    <div
      className={`${c.bg} ${c.border} border rounded-2xl p-5 sm:p-6 transition-all duration-200 hover:shadow-md dark:hover:shadow-[0_4px_20px_rgba(0,0,0,0.25)] ${
        featured ? 'sm:col-span-2 lg:col-span-1' : ''
      }`}
    >
      <p className="text-[11px] font-semibold uppercase tracking-wider text-muted mb-2.5">
        {label}
      </p>
      <p className={`text-2xl sm:text-3xl font-bold tracking-tight ${c.text}`}>{value}</p>
      {subtext && <p className={`text-xs mt-2 ${c.sub}`}>{subtext}</p>}
    </div>
  );
});
