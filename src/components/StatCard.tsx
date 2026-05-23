interface StatCardProps {
  label: string;
  value: string;
  subtext?: string;
  color?: 'green' | 'red' | 'blue' | 'amber' | 'indigo' | 'slate';
  featured?: boolean;
}

const colorMap: Record<string, { bg: string; text: string; sub: string; ring?: string }> = {
  green: { bg: 'bg-emerald-50', text: 'text-emerald-700', sub: 'text-emerald-600' },
  red: { bg: 'bg-red-50', text: 'text-red-700', sub: 'text-red-500' },
  blue: { bg: 'bg-blue-50', text: 'text-blue-700', sub: 'text-blue-500' },
  amber: { bg: 'bg-amber-50', text: 'text-amber-700', sub: 'text-amber-600' },
  indigo: { bg: 'bg-indigo-50', text: 'text-indigo-700', sub: 'text-indigo-500' },
  slate: { bg: 'bg-white', text: 'text-slate-800', sub: 'text-slate-500', ring: 'ring-1 ring-slate-100' },
};

export function StatCard({ label, value, subtext, color = 'slate', featured }: StatCardProps) {
  const c = colorMap[color];
  return (
    <div
      className={`${c.bg} ${c.ring ?? ''} rounded-2xl p-5 transition-shadow hover:shadow-sm ${
        featured ? 'sm:col-span-2 lg:col-span-1' : ''
      }`}
    >
      <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-2">
        {label}
      </p>
      <p className={`text-2xl sm:text-3xl font-bold tracking-tight ${c.text}`}>{value}</p>
      {subtext && <p className={`text-xs mt-1.5 ${c.sub}`}>{subtext}</p>}
    </div>
  );
}
