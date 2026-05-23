import type {
  AppData,
  ScenarioAdjustments,
  ScenarioMetrics,
  ScenarioPreset,
  Debt,
  Expense,
  SavingsGoal,
} from '../types';
import {
  totalMonthlyIncome,
  totalMonthlyExpenses,
  monthsUntil,
} from './calculations';
import { simulateDebtStrategy } from './debtStrategies';
import { defaultEmergencyTarget } from './emergencyFund';

export const PRESET_LABELS: Record<ScenarioPreset, string> = {
  current: 'Current Plan',
  'aggressive-debt': 'Aggressive Debt Payoff',
  'higher-savings': 'Higher Savings',
  'lower-spending': 'Lower Spending',
  custom: 'Custom Scenario',
};

export const PRESET_DESCRIPTIONS: Record<ScenarioPreset, string> = {
  current: 'Your finances exactly as entered today.',
  'aggressive-debt': 'Adds $300/mo toward debt payoff on top of current extras.',
  'higher-savings': 'Increases planned savings contributions by 50%.',
  'lower-spending': 'Reduces all expenses by 15%.',
  custom: 'Adjust sliders to build your own what-if plan.',
};

export function getPresetAdjustments(preset: ScenarioPreset): ScenarioAdjustments {
  switch (preset) {
    case 'current':
      return { expenseMultiplier: 1, extraDebtPayment: 0, savingsMultiplier: 1 };
    case 'aggressive-debt':
      return { expenseMultiplier: 1, extraDebtPayment: 300, savingsMultiplier: 1 };
    case 'higher-savings':
      return { expenseMultiplier: 1, extraDebtPayment: 0, savingsMultiplier: 1.5 };
    case 'lower-spending':
      return { expenseMultiplier: 0.85, extraDebtPayment: 0, savingsMultiplier: 1 };
    case 'custom':
      return { expenseMultiplier: 1, extraDebtPayment: 0, savingsMultiplier: 1 };
  }
}

function adjustedExpenses(expenses: Expense[], multiplier: number): Expense[] {
  return expenses.map((e) => ({ ...e, amount: e.amount * multiplier }));
}

function adjustedDebts(debts: Debt[], extraPayment: number): Debt[] {
  if (extraPayment <= 0 || debts.length === 0) return debts;
  const perDebt = extraPayment / debts.length;
  return debts.map((d) => ({
    ...d,
    extraPayment: d.extraPayment + perDebt,
  }));
}

function adjustedSavings(goals: SavingsGoal[], multiplier: number): number {
  return goals.reduce((sum, g) => {
    if (!g.targetDate) return sum;
    const months = monthsUntil(g.targetDate);
    if (months <= 0) return sum;
    const needed = Math.max(0, g.targetAmount - g.currentAmount);
    return sum + (needed / months) * multiplier;
  }, 0);
}

/** @deprecated Use defaultEmergencyTarget from emergencyFund — kept for imports. */
export function computeEmergencyFundTarget(expenses: Expense[]): number {
  return defaultEmergencyTarget(expenses);
}

export function computeEmergencyFundMonths(
  currentAmount: number,
  target: number,
  monthlyContribution: number,
): number | null {
  if (target <= 0) return null;
  if (currentAmount >= target) return 0;
  if (monthlyContribution <= 0) return null;
  return Math.ceil((target - currentAmount) / monthlyContribution);
}

export function evaluateScenario(
  data: AppData,
  preset: ScenarioPreset,
  adjustments: ScenarioAdjustments,
): ScenarioMetrics {
  const expenses = adjustedExpenses(data.expenses, adjustments.expenseMultiplier);
  const debts = adjustedDebts(data.debts, adjustments.extraDebtPayment);
  const income = totalMonthlyIncome(data.income);
  const expenseTotal = totalMonthlyExpenses(expenses);
  const savingsContribution = adjustedSavings(
    data.savingsGoals,
    adjustments.savingsMultiplier,
  );

  const debtResult = simulateDebtStrategy(debts, 'custom');
  const debtPayments = debts.reduce(
    (s, d) => s + d.minimumPayment + d.extraPayment,
    0,
  );

  const monthlyLeftover = income - expenseTotal - debtPayments - savingsContribution;
  const safeWeeklySpending = Math.max(0, monthlyLeftover / 4.33);

  const ef = data.emergencyFund;
  const emergencyTarget = ef.targetAmount > 0 ? ef.targetAmount : defaultEmergencyTarget(data.expenses);
  const efGap = Math.max(0, emergencyTarget - ef.currentAmount);
  const efContribution =
    efGap > 0 && monthlyLeftover > 0
      ? Math.min(efGap / 12, monthlyLeftover * 0.25) * adjustments.savingsMultiplier
      : savingsContribution > 0
        ? savingsContribution * 0.5
        : Math.max(0, monthlyLeftover * 0.2);

  const emergencyFundMonths = computeEmergencyFundMonths(
    ef.currentAmount,
    emergencyTarget,
    efContribution,
  );

  return {
    label: PRESET_LABELS[preset],
    preset,
    monthlyLeftover,
    safeWeeklySpending,
    debtPayoffMonths: debtResult.payoffMonths,
    totalDebtInterest: debtResult.totalInterest,
    monthlySavingsContribution: savingsContribution,
    emergencyFundMonths,
    emergencyFundTarget: emergencyTarget,
  };
}

export function evaluateAllPresets(
  data: AppData,
  customAdjustments: ScenarioAdjustments,
): ScenarioMetrics[] {
  const presets: ScenarioPreset[] = [
    'current',
    'aggressive-debt',
    'higher-savings',
    'lower-spending',
    'custom',
  ];
  return presets.map((preset) => {
    const adj =
      preset === 'custom'
        ? customAdjustments
        : getPresetAdjustments(preset);
    return evaluateScenario(data, preset, adj);
  });
}
