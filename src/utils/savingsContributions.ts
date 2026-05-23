import type { EmergencyFund, IncomeSource, Expense, Debt, SavingsGoal } from '../types';
import {
  monthsUntil,
  totalMonthlyDebtPayments,
  totalMonthlyExpenses,
  totalMonthlyIncome,
} from './calculations';

/** Required monthly to hit target by targetDate. */
export function requiredMonthlyContribution(
  targetAmount: number,
  currentAmount: number,
  targetDate: string,
): number | null {
  const months = monthsUntil(targetDate);
  if (months <= 0) return null;
  const remaining = Math.max(0, targetAmount - currentAmount);
  if (remaining <= 0) return 0;
  return remaining / months;
}

/** Planned monthly for a dated goal: user plan, else implied from target date. */
export function effectiveGoalMonthlyContribution(goal: SavingsGoal): number {
  if (goal.monthlyContribution > 0) return goal.monthlyContribution;
  if (!goal.targetDate) return 0;
  return requiredMonthlyContribution(
    goal.targetAmount,
    goal.currentAmount,
    goal.targetDate,
  ) ?? 0;
}

/** Planned monthly for emergency fund (user-entered only). */
export function effectiveEmergencyMonthlyContribution(fund: EmergencyFund): number {
  return Math.max(0, fund.monthlyContribution ?? 0);
}

export function totalPlannedMonthlySavings(
  emergencyFund: EmergencyFund,
  savingsGoals: SavingsGoal[],
): number {
  const emergency = effectiveEmergencyMonthlyContribution(emergencyFund);
  const goals = savingsGoals.reduce((sum, g) => sum + effectiveGoalMonthlyContribution(g), 0);
  return emergency + goals;
}

/** Income minus essentials and debt — before planned savings. */
export function monthlyDiscretionaryIncome(
  income: IncomeSource[],
  expenses: Expense[],
  debts: Debt[],
): number {
  return (
    totalMonthlyIncome(income) -
    totalMonthlyExpenses(expenses) -
    totalMonthlyDebtPayments(debts)
  );
}

/** Conservative suggested monthly when no target date (e.g. emergency fund). */
export function conservativeMonthlyRecommendation(
  remaining: number,
  discretionary: number,
): number {
  if (remaining <= 0 || discretionary <= 0) return 0;
  const byRunway = remaining / 18;
  const byIncome = discretionary * 0.2;
  return Math.max(0, Math.min(byRunway, byIncome));
}

export function projectReachDate(
  currentAmount: number,
  targetAmount: number,
  monthlyContribution: number,
): Date | null {
  if (targetAmount <= 0 || currentAmount >= targetAmount || monthlyContribution <= 0) {
    return null;
  }
  const monthsNeeded = Math.ceil((targetAmount - currentAmount) / monthlyContribution);
  const d = new Date();
  d.setDate(1);
  d.setMonth(d.getMonth() + monthsNeeded);
  return d;
}

export function formatMonthYear(date: Date): string {
  return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
}

export function isBelowRequiredMonthly(
  planned: number,
  required: number | null,
): boolean {
  if (required == null || required <= 0 || planned <= 0) return false;
  return planned < required - 0.01;
}
