import type { AppData, Recommendation, FinancialSummary } from '../types';
import { formatCurrency } from './calculations';
import { simulateDebtStrategy } from './debtStrategies';
import {
  computeEmergencyRunwayMonths,
  monthlyCoreExpenses,
  protectedExpenseDays,
} from './emergencyFund';

const PRIORITY_ORDER: Record<Recommendation['priority'], number> = {
  critical: 0,
  warning: 1,
  opportunity: 2,
  healthy: 3,
};

function sortRecs(recs: Recommendation[]): Recommendation[] {
  return recs.sort((a, b) => PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority]);
}

export function getRecommendations(
  data: AppData,
  summary: FinancialSummary,
): Recommendation[] {
  const recs: Recommendation[] = [];
  const income = summary.totalMonthlyIncome;
  const expenses = summary.totalMonthlyExpenses;
  const dti = income > 0 ? summary.totalMonthlyDebtPayments / income : 0;

  const coreExpenses = monthlyCoreExpenses(data.expenses);
  const efMonths = computeEmergencyRunwayMonths(data.emergencyFund, data.expenses) ?? 0;

  const snowball = simulateDebtStrategy(data.debts, 'snowball');
  const avalanche = simulateDebtStrategy(data.debts, 'avalanche');
  const custom = simulateDebtStrategy(data.debts, 'custom');
  const bestInterest = Math.min(snowball.totalInterest, avalanche.totalInterest, custom.totalInterest);
  const inefficientCustom =
    data.debts.length >= 2 &&
    custom.totalInterest > bestInterest + 200 &&
    custom.payoffMonths >= Math.min(snowball.payoffMonths, avalanche.payoffMonths);

  if (data.income.length === 0) {
    recs.push({
      id: 'add-income',
      priority: 'critical',
      title: 'Add your income sources',
      description: 'Start with salary and side income so projections and health score are accurate.',
      actionPage: 'income',
      tone: 'caution',
    });
  }

  if (data.expenses.length === 0) {
    recs.push({
      id: 'add-expenses',
      priority: 'critical',
      title: 'Track monthly expenses',
      description: 'List fixed and variable bills to see where your money goes.',
      actionPage: 'expenses',
      tone: 'caution',
    });
  }

  if (summary.monthlyLeftover < 0) {
    recs.push({
      id: 'over-budget',
      priority: 'critical',
      title: 'You are over budget',
      description: `Spending exceeds income by ${formatCurrency(Math.abs(summary.monthlyLeftover))} per month. Trim expenses or adjust debt/savings targets.`,
      actionPage: 'expenses',
      tone: 'caution',
    });
  }

  if (income > 0 && dti >= 0.43) {
    recs.push({
      id: 'high-dti',
      priority: 'critical',
      title: 'High debt-to-income ratio',
      description: `Debt payments are ${(dti * 100).toFixed(0)}% of income. Lenders often prefer under 36%. Focus on payoff or income growth.`,
      actionPage: 'debt',
      tone: 'caution',
    });
  } else if (income > 0 && dti >= 0.36) {
    recs.push({
      id: 'elevated-dti',
      priority: 'warning',
      title: 'Debt load is elevated',
      description: `Debt payments use ${(dti * 100).toFixed(0)}% of income. Consider avalanche payoff or extra payments.`,
      actionPage: 'debt',
      tone: 'caution',
    });
  }

  if (coreExpenses > 0 && efMonths < 1) {
    recs.push({
      id: 'emergency-critical',
      priority: 'critical',
      title: 'Emergency fund covers less than 1 month of essentials',
      description:
        'Aim for at least 3 months of core expenses in your dedicated emergency reserve.',
      actionPage: 'savings',
      tone: 'caution',
    });
  } else if (coreExpenses > 0 && efMonths < 3) {
    const days = protectedExpenseDays(efMonths);
    recs.push({
      id: 'emergency-fund',
      priority: 'warning',
      title: `Emergency fund covers ${efMonths.toFixed(1)} months of essentials`,
      description: `Aim for at least 3 months of core expenses. Your reserve currently protects about ${days} days of expenses.`,
      actionPage: 'savings',
      tone: 'caution',
    });
  } else if (coreExpenses > 0 && efMonths >= 6) {
    recs.push({
      id: 'emergency-strong',
      priority: 'healthy',
      title: `Emergency fund covers ${efMonths.toFixed(1)} months of essentials`,
      description: 'Your reserve is in strong shape for unexpected income or expense shocks.',
      actionPage: 'savings',
      tone: 'positive',
    });
  }

  if (expenses > 0) {
    const byCat: Record<string, number> = {};
    for (const e of data.expenses) {
      byCat[e.category] = (byCat[e.category] ?? 0) + e.amount;
    }
    const top = Object.entries(byCat).sort((a, b) => b[1] - a[1])[0];
    if (top && income > 0 && top[1] / income > 0.35) {
      recs.push({
        id: `overspend-category-${top[0].toLowerCase().replace(/\s+/g, '-')}`,
        priority: 'warning',
        title: `${top[0]} spending is elevated`,
        description: `${top[0]} costs ${formatCurrency(top[1])}/month — ${((top[1] / income) * 100).toFixed(0)}% of take-home income. Review for cuts or rebalancing.`,
        actionPage: 'expenses',
        tone: 'caution',
      });
    }
  }

  const highInterestDebt = data.debts.find((d) => d.interestRate >= 15 && d.balance > 0);
  if (highInterestDebt && highInterestDebt.extraPayment < 50) {
    recs.push({
      id: `high-interest-${highInterestDebt.id}`,
      priority: 'warning',
      title: `Prioritize ${highInterestDebt.name}`,
      description: `At ${highInterestDebt.interestRate}% APR, extra payments here save the most. Try avalanche in Debt Planner.`,
      actionPage: 'debt',
      tone: 'caution',
    });
  }

  if (inefficientCustom) {
    recs.push({
      id: 'inefficient-debt',
      priority: 'opportunity',
      title: 'A smarter debt strategy may exist',
      description: `Snowball or avalanche could save about ${formatCurrency(custom.totalInterest - bestInterest)} in interest vs your custom split.`,
      actionPage: 'debt',
      tone: 'neutral',
    });
  }

  if (
    income > 0 &&
    summary.totalMonthlySavingsContributions / income >= 0.15 &&
    summary.monthlyLeftover > 0
  ) {
    recs.push({
      id: 'strong-savings',
      priority: 'healthy',
      title: 'Strong savings momentum',
      description: `You're allocating ${((summary.totalMonthlySavingsContributions / income) * 100).toFixed(0)}% of income to savings while staying cash-flow positive.`,
      tone: 'positive',
    });
  }

  if (summary.monthlyLeftover > 500 && summary.monthlyLeftover > 0 && dti < 0.28) {
    recs.push({
      id: 'healthy-buffer',
      priority: 'healthy',
      title: 'Healthy cashflow buffer',
      description: `${formatCurrency(summary.monthlyLeftover)}/month discretionary after all commitments — well-positioned for goals or accelerated debt payoff.`,
      tone: 'positive',
    });
  }

  if (data.debts.length > 0 && custom.payoffMonths > 0 && custom.payoffMonths <= 24) {
    recs.push({
      id: 'debt-progress',
      priority: 'healthy',
      title: 'Debt payoff on track',
      description: 'Current plan projects debt-free within two years. Keep minimums and extras consistent.',
      actionPage: 'debt',
      tone: 'positive',
    });
  }

  if (summary.safeWeeklySpending > 0 && summary.monthlyLeftover > 300) {
    recs.push({
      id: 'weekly-budget',
      priority: 'opportunity',
      title: `${formatCurrency(summary.safeWeeklySpending)}/week in flexible spending`,
      description: 'This is your discretionary budget after bills, debt, and savings — spend it without guilt.',
      tone: 'positive',
    });
  }

  if (data.debts.some((d) => d.extraPayment === 0) && summary.monthlyLeftover > 200) {
    recs.push({
      id: 'extra-debt',
      priority: 'opportunity',
      title: 'Room to accelerate debt payoff',
      description: `Even an extra ${formatCurrency(50)}/month on your highest-rate debt reduces total interest and shortens the timeline.`,
      actionPage: 'debt',
      tone: 'neutral',
    });
  }

  if (data.debts.length >= 2) {
    recs.push({
      id: 'compare-scenarios',
      priority: 'opportunity',
      title: 'Compare payoff scenarios',
      description: 'See how aggressive debt payoff or lower spending changes your timeline.',
      actionPage: 'scenarios',
      tone: 'neutral',
    });
  }

  if (income > 0 && expenses > 0 && summary.monthlyLeftover > 0) {
    const savingsRate = summary.totalMonthlySavingsContributions / income;
    if (savingsRate < 0.05 && summary.monthlyLeftover > 150) {
      recs.push({
        id: 'improve-trend',
        priority: 'opportunity',
        title: 'Surplus going unallocated',
        description: 'You have a monthly surplus but low planned savings. Routing even a small amount toward a goal compounds over time.',
        actionPage: 'savings',
        tone: 'neutral',
      });
    }
  }

  return sortRecs(recs).slice(0, 6);
}
