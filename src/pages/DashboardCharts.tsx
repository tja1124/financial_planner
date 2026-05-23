import { memo } from 'react';
import type { AppData, FinancialSummary } from '../types';
import { formatCurrency } from '../utils/calculations';
import { projectCashflow } from '../utils/cashflow';
import { Card, CardHeader } from '../components/Card';
import { ChartContainer } from '../components/ChartContainer';
import { ChartTooltip } from '../components/charts/ChartTooltip';
import { PieChartTooltip } from '../components/charts/PieChartTooltip';
import { FadeIn } from '../components/motion/FadeIn';
import { useChartTheme } from '../hooks/useChartTheme';
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
  cashflow: ReturnType<typeof projectCashflow>;
}

function ForecastStat({ label, value }: { label: string; value: number }) {
  return (
    <div className="surface-muted p-3 sm:p-3.5 text-center">
      <p className="text-[10px] font-semibold uppercase tracking-wide text-muted">{label}</p>
      <p className="text-sm sm:text-base font-bold text-primary mt-1 tabular-nums">
        {formatCurrency(value)}
      </p>
    </div>
  );
}

export const DashboardCharts = memo(function DashboardCharts({
  data,
  summary,
  cashflow,
}: Props) {
  const chart = useChartTheme();
  const {
    totalMonthlyIncome,
    totalMonthlyExpenses,
    totalMonthlyDebtPayments,
    totalMonthlySavingsContributions,
    monthlyLeftover,
  } = summary;

  const categoryData = data.expenses.reduce<Record<string, number>>((acc, e) => {
    acc[e.category] = (acc[e.category] ?? 0) + e.amount;
    return acc;
  }, {});
  const expenseTotal = Object.values(categoryData).reduce((s, v) => s + v, 0);
  const expensePieData = Object.entries(categoryData).map(([name, value]) => ({
    name,
    value,
    total: expenseTotal,
  }));

  const budgetBarData = [
    { name: 'Income', amount: totalMonthlyIncome, fill: chart.series.income },
    { name: 'Expenses', amount: totalMonthlyExpenses, fill: chart.series.expenses },
    { name: 'Debt', amount: totalMonthlyDebtPayments, fill: chart.series.debt },
    { name: 'Savings', amount: totalMonthlySavingsContributions, fill: chart.series.savings },
    { name: 'Leftover', amount: Math.max(0, monthlyLeftover), fill: chart.series.leftover },
  ].filter((d) => d.amount > 0);

  const chartHeight = { sm: 260, lg: 280 };

  return (
    <>
      <FadeIn delay={0.05}>
        <Card padding="none" className="overflow-hidden">
          <div className="p-5 sm:p-6 pb-0">
            <CardHeader
              title="12-Month Cashflow"
              subtitle="Income, obligations, and cumulative position"
            />
          </div>
          <ChartContainer height={chartHeight.lg} inset={false} className="px-2 sm:px-4">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={cashflow} margin={{ top: 8, right: 8, left: -8, bottom: 4 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={chart.grid} vertical={false} />
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 10, fill: chart.tick }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 10, fill: chart.tick }}
                  tickFormatter={(v) => `$${(Number(v) / 1000).toFixed(0)}k`}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  content={<ChartTooltip formatLabel={(l) => String(l)} />}
                  cursor={{ fill: chart.cursor }}
                />
                <Legend wrapperStyle={chart.legendStyle} iconType="circle" iconSize={8} />
                <Bar dataKey="income" fill={chart.series.income} name="Income" radius={[4, 4, 0, 0]} />
                <Bar
                  dataKey="expenses"
                  fill={chart.series.expenses}
                  name="Expenses"
                  radius={[4, 4, 0, 0]}
                />
                <Bar
                  dataKey="debtPayments"
                  fill={chart.series.debt}
                  name="Debt"
                  radius={[4, 4, 0, 0]}
                />
                <Bar
                  dataKey="savings"
                  fill={chart.series.savings}
                  name="Savings"
                  radius={[4, 4, 0, 0]}
                />
                <Line
                  type="monotone"
                  dataKey="cumulativeCash"
                  stroke={chart.series.cumulative}
                  strokeWidth={2.5}
                  dot={false}
                  name="Cumulative"
                />
              </ComposedChart>
            </ResponsiveContainer>
          </ChartContainer>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 p-5 sm:p-6 pt-4 border-t divider">
            <ForecastStat
              label="Year-end cash"
              value={cashflow[cashflow.length - 1]?.cumulativeCash ?? 0}
            />
            <ForecastStat
              label="Avg leftover"
              value={Math.round(cashflow.reduce((s, m) => s + m.leftover, 0) / cashflow.length)}
            />
            <ForecastStat label="Lowest month" value={Math.min(...cashflow.map((m) => m.leftover))} />
            <ForecastStat label="Highest month" value={Math.max(...cashflow.map((m) => m.leftover))} />
          </div>
        </Card>
      </FadeIn>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-5">
        {budgetBarData.length > 0 && (
          <FadeIn delay={0.08}>
            <Card>
              <CardHeader title="Monthly Budget" />
              <ChartContainer height={chartHeight.sm}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={budgetBarData} margin={{ top: 8, right: 4, left: -8, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={chart.grid} vertical={false} />
                    <XAxis
                      dataKey="name"
                      tick={{ fontSize: 11, fill: chart.tick }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      tick={{ fontSize: 11, fill: chart.tick }}
                      tickFormatter={(v) => `$${(Number(v) / 1000).toFixed(0)}k`}
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip content={<ChartTooltip />} cursor={{ fill: chart.cursor }} />
                    <Bar dataKey="amount" radius={[6, 6, 0, 0]}>
                      {budgetBarData.map((entry, i) => (
                        <Cell key={i} fill={entry.fill} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </ChartContainer>
            </Card>
          </FadeIn>
        )}

        {expensePieData.length > 0 && (
          <FadeIn delay={0.1}>
            <Card>
              <CardHeader title="Expenses by Category" />
              <ChartContainer height={chartHeight.sm}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={expensePieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={82}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      {expensePieData.map((_, i) => (
                        <Cell key={i} fill={chart.pieColor(i)} />
                      ))}
                    </Pie>
                    <Tooltip content={<PieChartTooltip />} />
                    <Legend wrapperStyle={chart.legendStyle} iconType="circle" iconSize={8} />
                  </PieChart>
                </ResponsiveContainer>
              </ChartContainer>
            </Card>
          </FadeIn>
        )}
      </div>
    </>
  );
});
