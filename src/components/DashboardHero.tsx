import { formatCurrency } from '../utils/calculations';
import { formatPayoffDuration } from '../utils/debtStrategies';
import { StatusIndicator } from './icons';

interface Props {
  isOnTrack: boolean;
  monthlyLeftover: number;
  safeWeeklySpending: number;
  savingsRate: number;
  debtFreeMonths: number;
  efRunwayMonths: number | null;
}

export function DashboardHero({
  isOnTrack,
  monthlyLeftover,
  safeWeeklySpending,
  savingsRate,
  debtFreeMonths,
  efRunwayMonths,
}: Props) {
  const weeklyShortfall = monthlyLeftover < 0 ? Math.abs(monthlyLeftover) / 4.33 : 0;
  const weeklyFlexAmount = isOnTrack ? safeWeeklySpending : weeklyShortfall;
  const netLabel = isOnTrack
    ? `+${formatCurrency(monthlyLeftover)}`
    : `−${formatCurrency(Math.abs(monthlyLeftover))}`;

  const supportingLine = isOnTrack
    ? safeWeeklySpending > 0
      ? `About ${formatCurrency(safeWeeklySpending)}/week remains for flexible spending after obligations.`
      : 'No weekly flex remains after obligations.'
    : `You are short by about ${formatCurrency(weeklyShortfall)}/week after obligations.`;

  return (
    <section
      data-tour="dashboard-hero"
      className={`dashboard-hero surface-card overflow-hidden ${
        isOnTrack ? 'dashboard-hero--positive' : 'dashboard-hero--caution'
      }`}
    >
      <div className="dashboard-hero__edge" aria-hidden />

      <div className="px-5 py-5 sm:px-6 sm:py-6">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-stretch sm:gap-6">
          <div className="min-w-0 flex-1">
            <StatusIndicator
              tone={isOnTrack ? 'healthy' : 'warning'}
              className="mb-4"
            >
              {isOnTrack ? 'On track' : 'Needs attention'}
            </StatusIndicator>

            <h1
              className={`text-2xl sm:text-[1.75rem] font-semibold tabular-nums tracking-tight leading-none ${
                isOnTrack
                  ? 'text-emerald-700 dark:text-emerald-400'
                  : 'text-rose-600 dark:text-rose-400'
              }`}
            >
              {netLabel}
              <span className="text-lg sm:text-xl font-medium text-secondary ml-1.5">
                net / month
              </span>
            </h1>

            <p className="text-sm text-secondary leading-relaxed mt-2.5 max-w-md">
              {supportingLine}
            </p>
          </div>

          <div className="dashboard-hero-flex shrink-0 sm:w-[10.5rem] sm:self-center">
            <p className="text-[10px] font-medium uppercase tracking-[0.07em] text-indigo-600/80 dark:text-indigo-400/90">
              Weekly flex
            </p>
            <p className="text-2xl sm:text-[1.65rem] font-semibold text-primary tabular-nums tracking-tight mt-1.5 leading-none">
              {formatCurrency(weeklyFlexAmount)}
            </p>
            <p className="text-[11px] text-muted mt-1.5">
              {isOnTrack ? 'per week' : 'weekly shortfall'}
            </p>
          </div>
        </div>

        <div className="mt-5 pt-4 border-t border-[var(--border-subtle)]">
          <div className="flex flex-wrap gap-2">
            <SecondaryPill label="Savings rate" value={`${savingsRate}%`} />
            {debtFreeMonths > 0 && (
              <SecondaryPill label="Debt-free in" value={formatPayoffDuration(debtFreeMonths)} />
            )}
            {efRunwayMonths !== null && (
              <SecondaryPill label="Emergency runway" value={`${efRunwayMonths.toFixed(1)} mo`} />
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

function SecondaryPill({ label, value }: { label: string; value: string }) {
  return (
    <div className="dashboard-hero-pill flex flex-col justify-center px-3 py-2 rounded-lg min-h-[2.75rem]">
      <p className="text-[10px] font-medium uppercase tracking-wide text-caption leading-none">
        {label}
      </p>
      <p className="text-sm font-medium text-secondary tabular-nums mt-1 leading-none">
        {value}
      </p>
    </div>
  );
}
