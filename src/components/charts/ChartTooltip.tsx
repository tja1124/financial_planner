import { useChartTheme } from '../../hooks/useChartTheme';
import { formatCurrency } from '../../utils/calculations';

export type ChartTooltipEntry = {
  name?: string | number;
  value?: number | string;
  color?: string;
  dataKey?: string | number;
};

export type ChartTooltipProps = {
  active?: boolean;
  label?: string | number;
  payload?: ChartTooltipEntry[];
  valueFormatter?: (value: number, name: string) => string;
  formatLabel?: (label: string | number) => string;
  filterNull?: boolean;
};

export function ChartTooltip({
  active,
  payload,
  label,
  valueFormatter = (v) => formatCurrency(v),
  formatLabel,
  filterNull = true,
}: ChartTooltipProps) {
  const chart = useChartTheme();

  if (!active || !payload?.length) return null;

  const items = filterNull
    ? payload.filter(
        (p) => p.value != null && p.value !== '' && !Number.isNaN(Number(p.value)),
      )
    : payload;

  if (items.length === 0) return null;

  const displayLabel =
    label != null
      ? formatLabel
        ? formatLabel(label)
        : String(label)
      : null;

  const { backgroundColor, border, borderRadius, boxShadow, padding } = chart.tooltip.contentStyle;
  const labelColor = chart.tooltip.labelStyle.color as string;
  const textColor = chart.tooltip.itemStyle.color as string;

  return (
    <div
      className="chart-tooltip"
      style={{
        backgroundColor,
        border,
        borderRadius,
        boxShadow,
        padding,
        minWidth: '8rem',
      }}
    >
      {displayLabel && (
        <p
          className="text-xs font-semibold mb-2 pb-2 border-b"
          style={{ color: labelColor, borderColor: chart.grid }}
        >
          {displayLabel}
        </p>
      )}
      <ul className="space-y-2">
        {items.map((entry) => {
          const num = Number(entry.value);
          const name = String(entry.name ?? '');
          return (
            <li key={`${name}-${String(entry.dataKey)}`} className="flex items-center justify-between gap-4 text-sm">
              <span className="flex items-center gap-2 min-w-0">
                <span
                  className="w-2.5 h-2.5 rounded-full shrink-0"
                  style={{ backgroundColor: entry.color ?? chart.series.savings }}
                />
                <span className="truncate" style={{ color: textColor }}>
                  {name}
                </span>
              </span>
              <span className="font-semibold tabular-nums shrink-0" style={{ color: textColor }}>
                {valueFormatter(num, name)}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
