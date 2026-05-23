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
    <div className="flex justify-between items-center py-2.5 border-b border-[var(--border-subtle)] last:border-0">
      <span className="text-sm text-secondary">{label}</span>
      <span
        className={`text-sm font-semibold tabular-nums ${
          highlight ? 'text-indigo-600 dark:text-indigo-300' : 'text-primary'
        }`}
      >
        {display}
      </span>
    </div>
  );
}
