import type { AppData, Debt, FinancialSummary, HealthScoreResult } from '../types';
import { simulateDebtStrategy } from './debtStrategies';
import { computeEmergencyRunwayMonths } from './emergencyFund';

/**
 * Health scoring philosophy
 * -------------------------
 * Penalties exist so high-APR debt, long payoff timelines, and minimum-payment habits
 * pull scores into a believable range — without shame-based UI or “doom scoring.”
 * Bands are graduated and capped; strong cashflow, emergency savings, and savings
 * consistency still reward users who are making real progress.
 */

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
  coreExpenses: number,
  efCurrent: number,
  efTarget: number,
): number {
  if (coreExpenses <= 0) return efCurrent > 0 ? 70 : 50;
  const months = efCurrent / coreExpenses;
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

function monthlyDebtPayment(debt: Debt): number {
  return debt.minimumPayment + debt.extraPayment;
}

/** Balance-weighted average APR across active debts. */
function balanceWeightedApr(debts: Debt[]): number {
  const active = debts.filter((d) => d.balance > 0);
  const totalBalance = active.reduce((s, d) => s + d.balance, 0);
  if (totalBalance <= 0) return 0;
  return active.reduce((s, d) => s + d.interestRate * d.balance, 0) / totalBalance;
}

/**
 * Compares actual monthly payment to the stated minimum (per debt), weighted by balance.
 * ~1.0 ≈ minimum-only; higher values reflect accelerated payoff behavior.
 */
export function getDebtPaymentEfficiencyRatio(debts: Debt[]): number {
  const active = debts.filter((d) => d.balance > 0);
  const totalBalance = active.reduce((s, d) => s + d.balance, 0);
  if (totalBalance <= 0) return 1.2;
  const weighted = active.reduce((s, d) => {
    const minimum = Math.max(d.minimumPayment, 1);
    return s + (monthlyDebtPayment(d) / minimum) * d.balance;
  }, 0);
  return weighted / totalBalance;
}

/** Extra penalty for high-rate balances paid near the minimum (revolving-trap pattern). */
function revolvingNearMinimumPenalty(debts: Debt[]): number {
  let penalty = 0;
  for (const d of debts) {
    if (d.balance <= 0 || d.interestRate < 10) continue;
    const pay = monthlyDebtPayment(d);
    const monthlyInterest = d.balance * (d.interestRate / 100 / 12);

    if (pay <= monthlyInterest * 1.12) penalty += 8;
    else if (pay <= monthlyInterest * 1.25) penalty += 4;

    if (d.interestRate >= 15 && pay < d.balance * 0.025) penalty += 6;
    else if (d.interestRate >= 10 && pay < d.balance * 0.02) penalty += 4;
  }
  return Math.min(penalty, 22);
}

/**
 * Debt quality: balance load, APR severity, payoff horizon, and payment efficiency.
 * Penalties are additive but bounded so one weak area does not zero out the entire score.
 */
function scoreDebtQuality(
  income: number,
  debts: Debt[],
  payoffMonths: number,
): number {
  const totalDebt = debts.reduce((s, d) => s + d.balance, 0);
  if (totalDebt <= 0) return 100;

  let score = 100;
  const annualIncome = income * 12;

  if (annualIncome <= 0) {
    score -= 40;
  } else {
    const balanceToIncome = totalDebt / annualIncome;
    if (balanceToIncome > 0.5) score -= 28;
    else if (balanceToIncome > 0.3) score -= 16;
    else if (balanceToIncome > 0.15) score -= 6;
  }

  const maxApr = Math.max(
    ...debts.filter((d) => d.balance > 0).map((d) => d.interestRate),
    0,
  );
  const weightedApr = balanceWeightedApr(debts);

  if (maxApr > 18) score -= 12;
  else if (maxApr > 10) score -= 5;

  if (weightedApr > 15) score -= 8;
  else if (weightedApr > 10) score -= 4;

  if (payoffMonths > 120) score -= 28;
  else if (payoffMonths > 60) score -= 20;
  else if (payoffMonths > 36) score -= 10;
  else if (payoffMonths <= 24) score += 4;

  // Costly debt that will linger — common minimum-payment pattern
  if (maxApr > 18 && payoffMonths > 48) score -= 6;

  const paymentRatio = getDebtPaymentEfficiencyRatio(debts);
  if (paymentRatio < 1.08) score -= 14;
  else if (paymentRatio < 1.2) score -= 8;
  else if (paymentRatio >= 1.6) score += 5;
  else if (paymentRatio >= 1.35) score += 3;

  score -= revolvingNearMinimumPenalty(debts);

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
  const efTarget = data.emergencyFund.targetAmount;
  const efCurrent = data.emergencyFund.currentAmount;
  const runwayMonths = computeEmergencyRunwayMonths(data.emergencyFund, data.expenses);
  const coreExpenses =
    runwayMonths != null && runwayMonths > 0
      ? efCurrent / runwayMonths
      : 0;
  const payoffMonths = simulateDebtStrategy(data.debts, 'custom').payoffMonths;

  const factors = [
    {
      id: 'leftover',
      label: 'Cashflow buffer',
      score: scoreLeftover(income, summary.monthlyLeftover),
      weight: 0.24,
      description: 'Monthly leftover after obligations.',
    },
    {
      id: 'emergency',
      label: 'Emergency runway',
      score: scoreEmergencyRunway(coreExpenses, efCurrent, efTarget),
      weight: 0.18,
      description: 'Months of core expenses covered by your emergency fund.',
    },
    {
      id: 'debt-quality',
      label: 'Debt quality',
      score: scoreDebtQuality(income, data.debts, payoffMonths),
      weight: 0.2,
      description:
        'Balance load, interest rates, payoff timeline, and payment pace vs minimums.',
    },
    {
      id: 'dti',
      label: 'Debt-to-income',
      score: scoreDebtToIncome(income, summary.totalMonthlyDebtPayments),
      weight: 0.16,
      description: 'Monthly debt payments relative to income.',
    },
    {
      id: 'savings-rate',
      label: 'Savings rate',
      score: scoreSavingsRate(income, summary.totalMonthlySavingsContributions),
      weight: 0.14,
      description: 'Planned monthly savings vs income.',
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
