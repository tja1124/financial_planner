import { useChartTheme } from '../../hooks/useChartTheme';
import { formatCurrency } from '../../utils/calculations';
import type { ChartTooltipEntry, ChartTooltipProps } from './ChartTooltip';

type PieSlice = {
  name?: string;
  value?: number;
  total?: number;
};

export function PieChartTooltip({ active, payload }: ChartTooltipProps) {
  const chart = useChartTheme();

  if (!active || !payload?.length) return null;

  const entry = payload[0] as ChartTooltipEntry & { payload?: PieSlice };
  const slice = entry.payload ?? {};
  const name = slice.name ?? String(entry.name ?? 'Category');
  const value = Number(slice.value ?? entry.value ?? 0);
  const total = Number(slice.total ?? 0);
  const pct = total > 0 ? (value / total) * 100 : 0;

  const { backgroundColor, border, borderRadius, boxShadow, padding } = chart.tooltip.contentStyle;
  const labelColor = chart.tooltip.labelStyle.color as string;
  const textColor = chart.tooltip.itemStyle.color as string;
  const swatch = entry.color ?? chart.pieColor(0);

  return (
    <div
      className="chart-tooltip"
      style={{ backgroundColor, border, borderRadius, boxShadow, padding, minWidth: '9rem' }}
    >
      <div className="flex items-center gap-2 mb-2">
        <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: swatch }} />
        <p className="text-sm font-semibold" style={{ color: textColor }}>
          {name}
        </p>
      </div>
      <div className="space-y-1 text-sm">
        <div className="flex justify-between gap-4">
          <span style={{ color: labelColor }}>Amount</span>
          <span className="font-semibold tabular-nums" style={{ color: textColor }}>
            {formatCurrency(value)}
          </span>
        </div>
        <div className="flex justify-between gap-4">
          <span style={{ color: labelColor }}>Share</span>
          <span className="font-semibold tabular-nums" style={{ color: textColor }}>
            {pct.toFixed(1)}%
          </span>
        </div>
      </div>
    </div>
  );
}
