import { useCallback, useMemo, useState } from 'react';
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';
import { PieChartTooltip } from './PieChartTooltip';
import type { useChartTheme } from '../../hooks/useChartTheme';

export type ExpensePieDatum = {
  name: string;
  value: number;
  total: number;
};

type ChartTheme = ReturnType<typeof useChartTheme>;

interface Props {
  data: ExpensePieDatum[];
  chart: ChartTheme;
}

/** Resolve pie sector index from Recharts mouse event data (never rely on legend payload order). */
function sectorIndex(
  data: ExpensePieDatum[],
  sector: { name?: string } | undefined,
  fallbackIndex: number,
): number {
  if (!sector?.name) return fallbackIndex;
  const idx = data.findIndex((d) => d.name === sector.name);
  return idx >= 0 ? idx : fallbackIndex;
}

export function ExpenseCategoryPieChart({ data, chart }: Props) {
  const [activeIndex, setActiveIndex] = useState<number | undefined>(undefined);

  const clearActive = useCallback(() => setActiveIndex(undefined), []);
  const setActive = useCallback((index: number) => setActiveIndex(index), []);

  const activeDatum = activeIndex != null ? data[activeIndex] : undefined;

  const tooltipPayload = useMemo(() => {
    if (!activeDatum || activeIndex == null) return undefined;
    return [
      {
        name: activeDatum.name,
        value: activeDatum.value,
        payload: activeDatum,
        color: chart.pieColor(activeIndex),
      },
    ];
  }, [activeDatum, activeIndex, chart]);

  if (data.length === 0) return null;

  return (
    <div
      className="relative w-full h-full min-h-[200px]"
      onMouseLeave={clearActive}
    >
      {activeDatum && tooltipPayload && (
        <div className="absolute top-2 right-2 z-10 pointer-events-none">
          <PieChartTooltip active payload={tooltipPayload} />
        </div>
      )}

      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            nameKey="name"
            cx="50%"
            cy="48%"
            innerRadius={50}
            outerRadius={82}
            paddingAngle={2}
            dataKey="value"
            onMouseEnter={(sector, fallbackIndex) =>
              setActive(sectorIndex(data, sector, fallbackIndex))
            }
          >
            {data.map((datum, index) => {
              const isActive = activeIndex === index;
              const dimmed = activeIndex != null && !isActive;
              return (
                <Cell
                  key={datum.name}
                  fill={chart.pieColor(index)}
                  stroke={isActive ? chart.pieColor(index) : 'transparent'}
                  strokeWidth={isActive ? 2 : 0}
                  opacity={dimmed ? 0.4 : 1}
                />
              );
            })}
          </Pie>
          <Tooltip content={() => null} />
        </PieChart>
      </ResponsiveContainer>

      {/* Legend driven by the same `data` array order as pie sectors */}
      <ul
        className="flex flex-wrap justify-center gap-x-4 gap-y-2 pt-2"
        aria-label="Expense categories"
      >
        {data.map((datum, index) => {
          const isActive = activeIndex === index;
          const dimmed = activeIndex != null && !isActive;
          return (
            <li key={datum.name}>
              <button
                type="button"
                className={`inline-flex items-center gap-1.5 text-xs font-medium transition-opacity cursor-pointer accent-ring rounded px-1 py-0.5 ${
                  dimmed ? 'opacity-45' : 'opacity-100'
                } ${isActive ? 'text-indigo-600 dark:text-indigo-400' : 'text-secondary'}`}
                onMouseEnter={() => setActive(index)}
                onFocus={() => setActive(index)}
                onBlur={clearActive}
              >
                <span
                  className="w-2 h-2 rounded-full shrink-0"
                  style={{ backgroundColor: chart.pieColor(index) }}
                  aria-hidden
                />
                {datum.name}
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
