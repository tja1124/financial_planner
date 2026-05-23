import type { AppData, Recommendation, FinancialSummary } from '../types';
import { computeEmergencyFundTarget } from './scenarios';

export function getRecommendations(
  data: AppData,
  summary: FinancialSummary,
): Recommendation[] {
  const recs: Recommendation[] = [];

  if (data.income.length === 0) {
    recs.push({
      id: 'add-income',
      priority: 'high',
      title: 'Add your income sources',
      description: 'Start by entering salary and any side income so projections are accurate.',
      actionPage: 'income',
    });
  }

  if (data.expenses.length === 0) {
    recs.push({
      id: 'add-expenses',
      priority: 'high',
      title: 'Track monthly expenses',
      description: 'List fixed and variable bills to see where your money goes.',
      actionPage: 'expenses',
    });
  }

  if (summary.monthlyLeftover < 0) {
    recs.push({
      id: 'over-budget',
      priority: 'high',
      title: 'You are over budget',
      description: `Spending exceeds income by ${Math.abs(summary.monthlyLeftover).toFixed(0)} per month. Review expenses or increase debt payoff flexibility.`,
      actionPage: 'expenses',
    });
  }

  const highInterestDebt = data.debts.find((d) => d.interestRate >= 15 && d.balance > 0);
  if (highInterestDebt && highInterestDebt.extraPayment < 50) {
    recs.push({
      id: 'high-interest',
      priority: 'high',
      title: `Attack ${highInterestDebt.name} first`,
      description: `At ${highInterestDebt.interestRate}% APR, extra payments here save the most. Try the avalanche strategy in Debt Planner.`,
      actionPage: 'debt',
    });
  }

  const efGoal = data.savingsGoals.find((g) => /emergency/i.test(g.name));
  const efTarget = efGoal?.targetAmount ?? computeEmergencyFundTarget(data.expenses);
  const efCurrent = efGoal?.currentAmount ?? 0;
  if (efCurrent < efTarget * 0.5 && data.expenses.length > 0) {
    recs.push({
      id: 'emergency-fund',
      priority: 'medium',
      title: 'Build your emergency fund',
      description: `Aim for ${efTarget.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })} (3 months of expenses). You're at ${Math.round((efCurrent / efTarget) * 100)}%.`,
      actionPage: 'savings',
    });
  }

  if (data.debts.length >= 2) {
    recs.push({
      id: 'compare-scenarios',
      priority: 'medium',
      title: 'Compare payoff scenarios',
      description: 'See how aggressive debt payoff or lower spending changes your timeline.',
      actionPage: 'scenarios',
    });
  }

  if (summary.safeWeeklySpending > 0 && summary.monthlyLeftover > 500) {
    recs.push({
      id: 'weekly-budget',
      priority: 'low',
      title: `Safe to spend ${summary.safeWeeklySpending.toFixed(0)}/week`,
      description: 'This is discretionary cash after bills, debt, and savings — use it guilt-free.',
    });
  }

  if (data.debts.some((d) => d.extraPayment === 0) && summary.monthlyLeftover > 200) {
    recs.push({
      id: 'extra-debt',
      priority: 'medium',
      title: 'Allocate extra to debt',
      description: 'You have room in your budget. Even $50/mo extra cuts interest and payoff time.',
      actionPage: 'debt',
    });
  }

  return recs.slice(0, 5);
}
