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

export type DebtStrategy = 'snowball' | 'avalanche' | 'custom';

export type ScenarioPreset =
  | 'current'
  | 'aggressive-debt'
  | 'higher-savings'
  | 'lower-spending'
  | 'custom';

export interface ScenarioAdjustments {
  expenseMultiplier: number;
  extraDebtPayment: number;
  savingsMultiplier: number;
}

export interface ScenarioMetrics {
  label: string;
  preset: ScenarioPreset;
  monthlyLeftover: number;
  safeWeeklySpending: number;
  debtPayoffMonths: number;
  totalDebtInterest: number;
  monthlySavingsContribution: number;
  emergencyFundMonths: number | null;
  emergencyFundTarget: number;
}

export interface DebtStrategyResult {
  strategy: DebtStrategy;
  payoffMonths: number;
  totalInterest: number;
  timeline: { month: number; totalBalance: number }[];
}

export interface CashflowMonth {
  month: number;
  label: string;
  income: number;
  expenses: number;
  debtPayments: number;
  savings: number;
  leftover: number;
  cumulativeCash: number;
}

export type InsightPriority = 'critical' | 'warning' | 'healthy' | 'opportunity';

export interface Recommendation {
  id: string;
  priority: InsightPriority;
  title: string;
  description: string;
  actionPage?: 'income' | 'expenses' | 'debt' | 'savings' | 'scenarios';
  /** Positive reinforcement vs caution */
  tone?: 'positive' | 'neutral' | 'caution';
}

export type CurrencyCode = 'USD' | 'EUR' | 'GBP' | 'CAD' | 'AUD';

export interface AppSettings {
  currency: CurrencyCode;
  weekStartsOn: 0 | 1;
  compactMode: boolean;
  reducedMotion: boolean;
  exportIncludeTimestamp: boolean;
}

export interface HealthScoreFactor {
  id: string;
  label: string;
  score: number;
  weight: number;
  description: string;
}

export interface HealthScoreResult {
  overall: number;
  grade: 'critical' | 'warning' | 'fair' | 'good' | 'excellent';
  factors: HealthScoreFactor[];
}

export type Page =
  | 'dashboard'
  | 'scenarios'
  | 'income'
  | 'expenses'
  | 'debt'
  | 'savings';
