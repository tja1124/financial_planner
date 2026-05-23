import { lazy, Suspense, useMemo } from 'react';
import type { AppData, FinancialSummary, Page } from '../types';
import { formatCurrency } from '../utils/calculations';
import { projectCashflow } from '../utils/cashflow';
import { getRecommendations } from '../utils/recommendations';
import { computeHealthScore } from '../utils/healthScore';
import { formatPayoffDuration } from '../utils/debtStrategies';
import { simulateDebtStrategy } from '../utils/debtStrategies';
import { StatCard } from '../components/StatCard';
import { CardHeader } from '../components/Card';
import { EmptyState } from '../components/EmptyState';
import { RecommendationCard } from '../components/RecommendationCard';
import { DashboardHero } from '../components/DashboardHero';
import { HealthScoreCard } from '../components/HealthScoreCard';
import { AnimatedCard } from '../components/motion/AnimatedCard';
import { FadeIn } from '../components/motion/FadeIn';
import { PageTransition } from '../components/motion/PageTransition';

const DashboardCharts = lazy(() =>
  import('./DashboardCharts').then((m) => ({ default: m.DashboardCharts })),
);

interface Props {
  data: AppData;
  summary: FinancialSummary;
  onNavigate?: (page: Page) => void;
}

function ChartSkeleton() {
  return (
    <div className="surface-card p-6 animate-pulse">
      <div className="h-4 w-40 bg-zinc-200 dark:bg-zinc-800 rounded mb-4" />
      <div className="h-[220px] sm:h-[260px] chart-well rounded-xl bg-zinc-100 dark:bg-zinc-900/50" />
    </div>
  );
}

export function DashboardPage({ data, summary, onNavigate }: Props) {
  const {
    totalMonthlyIncome,
    totalMonthlyExpenses,
    totalMonthlyDebtPayments,
    totalMonthlySavingsContributions,
    monthlyLeftover,
    safeWeeklySpending,
  } = summary;

  const isEmpty = data.income.length === 0 && data.expenses.length === 0;

  const cashflow = useMemo(() => projectCashflow(data, 12), [data]);
  const recommendations = useMemo(
    () => getRecommendations(data, summary),
    [data, summary],
  );
  const health = useMemo(() => computeHealthScore(data, summary), [data, summary]);
  const debtFreeMonths = useMemo(
    () => simulateDebtStrategy(data.debts, 'custom').payoffMonths,
    [data.debts],
  );

  // Emergency runway in months
  const efRunwayMonths = useMemo(() => {
    const efGoal = data.savingsGoals.find((g) => /emergency/i.test(g.name));
    const efCurrent = efGoal?.currentAmount ?? 0;
    if (totalMonthlyExpenses <= 0) return null;
    const months = efCurrent / totalMonthlyExpenses;
    return months > 0 ? months : null;
  }, [data.savingsGoals, totalMonthlyExpenses]);

  if (isEmpty) {
    return (
      <PageTransition>
        <AnimatedCard>
          <EmptyState
            icon="📊"
            title="Welcome to FinancePlanner"
            description="Load demo data to explore features, or add your income and expenses to build your personal plan."
            action={
              onNavigate && (
                <button
                  type="button"
                  onClick={() => onNavigate('income')}
                  className="text-sm font-semibold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
                >
                  Start with Income →
                </button>
              )
            }
          />
        </AnimatedCard>
      </PageTransition>
    );
  }

  const savingsRate =
    totalMonthlyIncome > 0
      ? Math.round((totalMonthlySavingsContributions / totalMonthlyIncome) * 100)
      : 0;

  const isOnTrack = monthlyLeftover >= 0;

  return (
    <PageTransition>
      <div className="page-stack-tight">
        <FadeIn>
          <DashboardHero
            isOnTrack={isOnTrack}
            monthlyLeftover={monthlyLeftover}
            safeWeeklySpending={safeWeeklySpending}
            savingsRate={savingsRate}
            debtFreeMonths={debtFreeMonths}
            efRunwayMonths={efRunwayMonths}
          />
        </FadeIn>

        <HealthScoreCard health={health} />

        {recommendations.length > 0 && (
          <AnimatedCard delay={0.04} hoverLift>
            <CardHeader title="Insights" subtitle="Prioritized for your plan" />
            <RecommendationCard recommendations={recommendations} onNavigate={onNavigate} />
          </AnimatedCard>
        )}

        <FadeIn delay={0.06}>
          <section>
            <h2 className="text-xs font-semibold uppercase tracking-wider text-muted mb-3 px-0.5">
              Key metrics
            </h2>
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-2.5 sm:gap-3">
              <StatCard label="Income" value={formatCurrency(totalMonthlyIncome)} color="green" />
              <StatCard label="Expenses" value={formatCurrency(totalMonthlyExpenses)} color="red" />
              <StatCard
                label="Leftover"
                value={formatCurrency(monthlyLeftover)}
                subtext={monthlyLeftover < 0 ? 'Over budget' : 'After obligations'}
                color={monthlyLeftover >= 0 ? 'blue' : 'red'}
                featured
              />
              <StatCard
                label="Weekly flex"
                value={formatCurrency(safeWeeklySpending)}
                subtext="Discretionary"
                color="green"
              />
              <StatCard
                label="Debt"
                value={formatCurrency(totalMonthlyDebtPayments)}
                subtext={
                  debtFreeMonths > 0 ? `Free in ${formatPayoffDuration(debtFreeMonths)}` : undefined
                }
                color="amber"
              />
              <StatCard
                label="Savings"
                value={formatCurrency(totalMonthlySavingsContributions)}
                subtext="Planned / mo"
                color="indigo"
              />
            </div>
          </section>
        </FadeIn>

        <Suspense
          fallback={
            <div className="space-y-4 sm:space-y-5">
              <ChartSkeleton />
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <ChartSkeleton />
                <ChartSkeleton />
              </div>
            </div>
          }
        >
          <DashboardCharts data={data} summary={summary} cashflow={cashflow} />
        </Suspense>

        {data.savingsGoals.length > 0 && (
          <AnimatedCard delay={0.12}>
            <CardHeader title="Savings Goals" />
            <div className="space-y-4">
              {data.savingsGoals.map((goal) => {
                const pct = Math.min(100, (goal.currentAmount / goal.targetAmount) * 100);
                return (
                  <div key={goal.id}>
                    <div className="flex justify-between text-sm mb-1.5">
                      <span className="font-medium text-primary">{goal.name}</span>
                      <span className="text-secondary tabular-nums">
                        {formatCurrency(goal.currentAmount)} / {formatCurrency(goal.targetAmount)}
                      </span>
                    </div>
                    <div className="h-2 bg-zinc-100 dark:bg-zinc-800/80 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${pct >= 100 ? 'bg-emerald-500' : 'bg-indigo-500'}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </AnimatedCard>
        )}
      </div>
    </PageTransition>
  );
}
