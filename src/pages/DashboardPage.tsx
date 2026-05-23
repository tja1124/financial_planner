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
import { PageHeader } from '../components/PageHeader';
import { EmptyState } from '../components/EmptyState';
import { RecommendationCard } from '../components/RecommendationCard';
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

  if (isEmpty) {
    return (
      <PageTransition>
        <PageHeader
          title="Dashboard"
          subtitle="Your complete financial picture — budget, forecast, and next steps."
        />
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

  return (
    <PageTransition>
      <div className="page-stack-tight">
        <FadeIn>
          <section className="dashboard-hero surface-card p-5 sm:p-7">
            <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-5">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-muted mb-2">
                  Overview
                </p>
                <h1 className="text-2xl sm:text-3xl font-bold text-primary tracking-tight">
                  {monthlyLeftover >= 0 ? 'On track' : 'Needs attention'}
                </h1>
                <p className="text-sm text-secondary mt-2 max-w-md leading-relaxed">
                  {monthlyLeftover >= 0
                    ? `${formatCurrency(monthlyLeftover)} left each month after obligations.`
                    : `${formatCurrency(Math.abs(monthlyLeftover))} over budget — review expenses and debt.`}
                </p>
              </div>
              <div className="flex flex-wrap gap-2 sm:gap-3">
                <HeroPill label="Weekly safe" value={formatCurrency(safeWeeklySpending)} />
                <HeroPill label="Savings rate" value={`${savingsRate}%`} />
                {debtFreeMonths > 0 && (
                  <HeroPill label="Debt-free" value={formatPayoffDuration(debtFreeMonths)} />
                )}
              </div>
            </div>
          </section>
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
                label="Safe weekly"
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

function HeroPill({ label, value }: { label: string; value: string }) {
  return (
    <div className="surface-muted px-3.5 py-2.5 rounded-xl min-w-[7rem]">
      <p className="text-[10px] font-semibold uppercase tracking-wide text-muted">{label}</p>
      <p className="text-sm font-bold text-primary tabular-nums mt-0.5">{value}</p>
    </div>
  );
}
