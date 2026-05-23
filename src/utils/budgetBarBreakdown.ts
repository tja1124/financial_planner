import type { AppData, FinancialSummary } from '../types';
import { estimateNetMonthly } from './taxEstimation';
import {
  effectiveEmergencyMonthlyContribution,
  effectiveGoalMonthlyContribution,
} from './savingsContributions';

export interface BudgetBreakdownLine {
  name: string;
  amount: number;
}

export interface BudgetBarDatum {
  name: string;
  amount: number;
  fill: string;
  lines: BudgetBreakdownLine[];
}

export function buildIncomeBreakdown(income: AppData['income']): BudgetBreakdownLine[] {
  return income
    .map((s) => ({ name: s.name, amount: estimateNetMonthly(s) }))
    .filter((l) => l.amount > 0);
}

export function buildExpenseBreakdown(expenses: AppData['expenses']): BudgetBreakdownLine[] {
  const lines: BudgetBreakdownLine[] = expenses
    .filter((e) => !e.isPlannedExpense)
    .map((e) => ({ name: e.name, amount: e.amount }))
    .filter((l) => l.amount > 0);

  const plannedTotal = expenses
    .filter((e) => e.isPlannedExpense)
    .reduce((sum, e) => sum + e.amount, 0);

  if (plannedTotal > 0) {
    lines.push({ name: 'Planned expenses', amount: plannedTotal });
  }

  return lines;
}

export function buildDebtBreakdown(debts: AppData['debts']): BudgetBreakdownLine[] {
  return debts
    .map((d) => ({
      name: d.name,
      amount: d.minimumPayment + d.extraPayment,
    }))
    .filter((l) => l.amount > 0);
}

export function buildSavingsBreakdown(
  emergencyFund: AppData['emergencyFund'],
  savingsGoals: AppData['savingsGoals'],
): BudgetBreakdownLine[] {
  const lines: BudgetBreakdownLine[] = [];
  const emergency = effectiveEmergencyMonthlyContribution(emergencyFund);
  if (emergency > 0) {
    lines.push({ name: 'Emergency Fund', amount: emergency });
  }
  for (const goal of savingsGoals) {
    const amount = effectiveGoalMonthlyContribution(goal);
    if (amount > 0) {
      lines.push({ name: goal.name, amount });
    }
  }
  return lines;
}

export function buildBudgetBarData(
  data: AppData,
  summary: FinancialSummary,
  fills: {
    income: string;
    expenses: string;
    debt: string;
    savings: string;
    leftover: string;
  },
): BudgetBarDatum[] {
  const {
    totalMonthlyIncome,
    totalMonthlyExpenses,
    totalMonthlyDebtPayments,
    totalMonthlySavingsContributions,
    monthlyLeftover,
  } = summary;

  return [
    {
      name: 'Income',
      amount: totalMonthlyIncome,
      fill: fills.income,
      lines: buildIncomeBreakdown(data.income),
    },
    {
      name: 'Expenses',
      amount: totalMonthlyExpenses,
      fill: fills.expenses,
      lines: buildExpenseBreakdown(data.expenses),
    },
    {
      name: 'Debt',
      amount: totalMonthlyDebtPayments,
      fill: fills.debt,
      lines: buildDebtBreakdown(data.debts),
    },
    {
      name: 'Savings',
      amount: totalMonthlySavingsContributions,
      fill: fills.savings,
      lines: buildSavingsBreakdown(data.emergencyFund, data.savingsGoals),
    },
    {
      name: 'Leftover',
      amount: Math.max(0, monthlyLeftover),
      fill: fills.leftover,
      lines: [],
    },
  ].filter((d) => d.amount > 0);
}
