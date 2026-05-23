import { useMemo } from 'react';
import type { AppData, FinancialSummary, Page } from '../types';
import { formatCurrency } from '../utils/calculations';
import { projectCashflow } from '../utils/cashflow';
import { getRecommendations } from '../utils/recommendations';
import { formatPayoffDuration } from '../utils/debtStrategies';
import { simulateDebtStrategy } from '../utils/debtStrategies';
import { StatCard } from '../components/StatCard';
import { Card, CardHeader } from '../components/Card';
import { PageHeader } from '../components/PageHeader';
import { EmptyState } from '../components/EmptyState';
import { RecommendationCard } from '../components/RecommendationCard';
import { ChartContainer } from '../components/ChartContainer';
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  BarChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  Legend,
  ComposedChart,
} from 'recharts';

interface Props {
  data: AppData;
  summary: FinancialSummary;
  onNavigate?: (page: Page) => void;
}

const COLORS = ['#6366f1', '#f59e0b', '#ef4444', '#10b981', '#3b82f6', '#8b5cf6', '#ec4899', '#14b8a6'];

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
  const debtFreeMonths = useMemo(
    () => simulateDebtStrategy(data.debts, 'custom').payoffMonths,
    [data.debts],
  );

  const categoryData = data.expenses.reduce<Record<string, number>>((acc, e) => {
    acc[e.category] = (acc[e.category] ?? 0) + e.amount;
    return acc;
  }, {});
  const expensePieData = Object.entries(categoryData).map(([name, value]) => ({ name, value }));

  const budgetBarData = [
    { name: 'Income', amount: totalMonthlyIncome, fill: '#10b981' },
    { name: 'Expenses', amount: totalMonthlyExpenses, fill: '#ef4444' },
    { name: 'Debt', amount: totalMonthlyDebtPayments, fill: '#f59e0b' },
    { name: 'Savings', amount: totalMonthlySavingsContributions, fill: '#6366f1' },
    { name: 'Leftover', amount: Math.max(0, monthlyLeftover), fill: '#3b82f6' },
  ].filter((d) => d.amount > 0);

  if (isEmpty) {
    return (
      <div>
        <PageHeader
          title="Dashboard"
          subtitle="Your complete financial picture — budget, forecast, and next steps."
        />
        <Card>
          <EmptyState
            icon="📊"
            title="Welcome to FinancePlanner"
            description="Load demo data to explore features, or add your income and expenses to build your personal plan."
            action={
              onNavigate && (
                <button
                  type="button"
                  onClick={() => onNavigate('income')}
                  className="text-sm font-semibold text-indigo-600 hover:text-indigo-800 cursor-pointer"
                >
                  Start with Income →
                </button>
              )
            }
          />
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <PageHeader
        title="Dashboard"
        subtitle="Your complete financial picture — budget, 12-month forecast, and recommended actions."
      />

      {recommendations.length > 0 && (
        <Card>
          <CardHeader title="Next best actions" subtitle="Personalized based on your plan" />
          <RecommendationCard recommendations={recommendations} onNavigate={onNavigate} />
        </Card>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
        <StatCard
          label="Monthly Income"
          value={formatCurrency(totalMonthlyIncome)}
          color="green"
        />
        <StatCard
          label="Monthly Expenses"
          value={formatCurrency(totalMonthlyExpenses)}
          color="red"
        />
        <StatCard
          label="Monthly Leftover"
          value={formatCurrency(monthlyLeftover)}
          subtext={monthlyLeftover < 0 ? 'Over budget' : 'After all obligations'}
          color={monthlyLeftover >= 0 ? 'blue' : 'red'}
          featured
        />
        <StatCard
          label="Safe Weekly Spend"
          value={formatCurrency(safeWeeklySpending)}
          subtext="Discretionary · leftover ÷ 4.33"
          color="green"
        />
        <StatCard
          label="Debt Payments"
          value={formatCurrency(totalMonthlyDebtPayments)}
          subtext={debtFreeMonths > 0 ? `Debt-free in ${formatPayoffDuration(debtFreeMonths)}` : undefined}
          color="amber"
        />
        <StatCard
          label="Savings Rate"
          value={formatCurrency(totalMonthlySavingsContributions)}
          subtext="Planned monthly contributions"
          color="indigo"
        />
      </div>

      <Card>
        <CardHeader
          title="12-Month Cashflow Forecast"
          subtitle="Projected income, obligations, and cumulative cash position"
        />
        <ChartContainer height={300}>
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={cashflow} margin={{ top: 8, right: 8, left: -8, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis dataKey="label" tick={{ fontSize: 10, fill: '#94a3b8' }} />
            <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} tickFormatter={(v) => `$${(Number(v) / 1000).toFixed(0)}k`} />
            <Tooltip
              formatter={(v, name) => [formatCurrency(Number(v)), String(name)]}
              labelFormatter={(l) => l}
            />
            <Legend />
            <Bar dataKey="income" fill="#10b981" name="Income" radius={[4, 4, 0, 0]} />
            <Bar dataKey="expenses" fill="#ef4444" name="Expenses" radius={[4, 4, 0, 0]} />
            <Bar dataKey="debtPayments" fill="#f59e0b" name="Debt" radius={[4, 4, 0, 0]} />
            <Bar dataKey="savings" fill="#6366f1" name="Savings" radius={[4, 4, 0, 0]} />
            <Line
              type="monotone"
              dataKey="cumulativeCash"
              stroke="#3b82f6"
              strokeWidth={2.5}
              dot={false}
              name="Cumulative cash"
            />
          </ComposedChart>
        </ResponsiveContainer>
        </ChartContainer>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-6 border-t border-slate-100">
          <ForecastStat label="Year-end cash" value={cashflow[cashflow.length - 1]?.cumulativeCash ?? 0} />
          <ForecastStat
            label="Avg monthly leftover"
            value={Math.round(cashflow.reduce((s, m) => s + m.leftover, 0) / cashflow.length)}
          />
          <ForecastStat
            label="Lowest month"
            value={Math.min(...cashflow.map((m) => m.leftover))}
          />
          <ForecastStat
            label="Highest month"
            value={Math.max(...cashflow.map((m) => m.leftover))}
          />
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {budgetBarData.length > 0 && (
          <Card>
            <CardHeader title="Monthly Budget" />
            <ChartContainer height={240}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={budgetBarData} margin={{ top: 0, right: 0, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#94a3b8' }} />
                <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} tickFormatter={(v) => `$${(Number(v) / 1000).toFixed(0)}k`} />
                <Tooltip formatter={(v) => [formatCurrency(Number(v)), 'Amount']} />
                <Bar dataKey="amount" radius={[6, 6, 0, 0]}>
                  {budgetBarData.map((entry, i) => (
                    <Cell key={i} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
            </ChartContainer>
          </Card>
        )}

        {expensePieData.length > 0 && (
          <Card>
            <CardHeader title="Expenses by Category" />
            <ChartContainer height={240}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={expensePieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={90}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {expensePieData.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(v) => [formatCurrency(Number(v)), 'Amount']} />
                <Legend formatter={(value) => <span className="text-xs text-slate-600">{value}</span>} />
              </PieChart>
            </ResponsiveContainer>
            </ChartContainer>
          </Card>
        )}
      </div>

      {data.savingsGoals.length > 0 && (
        <Card>
          <CardHeader title="Savings Goals" />
          <div className="space-y-4">
            {data.savingsGoals.map((goal) => {
              const pct = Math.min(100, (goal.currentAmount / goal.targetAmount) * 100);
              return (
                <div key={goal.id}>
                  <div className="flex justify-between text-sm mb-1.5">
                    <span className="font-medium text-slate-700">{goal.name}</span>
                    <span className="text-slate-500 tabular-nums">
                      {formatCurrency(goal.currentAmount)} / {formatCurrency(goal.targetAmount)}
                    </span>
                  </div>
                  <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${pct >= 100 ? 'bg-emerald-500' : 'bg-indigo-500'}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      )}
    </div>
  );
}

function ForecastStat({ label, value }: { label: string; value: number }) {
  return (
    <div className="bg-slate-50 rounded-xl p-3 text-center">
      <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">{label}</p>
      <p className="text-base font-bold text-slate-800 mt-0.5 tabular-nums">{formatCurrency(value)}</p>
    </div>
  );
}
