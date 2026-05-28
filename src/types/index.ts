/** Tax assumptions used when an income source is entered as gross pay. */
export interface TaxProfile {
  /** Effective federal income tax rate as a percentage, e.g. 14 for 14%. */
  federalRate: number;
  /** Effective state income tax rate as a percentage, e.g. 5.39 for 5.39%. */
  stateRate: number;
  /** FICA (Social Security + Medicare) rate as a percentage, e.g. 7.65. */
  ficaRate: number;
  /** Monthly pre-tax deductions in dollars (401k, HSA, etc.). */
  pretaxDeductionsMonthly: number;
  /** Monthly post-tax deductions in dollars. */
  posttaxDeductionsMonthly: number;
}

export interface IncomeSource {
  id: string;
  name: string;
  amount: number;
  frequency: 'monthly' | 'biweekly' | 'weekly' | 'annually';
  /**
   * When false (default) the entered amount is treated as net take-home pay.
   * When true, the tax estimation layer derives net from the gross amount.
   */
  isGross?: boolean;
  /** Tax assumptions applied when isGross is true. */
  taxProfile?: TaxProfile;
}

export interface Expense {
  id: string;
  name: string;
  /** For recurring expenses: the monthly amount.
   *  For planned expenses: the computed monthly-required (auto-set on save). */
  amount: number;
  category: ExpenseCategory;
  isFixed: boolean;
  /** true = sinking-fund / one-time planned expense */
  isPlannedExpense?: boolean;
  /** Total cost of the planned expense */
  targetAmount?: number;
  /** Amount already saved or paid toward the planned expense */
  currentSavedOrPaid?: number;
  /** Date the planned expense must be paid */
  targetDate?: string;
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
  /** Planned recurring monthly contribution (not a one-time deposit). */
  monthlyContribution: number;
}

/** Built-in emergency reserve — always present, not deletable. */
export interface EmergencyFund {
  id: 'emergency-fund';
  name: string;
  currentAmount: number;
  targetAmount: number;
  /** Planned recurring monthly contribution (not a one-time deposit). */
  monthlyContribution: number;
}

export interface AppData {
  income: IncomeSource[];
  expenses: Expense[];
  debts: Debt[];
  emergencyFund: EmergencyFund;
  /** Optional dated goals (vacation, wedding, etc.) — excludes emergency fund. */
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
  /** Stable recommendation IDs hidden from the dashboard insights list */
  acknowledgedInsightIds: string[];
  /** Available cash for allocation planning on the dashboard (not used in budget calculations) */
  availableCash: number;
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
