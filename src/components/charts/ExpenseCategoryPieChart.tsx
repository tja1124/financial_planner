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

/** Canonical slice model — single source for pie sectors and visible legend. */
interface ChartCategorySlice {
  id: string;
  name: string;
  value: number;
  total: number;
  color: string;
}

interface Props {
  data: ExpensePieDatum[];
  chart: ChartTheme;
}

function buildChartData(
  data: ExpensePieDatum[],
  chart: ChartTheme,
): ChartCategorySlice[] {
  const total =
    data[0]?.total ?? data.reduce((sum, d) => sum + d.value, 0);
  return [...data]
    .sort((a, b) => b.value - a.value)
    .map((d, index) => ({
      id: d.name,
      name: d.name,
      value: d.value,
      total,
      color: chart.pieColor(index),
    }));
}

function categoryIdFromSector(
  sector: { id?: string; name?: string } | undefined,
  chartData: ChartCategorySlice[],
  fallbackIndex: number,
): string | null {
  if (sector?.id) return sector.id;
  if (sector?.name) {
    const match = chartData.find((c) => c.name === sector.name);
    if (match) return match.id;
  }
  const fallback = chartData[fallbackIndex];
  return fallback?.id ?? null;
}

export function ExpenseCategoryPieChart({ data, chart }: Props) {
  const chartData = useMemo(() => buildChartData(data, chart), [data, chart]);

  const [activeCategoryId, setActiveCategoryId] = useState<string | null>(null);

  const clearActive = useCallback(() => setActiveCategoryId(null), []);

  const activeSlice = useMemo(
    () => chartData.find((c) => c.id === activeCategoryId),
    [chartData, activeCategoryId],
  );

  const tooltipPayload = useMemo(() => {
    if (!activeSlice) return undefined;
    return [
      {
        name: activeSlice.name,
        value: activeSlice.value,
        payload: {
          name: activeSlice.name,
          value: activeSlice.value,
          total: activeSlice.total,
        },
        color: activeSlice.color,
      },
    ];
  }, [activeSlice]);

  if (chartData.length === 0) return null;

  return (
    <div
      className="flex flex-col h-full w-full min-h-0"
      onMouseLeave={clearActive}
    >
      {/* Donut — fixed height so legend is never clipped */}
      <div className="relative h-[200px] w-full shrink-0">
        {activeSlice && tooltipPayload && (
          <div className="absolute top-2 right-2 z-10 pointer-events-none">
            <PieChartTooltip active payload={tooltipPayload} />
          </div>
        )}

        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chartData}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="48%"
              innerRadius={50}
              outerRadius={82}
              paddingAngle={2}
              onMouseEnter={(sector, fallbackIndex) => {
                const id = categoryIdFromSector(
                  sector as { id?: string; name?: string },
                  chartData,
                  fallbackIndex,
                );
                if (id) setActiveCategoryId(id);
              }}
            >
              {chartData.map((item) => {
                const isActive = activeCategoryId === item.id;
                const dimmed = activeCategoryId != null && !isActive;
                return (
                  <Cell
                    key={item.id}
                    fill={item.color}
                    stroke={isActive ? item.color : 'transparent'}
                    strokeWidth={isActive ? 2 : 0}
                    opacity={dimmed ? 0.4 : 1}
                  />
                );
              })}
            </Pie>
            <Tooltip content={() => null} />
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* Legend — same chartData as pie; names only */}
      <ul
        className="shrink-0 flex flex-wrap justify-center gap-x-4 gap-y-2 pt-2 pb-1"
        aria-label="Expense categories"
      >
        {chartData.map((item) => {
          const isActive = activeCategoryId === item.id;
          const dimmed = activeCategoryId != null && !isActive;
          return (
            <li key={item.id}>
              <button
                type="button"
                className={`inline-flex items-center gap-1.5 text-xs font-medium transition-opacity cursor-pointer accent-ring rounded px-1 py-0.5 max-w-full ${
                  dimmed ? 'opacity-45' : 'opacity-100'
                } ${isActive ? 'text-indigo-600 dark:text-indigo-400' : 'text-secondary'}`}
                onMouseEnter={() => setActiveCategoryId(item.id)}
                onFocus={() => setActiveCategoryId(item.id)}
                onBlur={clearActive}
              >
                <span
                  className="w-2 h-2 rounded-full shrink-0"
                  style={{ backgroundColor: item.color }}
                  aria-hidden
                />
                <span className="truncate">{item.name}</span>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
