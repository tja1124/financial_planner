import type {
  IncomeSource,
  Expense,
  Debt,
  SavingsGoal,
  FinancialSummary,
} from '../types';

export function toMonthly(amount: number, frequency: IncomeSource['frequency']): number {
  switch (frequency) {
    case 'weekly': return amount * 52 / 12;
    case 'biweekly': return amount * 26 / 12;
    case 'monthly': return amount;
    case 'annually': return amount / 12;
  }
}

export function totalMonthlyIncome(sources: IncomeSource[]): number {
  return sources.reduce((sum, s) => sum + toMonthly(s.amount, s.frequency), 0);
}

export function totalMonthlyExpenses(expenses: Expense[]): number {
  return expenses.reduce((sum, e) => sum + e.amount, 0);
}

export function totalMonthlyDebtPayments(debts: Debt[]): number {
  return debts.reduce((sum, d) => sum + d.minimumPayment + d.extraPayment, 0);
}

export function totalMonthlySavingsContributions(goals: SavingsGoal[]): number {
  return goals.reduce((sum, g) => {
    if (!g.targetDate) return sum;
    const months = monthsUntil(g.targetDate);
    if (months <= 0) return sum;
    const needed = Math.max(0, g.targetAmount - g.currentAmount);
    return sum + needed / months;
  }, 0);
}

export function monthsUntil(dateStr: string): number {
  const target = new Date(dateStr);
  const now = new Date();
  return (
    (target.getFullYear() - now.getFullYear()) * 12 +
    (target.getMonth() - now.getMonth())
  );
}

export function computeSummary(
  income: IncomeSource[],
  expenses: Expense[],
  debts: Debt[],
  savingsGoals: SavingsGoal[],
): FinancialSummary {
  const totalMonthlyIncomeVal = totalMonthlyIncome(income);
  const totalMonthlyExpensesVal = totalMonthlyExpenses(expenses);
  const totalMonthlyDebtPaymentsVal = totalMonthlyDebtPayments(debts);
  const totalMonthlySavingsContributionsVal = totalMonthlySavingsContributions(savingsGoals);

  const monthlyLeftover =
    totalMonthlyIncomeVal -
    totalMonthlyExpensesVal -
    totalMonthlyDebtPaymentsVal -
    totalMonthlySavingsContributionsVal;

  const safeWeeklySpending = Math.max(0, monthlyLeftover / 4.33);

  return {
    totalMonthlyIncome: totalMonthlyIncomeVal,
    totalMonthlyExpenses: totalMonthlyExpensesVal,
    totalMonthlyDebtPayments: totalMonthlyDebtPaymentsVal,
    totalMonthlySavingsContributions: totalMonthlySavingsContributionsVal,
    monthlyLeftover,
    safeWeeklySpending,
  };
}

let currencyCode = 'USD';

export function setFormatCurrencyOptions(opts: { currency: string }): void {
  currencyCode = opts.currency;
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currencyCode,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatPercent(value: number): string {
  return `${value.toFixed(1)}%`;
}

export interface DebtPayoffMonth {
  month: number;
  balance: number;
  interest: number;
  payment: number;
}

export function projectDebtPayoff(debt: Debt): DebtPayoffMonth[] {
  const months: DebtPayoffMonth[] = [];
  let balance = debt.balance;
  const monthlyRate = debt.interestRate / 100 / 12;
  const payment = debt.minimumPayment + debt.extraPayment;
  let month = 0;

  while (balance > 0 && month < 360) {
    const interest = balance * monthlyRate;
    const principal = Math.min(payment - interest, balance);
    balance = Math.max(0, balance - principal);
    month++;
    months.push({ month, balance, interest, payment });
  }
  return months;
}
