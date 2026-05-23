interface StatCardProps {
  label: string;
  value: string;
  subtext?: string;
  color?: 'green' | 'red' | 'blue' | 'amber' | 'indigo' | 'slate';
  featured?: boolean;
}

const colorMap: Record<string, { bg: string; text: string; sub: string; ring?: string }> = {
  green: {
    bg: 'bg-emerald-50 dark:bg-emerald-950/40',
    text: 'text-emerald-700 dark:text-emerald-400',
    sub: 'text-emerald-600 dark:text-emerald-500',
  },
  red: {
    bg: 'bg-red-50 dark:bg-red-950/40',
    text: 'text-red-700 dark:text-red-400',
    sub: 'text-red-500 dark:text-red-400/80',
  },
  blue: {
    bg: 'bg-blue-50 dark:bg-blue-950/40',
    text: 'text-blue-700 dark:text-blue-400',
    sub: 'text-blue-500 dark:text-blue-400/80',
  },
  amber: {
    bg: 'bg-amber-50 dark:bg-amber-950/40',
    text: 'text-amber-700 dark:text-amber-400',
    sub: 'text-amber-600 dark:text-amber-500',
  },
  indigo: {
    bg: 'bg-indigo-50 dark:bg-indigo-950/40',
    text: 'text-indigo-700 dark:text-indigo-400',
    sub: 'text-indigo-500 dark:text-indigo-400/80',
  },
  slate: {
    bg: 'bg-white dark:bg-slate-900',
    text: 'text-slate-800 dark:text-slate-100',
    sub: 'text-slate-500 dark:text-slate-400',
    ring: 'ring-1 ring-slate-100 dark:ring-slate-700',
  },
};

export function StatCard({ label, value, subtext, color = 'slate', featured }: StatCardProps) {
  const c = colorMap[color];
  return (
    <div
      className={`${c.bg} ${c.ring ?? ''} rounded-2xl p-5 transition-shadow hover:shadow-sm dark:hover:shadow-none ${
        featured ? 'sm:col-span-2 lg:col-span-1' : ''
      }`}
    >
      <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
        {label}
      </p>
      <p className={`text-2xl sm:text-3xl font-bold tracking-tight ${c.text}`}>{value}</p>
      {subtext && <p className={`text-xs mt-1.5 ${c.sub}`}>{subtext}</p>}
    </div>
  );
}
