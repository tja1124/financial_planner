interface StatCardProps {
  label: string;
  value: string;
  subtext?: string;
  color?: 'green' | 'red' | 'blue' | 'amber' | 'indigo' | 'slate';
}

const colorMap: Record<string, { bg: string; text: string; sub: string }> = {
  green: { bg: 'bg-emerald-50', text: 'text-emerald-700', sub: 'text-emerald-500' },
  red: { bg: 'bg-red-50', text: 'text-red-600', sub: 'text-red-400' },
  blue: { bg: 'bg-blue-50', text: 'text-blue-700', sub: 'text-blue-500' },
  amber: { bg: 'bg-amber-50', text: 'text-amber-700', sub: 'text-amber-500' },
  indigo: { bg: 'bg-indigo-50', text: 'text-indigo-700', sub: 'text-indigo-500' },
  slate: { bg: 'bg-slate-50', text: 'text-slate-700', sub: 'text-slate-500' },
};

export function StatCard({ label, value, subtext, color = 'slate' }: StatCardProps) {
  const c = colorMap[color];
  return (
    <div className={`${c.bg} rounded-2xl p-5`}>
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-1">{label}</p>
      <p className={`text-2xl font-bold ${c.text}`}>{value}</p>
      {subtext && <p className={`text-xs mt-1 ${c.sub}`}>{subtext}</p>}
    </div>
  );
}
