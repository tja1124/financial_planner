export interface IncomeSource {
  id: string;
  name: string;
  amount: number;
  frequency: 'monthly' | 'biweekly' | 'weekly' | 'annually';
}

export interface Expense {
  id: string;
  name: string;
  amount: number;
  category: ExpenseCategory;
  isFixed: boolean;
}

export type ExpenseCategory =
  | 'Housing'
  | 'Transportation'
  | 'Food'
  | 'Healthcare'
  | 'Entertainment'
  | 'Utilities'
  | 'Subscriptions'
  | 'Clothing'
  | 'Personal'
  | 'Other';

export interface Debt {
  id: string;
  name: string;
  balance: number;
  interestRate: number;
  minimumPayment: number;
  extraPayment: number;
}

export interface SavingsGoal {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  targetDate: string;
}

export interface AppData {
  income: IncomeSource[];
  expenses: Expense[];
  debts: Debt[];
  savingsGoals: SavingsGoal[];
}

export interface FinancialSummary {
  totalMonthlyIncome: number;
  totalMonthlyExpenses: number;
  totalMonthlyDebtPayments: number;
  totalMonthlySavingsContributions: number;
  monthlyLeftover: number;
  safeWeeklySpending: number;
}
