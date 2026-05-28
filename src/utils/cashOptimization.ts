/**
 * Cash optimization layer — purely advisory, no side effects.
 *
 * Given a user-supplied "available cash" figure, this module recommends how
 * to allocate it across priority buckets based on their financial data.  It
 * does NOT modify any stored data; it only produces recommendation output.
 */
import type { AppData, InsightPriority, Page } from '../types';
import { monthlyCoreExpenses } from './emergencyFund';

// ─── Types ────────────────────────────────────────────────────────────────────

export type CashBucketKind =
  | 'high-interest-debt'
  | 'emergency-fund'
  | 'planned-expense'
  | 'savings-goal'
  | 'reserve';

export interface CashBucket {
  id: string;
  kind: CashBucketKind;
  label: string;
  /** Recommended allocation amount from available cash */
  amount: number;
  /** Short explanation for why this bucket matters */
  rationale: string;
  priority: InsightPriority;
  actionPage?: Page;
}

export interface CashOptimizationResult {
  availableCash: number;
  buckets: CashBucket[];
  /** Sum of all bucket amounts (equals availableCash when a reserve exists) */
  allocatedTotal: number;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const HIGH_INTEREST_APR_THRESHOLD = 10;
const EF_SAFE_MONTHS = 3;

// ─── Main function ────────────────────────────────────────────────────────────

export function optimizeCash(
  data: AppData,
  availableCash: number,
): CashOptimizationResult {
  if (availableCash <= 0) {
    return { availableCash: 0, buckets: [], allocatedTotal: 0 };
  }

  const buckets: CashBucket[] = [];
  let remaining = availableCash;

  // ── Priority 1: High-interest debt (> 10% APR) ──────────────────────────
  const hiDebts = data.debts.filter(
    (d) => d.interestRate > HIGH_INTEREST_APR_THRESHOLD && d.balance > 0,
  );
  if (hiDebts.length > 0 && remaining > 0) {
    const totalBalance = hiDebts.reduce((s, d) => s + d.balance, 0);
    const alloc = Math.min(totalBalance, remaining);
    const nameList = hiDebts
      .slice(0, 2)
      .map((d) => d.name)
      .join(', ');
    const extra = hiDebts.length > 2 ? ` +${hiDebts.length - 2} more` : '';
    const avgRate = (
      hiDebts.reduce((s, d) => s + d.interestRate, 0) / hiDebts.length
    ).toFixed(1);
    buckets.push({
      id: 'high-interest-debt',
      kind: 'high-interest-debt',
      label: 'High-interest debt',
      amount: alloc,
      rationale: `${nameList}${extra} — avg ${avgRate}% APR. Paying these down delivers a guaranteed return equal to the interest rate saved.`,
      priority: 'critical',
      actionPage: 'debt',
    });
    remaining -= alloc;
  }

  // ── Priority 2: Emergency fund (< 3 months) ─────────────────────────────
  if (remaining > 0) {
    const coreExpenses = monthlyCoreExpenses(data.expenses);
    const efGap = Math.max(
      0,
      coreExpenses * EF_SAFE_MONTHS - data.emergencyFund.currentAmount,
    );
    if (efGap > 0) {
      const alloc = Math.min(efGap, remaining);
      const currentMonths =
        coreExpenses > 0 ? data.emergencyFund.currentAmount / coreExpenses : 0;
      buckets.push({
        id: 'emergency-fund',
        kind: 'emergency-fund',
        label: 'Emergency fund',
        amount: alloc,
        rationale: `Currently ${currentMonths.toFixed(1)} months of expenses covered. Topping up to ${EF_SAFE_MONTHS} months protects against job loss or unexpected costs.`,
        priority: 'warning',
        actionPage: 'savings',
      });
      remaining -= alloc;
    }
  }

  // ── Priority 3: Planned expenses with remaining balance ──────────────────
  if (remaining > 0) {
    const now = new Date();
    const openPlanned = data.expenses.filter((e) => {
      if (!e.isPlannedExpense || !e.targetAmount || !e.targetDate) return false;
      const saved = e.currentSavedOrPaid ?? 0;
      if (saved >= e.targetAmount) return false;
      const dueDate = new Date(e.targetDate + 'T00:00:00');
      return dueDate > now;
    });
    if (openPlanned.length > 0) {
      const totalShortfall = openPlanned.reduce(
        (s, e) => s + Math.max(0, (e.targetAmount ?? 0) - (e.currentSavedOrPaid ?? 0)),
        0,
      );
      const alloc = Math.min(totalShortfall, remaining);
      if (alloc > 0) {
        const nameList = openPlanned
          .slice(0, 2)
          .map((e) => e.name)
          .join(', ');
        const extra = openPlanned.length > 2 ? ` +${openPlanned.length - 2} more` : '';
        buckets.push({
          id: 'planned-expenses',
          kind: 'planned-expense',
          label: 'Planned expenses',
          amount: alloc,
          rationale: `${nameList}${extra} — pre-funding these now reduces required monthly savings and prevents last-minute cash crunches.`,
          priority: 'warning',
          actionPage: 'expenses',
        });
        remaining -= alloc;
      }
    }
  }

  // ── Priority 4: Savings goals with remaining balance ─────────────────────
  if (remaining > 0) {
    const now = new Date();
    const openGoals = data.savingsGoals.filter((g) => {
      if (!g.targetAmount || !g.targetDate) return false;
      if (g.currentAmount >= g.targetAmount) return false;
      const dueDate = new Date(g.targetDate + 'T00:00:00');
      return dueDate > now;
    });
    if (openGoals.length > 0) {
      const totalShortfall = openGoals.reduce(
        (s, g) => s + Math.max(0, g.targetAmount - g.currentAmount),
        0,
      );
      const alloc = Math.min(totalShortfall, remaining);
      if (alloc > 0) {
        const nameList = openGoals
          .slice(0, 2)
          .map((g) => g.name)
          .join(', ');
        const extra = openGoals.length > 2 ? ` +${openGoals.length - 2} more` : '';
        buckets.push({
          id: 'savings-goals',
          kind: 'savings-goal',
          label: 'Savings goals',
          amount: alloc,
          rationale: `${nameList}${extra} — boosting these balances now shortens the timeline and reduces required monthly contributions.`,
          priority: 'opportunity',
          actionPage: 'savings',
        });
        remaining -= alloc;
      }
    }
  }

  // ── Priority 5: Healthy reserve ──────────────────────────────────────────
  if (remaining > 0) {
    const coreExpenses = monthlyCoreExpenses(data.expenses);
    const currentMonths =
      coreExpenses > 0 ? data.emergencyFund.currentAmount / coreExpenses : 0;
    const noHighDebt = hiDebts.length === 0;

    let rationale: string;
    if (noHighDebt && currentMonths >= 6) {
      rationale =
        'All major obligations are covered. Keep this as a liquid buffer or explore longer-term goals on the Savings page.';
    } else if (currentMonths >= EF_SAFE_MONTHS) {
      rationale =
        'Core obligations are on track. This reserve adds flexibility for lifestyle and upcoming opportunities.';
    } else {
      rationale =
        'Hold as liquid cash reserves or direct to your emergency fund for added security.';
    }

    buckets.push({
      id: 'reserve',
      kind: 'reserve',
      label: 'Liquid reserve',
      amount: remaining,
      rationale,
      priority: 'healthy',
    });
    remaining = 0;
  }

  return {
    availableCash,
    buckets,
    allocatedTotal: availableCash - remaining,
  };
}

// ─── Display helpers ──────────────────────────────────────────────────────────

/** Tailwind color tokens per bucket kind, for both bar segments and badges. */
export const BUCKET_COLORS: Record<
  CashBucketKind,
  { bar: string; badge: string; dot: string }
> = {
  'high-interest-debt': {
    bar: 'bg-rose-500',
    badge: 'bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300',
    dot: 'bg-rose-500',
  },
  'emergency-fund': {
    bar: 'bg-amber-500',
    badge: 'bg-amber-100 text-amber-800 dark:bg-amber-500/15 dark:text-amber-300',
    dot: 'bg-amber-500',
  },
  'planned-expense': {
    bar: 'bg-violet-500',
    badge: 'bg-violet-100 text-violet-700 dark:bg-violet-500/15 dark:text-violet-300',
    dot: 'bg-violet-500',
  },
  'savings-goal': {
    bar: 'bg-indigo-500',
    badge: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-500/15 dark:text-indigo-300',
    dot: 'bg-indigo-500',
  },
  reserve: {
    bar: 'bg-emerald-500',
    badge: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300',
    dot: 'bg-emerald-500',
  },
};
