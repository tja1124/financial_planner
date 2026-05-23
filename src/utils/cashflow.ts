import type { AppData, CashflowMonth } from '../types';
import { totalMonthlyIncome, totalMonthlyExpenses } from './calculations';
import { simulateDebtStrategy } from './debtStrategies';

const MONTH_NAMES = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

function monthLabel(offset: number): string {
  const d = new Date();
  d.setMonth(d.getMonth() + offset);
  return `${MONTH_NAMES[d.getMonth()]} ${d.getFullYear()}`;
}

/** Month-by-month debt payment schedule from custom-strategy simulation */
function buildDebtPaymentSchedule(debts: AppData['debts'], months: number): number[] {
  if (debts.length === 0) return Array(months).fill(0);

  const sim = debts.map((d) => ({
    balance: d.balance,
    monthlyRate: d.interestRate / 100 / 12,
    minimumPayment: d.minimumPayment,
    extraPayment: d.extraPayment,
  }));

  const payments: number[] = [];

  for (let m = 0; m < months; m++) {
    let monthPayment = 0;
    const active = sim.filter((d) => d.balance > 0.01);
    if (active.length === 0) {
      payments.push(0);
      continue;
    }

    for (const d of active) {
      const interest = d.balance * d.monthlyRate;
      d.balance += interest;
    }

    for (const d of active) {
      const min = Math.min(d.minimumPayment, d.balance);
      d.balance -= min;
      monthPayment += min;
    }

    const stillActive = sim.filter((d) => d.balance > 0.01);
    const totalExtra = stillActive.reduce((s, d) => s + d.extraPayment, 0);
    let extraLeft = totalExtra;
    const sorted = [...stillActive].sort((a, b) => a.balance - b.balance);
    for (const d of sorted) {
      if (extraLeft <= 0 || d.balance <= 0) break;
      const pay = Math.min(extraLeft, d.balance);
      d.balance -= pay;
      monthPayment += pay;
      extraLeft -= pay;
    }

    payments.push(Math.round(monthPayment));
  }

  return payments;
}

export function projectCashflow(data: AppData, monthCount = 12): CashflowMonth[] {
  const income = totalMonthlyIncome(data.income);
  const expenses = totalMonthlyExpenses(data.expenses);
  const debtPayments = buildDebtPaymentSchedule(data.debts, monthCount);

  const savingsBase = data.savingsGoals.reduce((sum, g) => {
    const now = new Date();
    const target = new Date(g.targetDate);
    const months =
      (target.getFullYear() - now.getFullYear()) * 12 +
      (target.getMonth() - now.getMonth());
    if (months <= 0) return sum;
    return sum + Math.max(0, g.targetAmount - g.currentAmount) / months;
  }, 0);

  let cumulative = 0;
  const result: CashflowMonth[] = [];

  for (let i = 0; i < monthCount; i++) {
    const debt = debtPayments[i] ?? 0;
    const leftover = income - expenses - debt - savingsBase;
    cumulative += leftover;

    result.push({
      month: i + 1,
      label: monthLabel(i),
      income: Math.round(income),
      expenses: Math.round(expenses),
      debtPayments: debt,
      savings: Math.round(savingsBase),
      leftover: Math.round(leftover),
      cumulativeCash: Math.round(cumulative),
    });
  }

  return result;
}

/** Quick sanity: total debt-free month from strategy sim */
export function debtFreeMonth(data: AppData): number {
  return simulateDebtStrategy(data.debts, 'custom').payoffMonths;
}
