import { useState, useCallback, useMemo } from 'react';
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
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

export function ExpenseCategoryPieChart({ data, chart }: Props) {
  const [activeIndex, setActiveIndex] = useState<number | undefined>(undefined);

  const clearActive = useCallback(() => setActiveIndex(undefined), []);

  const tooltipPayload = useMemo(() => {
    if (activeIndex == null || !data[activeIndex]) return undefined;
    const slice = data[activeIndex];
    return [
      {
        name: slice.name,
        value: slice.value,
        payload: slice,
        color: chart.pieColor(activeIndex),
      },
    ];
  }, [activeIndex, data, chart]);

  const renderLegend = useCallback(
    (props: { payload?: ReadonlyArray<{ value?: string; color?: string }> }) => {
      const items = props.payload ?? [];
      return (
        <ul className="flex flex-wrap justify-center gap-x-4 gap-y-2 pt-2">
          {items.map((entry, index) => {
            const isActive = activeIndex === index;
            const dimmed = activeIndex != null && !isActive;
            return (
              <li key={String(entry.value)}>
                <button
                  type="button"
                  className={`inline-flex items-center gap-1.5 text-xs font-medium transition-opacity cursor-pointer accent-ring rounded px-1 py-0.5 ${
                    dimmed ? 'opacity-45' : 'opacity-100'
                  } ${isActive ? 'text-indigo-600 dark:text-indigo-400' : 'text-secondary'}`}
                  onMouseEnter={() => setActiveIndex(index)}
                  onMouseLeave={clearActive}
                  onFocus={() => setActiveIndex(index)}
                  onBlur={clearActive}
                >
                  <span
                    className="w-2 h-2 rounded-full shrink-0"
                    style={{ backgroundColor: entry.color }}
                  />
                  {entry.value}
                </button>
              </li>
            );
          })}
        </ul>
      );
    },
    [activeIndex, clearActive],
  );

  return (
    <div className="relative w-full h-full min-h-[200px]">
      {/* Fixed top-right tooltip — never overlaps the donut or legend */}
      {activeIndex != null && tooltipPayload && (
        <div className="absolute top-2 right-2 z-10 pointer-events-none">
          <PieChartTooltip active payload={tooltipPayload} />
        </div>
      )}

      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="48%"
            innerRadius={50}
            outerRadius={82}
            paddingAngle={2}
            dataKey="value"
            onMouseEnter={(_, index) => setActiveIndex(index)}
            onMouseLeave={clearActive}
          >
            {data.map((_, i) => (
              <Cell
                key={i}
                fill={chart.pieColor(i)}
                stroke={activeIndex === i ? chart.pieColor(i) : 'transparent'}
                strokeWidth={activeIndex === i ? 2 : 0}
                opacity={activeIndex == null || activeIndex === i ? 1 : 0.4}
              />
            ))}
          </Pie>
          <Tooltip content={() => null} />
          <Legend content={renderLegend} wrapperStyle={chart.legendStyle} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
