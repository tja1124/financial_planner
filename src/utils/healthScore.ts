import type { AppData, FinancialSummary, HealthScoreResult } from '../types';
import { simulateDebtStrategy } from './debtStrategies';
import { computeEmergencyFundTarget } from './scenarios';

function clamp(n: number, min = 0, max = 100): number {
  return Math.min(max, Math.max(min, n));
}

function scoreSavingsRate(income: number, savings: number): number {
  if (income <= 0) return savings > 0 ? 40 : 50;
  const rate = savings / income;
  if (rate >= 0.2) return 100;
  if (rate >= 0.15) return 90;
  if (rate >= 0.1) return 75;
  if (rate >= 0.05) return 55;
  if (rate > 0) return 40;
  return 25;
}

function scoreEmergencyRunway(
  expenses: number,
  efCurrent: number,
  efTarget: number,
): number {
  if (expenses <= 0) return efCurrent > 0 ? 70 : 50;
  const months = efCurrent / expenses;
  if (months >= 6) return 100;
  if (months >= 3) return 85;
  if (months >= 1) return 60;
  if (efCurrent > 0) return 40;
  if (efTarget > 0) return 20;
  return 35;
}

function scoreDebtToIncome(income: number, debtPayments: number): number {
  if (income <= 0) return debtPayments > 0 ? 25 : 50;
  const ratio = debtPayments / income;
  if (ratio <= 0.2) return 100;
  if (ratio <= 0.28) return 80;
  if (ratio <= 0.36) return 55;
  if (ratio <= 0.43) return 35;
  return 15;
}

function scoreLeftover(income: number, leftover: number): number {
  if (income <= 0) return leftover >= 0 ? 60 : 20;
  const rate = leftover / income;
  if (rate >= 0.15) return 100;
  if (rate >= 0.08) return 85;
  if (rate >= 0.03) return 65;
  if (rate >= 0) return 45;
  if (rate >= -0.05) return 25;
  return 10;
}

function scoreDebtUtilization(
  income: number,
  totalDebtBalance: number,
  payoffMonths: number,
): number {
  if (totalDebtBalance <= 0) return 100;
  const annualIncome = income * 12;
  if (annualIncome <= 0) return 30;
  const ratio = totalDebtBalance / annualIncome;
  let score = 100;
  if (ratio > 0.5) score -= 35;
  else if (ratio > 0.3) score -= 20;
  else if (ratio > 0.15) score -= 8;
  if (payoffMonths > 60) score -= 25;
  else if (payoffMonths > 36) score -= 12;
  return clamp(score);
}

function scoreSpendingStability(data: AppData, income: number): number {
  if (data.expenses.length === 0) return 55;
  const fixed = data.expenses.filter((e) => e.isFixed).reduce((s, e) => s + e.amount, 0);
  const total = data.expenses.reduce((s, e) => s + e.amount, 0);
  if (total <= 0) return 50;
  const fixedRatio = fixed / total;
  let score = 70 + fixedRatio * 25;
  if (income > 0 && total / income > 0.85) score -= 25;
  else if (income > 0 && total / income > 0.7) score -= 12;
  const byCat: Record<string, number> = {};
  for (const e of data.expenses) {
    byCat[e.category] = (byCat[e.category] ?? 0) + e.amount;
  }
  const maxCat = Math.max(...Object.values(byCat));
  if (maxCat / total > 0.5) score -= 10;
  return clamp(score);
}

function gradeFromScore(overall: number): HealthScoreResult['grade'] {
  if (overall >= 85) return 'excellent';
  if (overall >= 70) return 'good';
  if (overall >= 55) return 'fair';
  if (overall >= 40) return 'warning';
  return 'critical';
}

export function computeHealthScore(
  data: AppData,
  summary: FinancialSummary,
): HealthScoreResult {
  const income = summary.totalMonthlyIncome;
  const efGoal = data.savingsGoals.find((g) => /emergency/i.test(g.name));
  const efTarget = efGoal?.targetAmount ?? computeEmergencyFundTarget(data.expenses);
  const efCurrent = efGoal?.currentAmount ?? 0;
  const totalDebt = data.debts.reduce((s, d) => s + d.balance, 0);
  const payoffMonths = simulateDebtStrategy(data.debts, 'custom').payoffMonths;

  const factors = [
    {
      id: 'savings-rate',
      label: 'Savings rate',
      score: scoreSavingsRate(income, summary.totalMonthlySavingsContributions),
      weight: 0.18,
      description: 'Planned monthly savings vs income.',
    },
    {
      id: 'emergency',
      label: 'Emergency runway',
      score: scoreEmergencyRunway(summary.totalMonthlyExpenses, efCurrent, efTarget),
      weight: 0.2,
      description: 'Months of expenses covered by emergency savings.',
    },
    {
      id: 'dti',
      label: 'Debt-to-income',
      score: scoreDebtToIncome(income, summary.totalMonthlyDebtPayments),
      weight: 0.2,
      description: 'Monthly debt payments relative to income.',
    },
    {
      id: 'leftover',
      label: 'Cashflow buffer',
      score: scoreLeftover(income, summary.monthlyLeftover),
      weight: 0.22,
      description: 'Monthly leftover after obligations.',
    },
    {
      id: 'debt-load',
      label: 'Debt load',
      score: scoreDebtUtilization(income, totalDebt, payoffMonths),
      weight: 0.12,
      description: 'Total debt balance and payoff timeline.',
    },
    {
      id: 'stability',
      label: 'Spending stability',
      score: scoreSpendingStability(data, income),
      weight: 0.08,
      description: 'Fixed vs variable mix and category concentration.',
    },
  ];

  const overall = Math.round(
    factors.reduce((sum, f) => sum + f.score * f.weight, 0) /
      factors.reduce((sum, f) => sum + f.weight, 0),
  );

  return {
    overall: clamp(overall),
    grade: gradeFromScore(overall),
    factors,
  };
}

export const GRADE_COLORS: Record<
  HealthScoreResult['grade'],
  { ring: string; text: string; bg: string }
> = {
  excellent: {
    ring: 'stroke-emerald-500',
    text: 'text-emerald-600 dark:text-emerald-400',
    bg: 'bg-emerald-500/10',
  },
  good: {
    ring: 'stroke-teal-500',
    text: 'text-teal-600 dark:text-teal-400',
    bg: 'bg-teal-500/10',
  },
  fair: {
    ring: 'stroke-amber-500',
    text: 'text-amber-600 dark:text-amber-400',
    bg: 'bg-amber-500/10',
  },
  warning: {
    ring: 'stroke-orange-500',
    text: 'text-orange-600 dark:text-orange-400',
    bg: 'bg-orange-500/10',
  },
  critical: {
    ring: 'stroke-red-500',
    text: 'text-red-600 dark:text-red-400',
    bg: 'bg-red-500/10',
  },
};
