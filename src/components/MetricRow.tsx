import { formatCurrency } from '../utils/calculations';

interface MetricRowProps {
  label: string;
  value: number | string;
  format?: 'currency' | 'text';
  highlight?: boolean;
}

export function MetricRow({ label, value, format = 'currency', highlight }: MetricRowProps) {
  const display =
    format === 'currency' && typeof value === 'number'
      ? formatCurrency(value)
      : String(value);

  return (
    <div className="flex justify-between items-center py-2 border-b border-slate-50 last:border-0">
      <span className="text-sm text-slate-600">{label}</span>
      <span
        className={`text-sm font-semibold tabular-nums ${
          highlight ? 'text-indigo-600' : 'text-slate-800'
        }`}
      >
        {display}
      </span>
    </div>
  );
}
