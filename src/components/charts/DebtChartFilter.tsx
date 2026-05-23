import type { ReactNode } from 'react';
import type { Debt } from '../../types';

interface Props {
  debts: Debt[];
  visibleIds: Set<string>;
  onChange: (ids: Set<string>) => void;
  debtColor: (index: number) => string;
}

export function DebtChartFilter({ debts, visibleIds, onChange, debtColor }: Props) {
  const allVisible = debts.length > 0 && debts.every((d) => visibleIds.has(d.id));
  const noneVisible = debts.every((d) => !visibleIds.has(d.id));

  function setAll(visible: boolean) {
    onChange(visible ? new Set(debts.map((d) => d.id)) : new Set());
  }

  function toggle(id: string) {
    const next = new Set(visibleIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    onChange(next);
  }

  function isolate(id: string) {
    onChange(new Set([id]));
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs font-medium text-muted mr-1">Show:</span>
        <FilterChip active={allVisible} onClick={() => setAll(true)}>
          All debts
        </FilterChip>
        <FilterChip active={noneVisible} onClick={() => setAll(false)}>
          None
        </FilterChip>
      </div>

      <div className="flex flex-wrap gap-2">
        {debts.map((debt, i) => {
          const visible = visibleIds.has(debt.id);
          const color = debtColor(i);
          return (
            <div key={debt.id} className="flex items-center gap-0.5">
              <button
                type="button"
                onClick={() => toggle(debt.id)}
                className={`px-2.5 py-1.5 rounded-l-lg text-xs font-medium border transition-all cursor-pointer ${
                  visible
                    ? 'bg-indigo-500/15 text-indigo-700 dark:text-indigo-300 border-indigo-500/30'
                    : 'surface-muted text-muted border-[var(--border-subtle)] opacity-60'
                }`}
                aria-pressed={visible}
              >
                <span
                  className="inline-block w-2 h-2 rounded-full mr-1.5 align-middle"
                  style={{ backgroundColor: color }}
                />
                {debt.name}
              </button>
              <button
                type="button"
                onClick={() => isolate(debt.id)}
                title={`Show only ${debt.name}`}
                className="px-2 py-1.5 rounded-r-lg text-[10px] font-semibold border border-l-0 border-[var(--border-subtle)] surface-muted text-muted hover:text-primary cursor-pointer transition-colors"
              >
                Only
              </button>
            </div>
          );
        })}
      </div>

      {visibleIds.size === 0 && (
        <p className="text-xs text-amber-700 dark:text-amber-300 bg-amber-500/10 border border-amber-500/20 rounded-lg px-3 py-2">
          Select at least one debt to display the chart.
        </p>
      )}
    </div>
  );
}

function FilterChip({
  children,
  active,
  onClick,
}: {
  children: ReactNode;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors cursor-pointer ${
        active
          ? 'bg-indigo-600 text-white border-indigo-600 dark:bg-indigo-500'
          : 'surface-muted text-secondary border-[var(--border-subtle)] hover:border-indigo-500/30'
      }`}
    >
      {children}
    </button>
  );
}
