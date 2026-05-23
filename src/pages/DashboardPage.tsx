import type { AppData, FinancialSummary } from '../types';
import { formatCurrency } from '../utils/calculations';
import { StatCard } from '../components/StatCard';
import { Card, CardHeader } from '../components/Card';
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  Legend,
} from 'recharts';

interface Props {
  data: AppData;
  summary: FinancialSummary;
}

const COLORS = ['#6366f1', '#f59e0b', '#ef4444', '#10b981', '#3b82f6', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316', '#84cc16'];

export function DashboardPage({ data, summary }: Props) {
  const { totalMonthlyIncome, totalMonthlyExpenses, totalMonthlyDebtPayments, totalMonthlySavingsContributions, monthlyLeftover, safeWeeklySpending } = summary;

  const isEmpty = data.income.length === 0 && data.expenses.length === 0;

  const incomeVsExpensesData = [
    { name: 'Income', value: totalMonthlyIncome },
    { name: 'Expenses', value: totalMonthlyExpenses },
    { name: 'Debt Payments', value: totalMonthlyDebtPayments },
    { name: 'Savings', value: totalMonthlySavingsContributions },
    { name: 'Leftover', value: Math.max(0, monthlyLeftover) },
  ].filter((d) => d.value > 0);

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
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Dashboard</h1>
          <p className="text-slate-500 text-sm mt-1">Your financial overview at a glance.</p>
        </div>
        <div className="text-center py-24 text-slate-400">
          <p className="text-5xl mb-4">📊</p>
          <p className="font-semibold text-lg">Nothing to show yet</p>
          <p className="text-sm mt-2 max-w-xs mx-auto">
            Head to <strong>Income</strong> and <strong>Expenses</strong> to get started. Your dashboard will update automatically.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Dashboard</h1>
        <p className="text-slate-500 text-sm mt-1">Your financial overview at a glance.</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
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
          label="Debt Payments"
          value={formatCurrency(totalMonthlyDebtPayments)}
          color="amber"
        />
        <StatCard
          label="Savings Contributions"
          value={formatCurrency(totalMonthlySavingsContributions)}
          color="indigo"
        />
        <StatCard
          label="Monthly Leftover"
          value={formatCurrency(monthlyLeftover)}
          subtext={monthlyLeftover < 0 ? 'Over budget' : 'Available to spend/save'}
          color={monthlyLeftover >= 0 ? 'blue' : 'red'}
        />
        <StatCard
          label="Safe Weekly Spend"
          value={formatCurrency(safeWeeklySpending)}
          subtext="Leftover ÷ 4.33 weeks"
          color="green"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {budgetBarData.length > 0 && (
          <Card>
            <CardHeader title="Monthly Budget Breakdown" />
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={budgetBarData} margin={{ top: 0, right: 0, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#94a3b8' }} />
                <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
                <Tooltip formatter={(v) => [formatCurrency(Number(v)), 'Amount']} />
                <Bar dataKey="amount" radius={[6, 6, 0, 0]}>
                  {budgetBarData.map((entry, i) => (
                    <Cell key={i} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </Card>
        )}

        {expensePieData.length > 0 && (
          <Card>
            <CardHeader title="Expenses by Category" />
            <ResponsiveContainer width="100%" height={240}>
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
                <Legend
                  formatter={(value) => <span className="text-xs text-slate-600">{value}</span>}
                />
              </PieChart>
            </ResponsiveContainer>
          </Card>
        )}
      </div>

      {incomeVsExpensesData.length > 0 && (
        <Card>
          <CardHeader
            title="Where Your Money Goes"
            subtitle="Monthly allocation as a percentage of income"
          />
          <div className="space-y-3">
            {incomeVsExpensesData
              .filter((d) => d.name !== 'Income')
              .map((item, i) => {
                const pct = totalMonthlyIncome > 0 ? (item.value / totalMonthlyIncome) * 100 : 0;
                return (
                  <div key={item.name}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-slate-600">{item.name}</span>
                      <span className="font-medium text-slate-700">
                        {formatCurrency(item.value)} <span className="text-slate-400 font-normal">({pct.toFixed(0)}%)</span>
                      </span>
                    </div>
                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full"
                        style={{ width: `${Math.min(100, pct)}%`, backgroundColor: COLORS[i % COLORS.length] }}
                      />
                    </div>
                  </div>
                );
              })}
          </div>
        </Card>
      )}

      {data.savingsGoals.length > 0 && (
        <Card>
          <CardHeader title="Savings Goals Progress" />
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
                      className={`h-full rounded-full transition-all duration-500 ${pct >= 100 ? 'bg-emerald-500' : 'bg-indigo-500'}`}
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
