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

  const { backgroundColor, border, borderRadius, boxShadow, padding } =
    chart.tooltip.contentStyle;
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
        minWidth: '10rem',
        maxWidth: '16rem',
      }}
    >
      <p
        className="text-xs font-semibold mb-2 pb-2 border-b"
        style={{ color: labelColor, borderColor: chart.grid }}
      >
        {row.name}
      </p>
      {row.lines.length > 0 ? (
        <ul className="space-y-1.5 mb-2">
          {row.lines.map((line) => (
            <li
              key={line.name}
              className="flex items-baseline justify-between gap-3 text-sm"
            >
              <span className="truncate min-w-0" style={{ color: textColor }}>
                {line.name}
              </span>
              <span
                className="font-medium tabular-nums shrink-0"
                style={{ color: textColor }}
              >
                {formatCurrency(line.amount)}
              </span>
            </li>
          ))}
        </ul>
      ) : null}
      <p
        className="flex items-baseline justify-between gap-3 text-sm font-semibold pt-2 border-t"
        style={{ color: textColor, borderColor: chart.grid }}
      >
        <span>Total</span>
        <span className="tabular-nums">{formatCurrency(row.amount)}</span>
      </p>
    </div>
  );
}
