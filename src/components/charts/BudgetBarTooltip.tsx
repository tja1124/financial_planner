import { useChartTheme } from '../../hooks/useChartTheme';
import { formatCurrency } from '../../utils/calculations';
import type { BudgetBarDatum } from '../../utils/budgetBarBreakdown';

type Props = {
  active?: boolean;
  payload?: { payload?: BudgetBarDatum }[];
};

export function BudgetBarTooltip({ active, payload }: Props) {
  const chart = useChartTheme();

  if (!active || !payload?.length) return null;

  const row = payload[0]?.payload;
  if (!row) return null;

  const isLeftover = row.name === 'Leftover';
  const lines = isLeftover ? [] : row.lines;

  const { backgroundColor, border, borderRadius, boxShadow, padding } =
    chart.tooltip.contentStyle;
  const labelColor = chart.tooltip.labelStyle.color as string;
  const textColor = chart.tooltip.itemStyle.color as string;

  if (isLeftover) {
    return (
      <div
        className="chart-tooltip"
        style={{ backgroundColor, border, borderRadius, boxShadow, padding, minWidth: '9rem' }}
      >
        <p
          className="flex items-baseline justify-between gap-2 text-sm font-semibold"
          style={{ color: textColor }}
        >
          <span>Total</span>
          <span className="tabular-nums">{formatCurrency(row.amount)}</span>
        </p>
      </div>
    );
  }

  return (
    <div
      className="chart-tooltip"
      style={{
        backgroundColor,
        border,
        borderRadius,
        boxShadow,
        padding,
        minWidth: '11rem',
        maxWidth: '15rem',
      }}
    >
      {/* Header */}
      <p
        className="text-xs font-semibold mb-1.5 pb-1.5 border-b"
        style={{ color: labelColor, borderColor: chart.grid }}
      >
        {row.name}
      </p>

      {/* All line items — no scroll, auto height */}
      {lines.length > 0 && (
        <ul className="mb-1.5 space-y-1">
          {lines.map((line) => (
            <li
              key={line.name}
              className="grid grid-cols-[minmax(0,1fr)_auto] gap-x-3 items-baseline"
            >
              <span
                className="truncate text-xs"
                style={{ color: textColor }}
                title={line.name}
              >
                {line.name}
              </span>
              <span
                className="text-xs font-medium tabular-nums text-right whitespace-nowrap"
                style={{ color: textColor }}
              >
                {formatCurrency(line.amount)}
              </span>
            </li>
          ))}
        </ul>
      )}

      {/* Total */}
      <p
        className="flex items-baseline justify-between gap-2 text-sm font-semibold pt-1.5 border-t"
        style={{ color: textColor, borderColor: chart.grid }}
      >
        <span>Total</span>
        <span className="tabular-nums">{formatCurrency(row.amount)}</span>
      </p>
    </div>
  );
}
