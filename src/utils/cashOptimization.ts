/**
 * Cash allocation strategy — educational lump-sum deployment guidance.
 *
 * Staging philosophy:
 *   1. Keep a minimum cash buffer (mode-dependent, NOT a full 3-month EF).
 *   2. Reserve near-term planned expenses (due ≤ 12 months).
 *   3. Attack high-APR debt (≥ 15%) BEFORE topping up the EF further.
 *      High-interest debt often costs more per dollar than the benefit of
 *      holding extra reserves, so this plan keeps a basic safety cushion
 *      and attacks the expensive balance first.
 *   4. Top up EF toward the mode target (3 or 6 months).
 *   5. Pay down remaining lower-APR debt.
 *   6. Leftover = liquidity.
 *
 * Does NOT modify stored data.
 */
import type { AppData, Debt, Expense } from '../types';
import { projectDebtPayoff } from './calculations';
import { monthlyCoreExpenses } from './emergencyFund';

// ─── Public types ─────────────────────────────────────────────────────────────

/**
 * How much to buffer before debt payoff — and how far to top up the EF
 * after high-interest debt is handled.
 *
 * conservative: 2-month min buffer · top EF toward 6 months after high-APR debt
 * balanced:     1-month min buffer · top EF toward 3 months after high-APR debt
 * aggressive:   0.5-month min buffer · skip EF top-up, deploy everything to debt
 */
export type ReserveMode = 'conservative' | 'balanced' | 'aggressive';

export type WaterfallKind =
  | 'min-buffer'         // minimum safety cash — cyan/teal
  | 'planned-reserve'    // near-term planned expenses — violet
  | 'high-interest-debt' // APR ≥ 15% payoff — rose
  | 'ef-topup'           // EF filled after high-APR debt — amber
  | 'other-debt'         // remaining lower-APR debt — orange
  | 'liquidity';         // undeployed remainder — slate

export interface CashWaterfallSegment {
  id: string;
  kind: WaterfallKind;
  label: string;
  amount: number;
  /** Legend text when amount is $0 but the category still applies (e.g. buffer already met). */
  amountNote?: string;
}

export type PayoffPriority = 'high' | 'moderate' | 'low';

export interface DebtPayoffRecommendation {
  debtId: string;
  rank: number;
  name: string;
  apr: number;
  balance: number;
  monthlyPayment: number;
  remainingMonths: number;
  totalFutureInterest: number;
  suggestedPayoff: number;
  remainingAfterPayoff: number;
  interestSaved: number;
  monthlyCashflowFreed: number;
  priority: PayoffPriority;
  priorityScore: number;
  whyReasons: string[];
}

export interface CashAllocationStrategy {
  availableCash: number;
  reserveMode: ReserveMode;
  /** Recurring expenses + minimum debt payments. */
  coreMonthlyObligations: number;
  /** Minimum buffer target = bufferMonths × core obligations. */
  emergencyFloorTarget: number;
  /** Full reserve target (3 or 6 months depending on mode). */
  strongReserveTarget: number;
  /** EF months after this plan runs. */
  emergencyRunwayMonths: number;
  /** Amount reserved as minimum buffer. */
  emergencyReserveAmount: number;
  /** True when EF already meets the mode minimum buffer — $0 additional needed. */
  minBufferAlreadyCovered: boolean;
  /** Amount reserved for near-term planned expenses. */
  plannedReserveAmount: number;
  /** Amount used to top up the EF after high-APR debt. */
  efTopUpAmount: number;
  /** Total retained (buffer + planned + EF top-up). */
  recommendedRetained: number;
  deployableCash: number;
  remainingLiquidity: number;
  totalInterestAvoided: number;
  totalCashflowFreed: number;
  debtRecommendations: DebtPayoffRecommendation[];
  /** Global “Why this strategy?” bullets (3–6), from actual allocation inputs. */
  strategyExplanations: string[];
  /** @deprecated Use strategyExplanations — kept for compatibility. */
  insights: string[];
  waterfall: CashWaterfallSegment[];
}

// ─── Constants ────────────────────────────────────────────────────────────────

const PLANNED_HORIZON_MONTHS = 12;
const HIGH_APR_THRESHOLD = 15; // deploy before EF top-up
const SMALL_BALANCE = 1_500;
const MODERATE_BALANCE = 4_000;
const LOW_APR = 6;   // below: secondary factors heavily damped
const MOD_APR = 10;  // above: no damping

// Minimum buffer months before any debt payoff — by mode
const BUFFER_MONTHS: Record<ReserveMode, number> = {
  conservative: 2,
  balanced: 1,
  aggressive: 0.5,
};

// EF top-up target months (after high-APR debt) — by mode
const EF_TARGET_MONTHS: Record<ReserveMode, number | null> = {
  conservative: 6,
  balanced: 3,
  aggressive: null, // skip top-up, deploy to debt instead
};

// ─── Core obligations ─────────────────────────────────────────────────────────

export function monthlyCoreObligations(expenses: Expense[], debts: Debt[]): number {
  return (
    monthlyCoreExpenses(expenses) +
    debts.reduce((s, d) => s + d.minimumPayment, 0)
  );
}

function plannedShortfallWithinMonths(expenses: Expense[], months: number): number {
  const now = new Date();
  const horizon = new Date(now);
  horizon.setMonth(horizon.getMonth() + months);
  return expenses
    .filter((e) => e.isPlannedExpense && e.targetAmount && e.targetDate)
    .filter((e) => {
      const saved = e.currentSavedOrPaid ?? 0;
      if (saved >= (e.targetAmount ?? 0)) return false;
      const due = new Date(`${e.targetDate}T00:00:00`);
      return due > now && due <= horizon;
    })
    .reduce(
      (s, e) => s + Math.max(0, (e.targetAmount ?? 0) - (e.currentSavedOrPaid ?? 0)),
      0,
    );
}

// ─── Debt analytics ───────────────────────────────────────────────────────────

function futureInterestForDebt(debt: Debt): number {
  return projectDebtPayoff(debt).reduce((s, m) => s + m.interest, 0);
}

function payoffMonthsForDebt(debt: Debt): number {
  return projectDebtPayoff(debt).length;
}

function interestSavedByLumpSum(debt: Debt, lumpSum: number): number {
  if (lumpSum <= 0) return 0;
  const original = futureInterestForDebt(debt);
  const newBalance = Math.max(0, debt.balance - lumpSum);
  if (newBalance <= 0.01) return Math.round(original);
  const modified = { ...debt, balance: newBalance };
  return Math.round(Math.max(0, original - futureInterestForDebt(modified)));
}

/**
 * Priority score (0–100) — APR is the dominant axis via a continuous curve.
 * Secondary factors (balance, payment, timeline) are damped for low-APR debt
 * so they cannot override the APR ordering between tiers.
 *
 * APR anchors:  ≥20%→65–70  15–20%→55–65  10–15%→40–55  6–10%→12–40  <6%→0–12
 * Secondary max: ~25 pts before damping
 * Damping:  <6%→×0.25   6–10%→×0.55   ≥10%→×1.0
 */
export function scoreDebtPayoffPriority(debt: Debt): number {
  if (debt.balance <= 0) return 0;
  const apr = debt.interestRate;

  let aprScore: number;
  if (apr >= 20) aprScore = 65 + Math.min(5, (apr - 20) * 0.5);
  else if (apr >= 15) aprScore = 55 + (apr - 15) * 2;
  else if (apr >= MOD_APR) aprScore = 40 + (apr - MOD_APR) * 3;
  else if (apr >= LOW_APR) aprScore = 12 + (apr - LOW_APR) * 7;
  else aprScore = apr * 2;

  let secondary = 0;
  if (debt.balance <= SMALL_BALANCE) secondary += 14;
  else if (debt.balance <= MODERATE_BALANCE) secondary += 7;

  const payment = debt.minimumPayment + debt.extraPayment;
  if (payment >= 400) secondary += 7;
  else if (payment >= 200) secondary += 4;

  const months = payoffMonthsForDebt(debt);
  if (months > 0 && months < 360) {
    if (months > 120) secondary += 4;
    else if (months > 60) secondary += 2;
    else if (months <= 12) secondary -= 3;
  }

  const weight = apr >= MOD_APR ? 1.0 : apr >= LOW_APR ? 0.55 : 0.25;
  return Math.round(Math.min(100, Math.max(0, aprScore + secondary * weight)));
}

function priorityFromScore(score: number): PayoffPriority {
  if (score >= 55) return 'high';
  if (score >= 28) return 'moderate';
  return 'low';
}

/** Contextual paragraph under the reserve mode selector. */
export function buildReserveModeExplanation(mode: ReserveMode): string {
  switch (mode) {
    case 'conservative':
      return 'Prioritizes stability and larger reserves before aggressive debt reduction.';
    case 'balanced':
      return 'Balances emergency preparedness with faster high-interest debt payoff.';
    case 'aggressive':
      return 'Keeps a small cash buffer, then prioritizes high-interest debt.';
  }
}

interface DebtReasoningInput {
  debt: Debt;
  rank: number;
  suggestedPayoff: number;
  interestSaved: number;
  monthlyCashflowFreed: number;
  allActiveDebts: Debt[];
}

/** Structured per-debt explanation bullets for “Why this recommendation?” */
export function buildDebtReasoning(input: DebtReasoningInput): string[] {
  const {
    debt,
    rank,
    suggestedPayoff,
    interestSaved,
    monthlyCashflowFreed,
    allActiveDebts,
  } = input;
  const reasons: string[] = [];
  const apr = debt.interestRate;
  const payment = debt.minimumPayment + debt.extraPayment;
  const months = payoffMonthsForDebt(debt);
  const futureInterest = futureInterestForDebt(debt);
  const active = allActiveDebts.filter((d) => d.balance > 0);
  const maxApr = active.length > 0 ? Math.max(...active.map((d) => d.interestRate)) : 0;
  const minApr = active.length > 0 ? Math.min(...active.map((d) => d.interestRate)) : 0;
  const isHighestApr =
    active.length > 1 && apr >= maxApr - 0.01;
  const isLowestApr =
    active.length > 1 && apr <= minApr + 0.01 && minApr < HIGH_APR_THRESHOLD;

  if (suggestedPayoff === 0) {
    reasons.push(
      'Lower priority because higher-rate debts are funded first with the cash available in this plan.',
    );
    if (isHighestApr && rank > 1) {
      reasons.push(
        'This balance has a high rate, but earlier allocations used the available cash — add more cash or try Aggressive mode.',
      );
    } else if (apr >= HIGH_APR_THRESHOLD) {
      reasons.push(
        `At ${apr.toFixed(1)}% APR, this debt is costly — increasing available cash would allow an allocation here.`,
      );
    } else if (apr < LOW_APR) {
      reasons.push(
        `${apr.toFixed(1)}% APR is relatively moderate compared with your other debts, so it ranks after more expensive balances.`,
      );
    } else {
      reasons.push(
        'Increase available cash or choose Aggressive mode if you want this balance to receive a lump-sum payment.',
      );
    }
    if (isLowestApr) {
      reasons.push(
        'Among your debts, this has one of the lowest rates — efficient to address after higher-cost balances.',
      );
    }
    return reasons.slice(0, 5);
  }

  if (isHighestApr) {
    reasons.push(
      `Highest APR in your debt portfolio (${apr.toFixed(1)}%) — interest cost per dollar is greatest here.`,
    );
  } else if (apr >= HIGH_APR_THRESHOLD) {
    reasons.push(
      `High APR (${apr.toFixed(1)}%) — paying this balance down provides a return similar to eliminating expensive interest.`,
    );
  } else if (apr >= MOD_APR) {
    reasons.push(
      `Moderate-to-high rate (${apr.toFixed(1)}%) — allocated after your highest-cost balances are addressed.`,
    );
  } else if (apr < LOW_APR) {
    reasons.push(
      `Lower APR (${apr.toFixed(1)}%) than your other debts — longer-term, more manageable interest relative to revolving balances.`,
    );
  } else {
    reasons.push(
      `APR of ${apr.toFixed(1)}% — ranked #${rank} based on rate, payment size, and remaining balance.`,
    );
  }

  if (active.length > 1 && !isHighestApr && maxApr >= HIGH_APR_THRESHOLD) {
    const top = active.find((d) => d.interestRate >= maxApr - 0.01);
    if (top && top.id !== debt.id) {
      reasons.push(
        `${top.name} at ${maxApr.toFixed(1)}% APR is addressed first; this debt’s rate is lower by comparison.`,
      );
    }
  }

  const fullPayoff = suggestedPayoff >= debt.balance - 0.01;
  if (fullPayoff) {
    reasons.push(
      `Suggested payoff of ${formatCompact(suggestedPayoff)} would clear the ${formatCompact(debt.balance)} balance.`,
    );
  } else if (suggestedPayoff > 0) {
    reasons.push(
      `Allocates ${formatCompact(suggestedPayoff)} toward the balance, leaving about ${formatCompact(debt.balance - suggestedPayoff)} remaining.`,
    );
  }

  if (monthlyCashflowFreed > 0) {
    reasons.push(
      `Paying this off would free ${formatCompact(monthlyCashflowFreed)}/month in payments.`,
    );
  } else if (payment >= 200 && !fullPayoff) {
    reasons.push(
      `Monthly payment of ${formatCompact(payment)} would continue until the remaining balance is paid down.`,
    );
  }

  if (interestSaved >= 500) {
    reasons.push(
      `Estimated interest savings of about ${formatCompact(interestSaved)} versus continuing current payments on this balance.`,
    );
  } else if (interestSaved > 0) {
    reasons.push(
      `Roughly ${formatCompact(interestSaved)} in estimated interest avoided with this lump-sum allocation.`,
    );
  }

  if (months > 0 && months < 360 && months > 84 && apr >= LOW_APR) {
    reasons.push(
      `At the current payment pace, about ${months} months remain — interest can accumulate for years without extra principal.`,
    );
  }

  if (months >= 360 && payment > 0) {
    const monthlyInterest = debt.balance * (apr / 100 / 12);
    if (payment < monthlyInterest * 1.1) {
      reasons.push(
        'Payments are close to the interest charged each month — a lump sum helps the balance actually shrink.',
      );
    }
  }

  if (futureInterest > 1_000 && apr >= MOD_APR && interestSaved === 0) {
    reasons.push(
      `About ${formatCompact(debt.balance * (apr / 100))}/year in interest at the current balance if payments stay on the current schedule.`,
    );
  }

  if (debt.balance <= SMALL_BALANCE && fullPayoff) {
    reasons.push('Small balance — eliminating it in one step simplifies your monthly obligations.');
  }

  return reasons.slice(0, 5);
}

interface StrategyInsightInput {
  data: AppData;
  reserveMode: ReserveMode;
  efBeforePlanMonths: number;
  emergencyRunwayMonths: number;
  emergencyReserveAmount: number;
  minBufferAlreadyCovered: boolean;
  emergencyFloorTarget: number;
  bufferMonths: number;
  plannedReserveAmount: number;
  efTopUpAmount: number;
  highAprDebtTotal: number;
  hasHighAprDebtBeforeEfFull: boolean;
  debtRecommendations: DebtPayoffRecommendation[];
  availableCash: number;
  remainingLiquidity: number;
  strongReserveTarget: number;
}

/** Global strategy bullets for “Why this strategy?” (3–6 items). */
export function buildStrategyInsights(input: StrategyInsightInput): string[] {
  const bullets: string[] = [];
  const {
    data,
    reserveMode,
    efBeforePlanMonths,
    emergencyRunwayMonths,
    emergencyReserveAmount,
    minBufferAlreadyCovered,
    emergencyFloorTarget,
    bufferMonths,
    plannedReserveAmount,
    efTopUpAmount,
    highAprDebtTotal,
    hasHighAprDebtBeforeEfFull,
    debtRecommendations,
    availableCash,
    remainingLiquidity,
    strongReserveTarget,
  } = input;

  const activeDebts = data.debts.filter((d) => d.balance > 0);
  const topHighApr = debtRecommendations.find(
    (r) => r.apr >= HIGH_APR_THRESHOLD && r.suggestedPayoff > 0,
  );
  const unpaidHighApr = debtRecommendations.find(
    (r) => r.apr >= HIGH_APR_THRESHOLD && r.suggestedPayoff === 0,
  );
  const lowAprDebts = debtRecommendations.filter((r) => r.apr < LOW_APR);

  const modeLabel = reserveMode === 'conservative' ? 'Conservative' : reserveMode === 'balanced' ? 'Balanced' : 'Aggressive';
  const modeExplanation = buildReserveModeExplanation(reserveMode);
  bullets.push(
    `This plan uses a ${modeLabel.toLowerCase()} reserve approach: ${modeExplanation.charAt(0).toLowerCase()}${modeExplanation.slice(1)}`,
  );

  if (topHighApr) {
    if (topHighApr.apr >= 20) {
      bullets.push(
        `Your ${topHighApr.name} at ${topHighApr.apr.toFixed(1)}% APR is extremely high — paying it down provides a return similar to eliminating that interest cost.`,
      );
    } else {
      bullets.push(
        `${topHighApr.name} at ${topHighApr.apr.toFixed(1)}% APR receives priority because it costs the most per dollar of balance.`,
      );
    }
  }

  if (hasHighAprDebtBeforeEfFull && highAprDebtTotal > 0) {
    bullets.push(
      'High-interest debt can cost more than the benefit of holding extra cash, so this plan keeps a basic buffer and attacks the expensive balance first.',
    );
  }

  if (minBufferAlreadyCovered) {
    bullets.push(
      `Your emergency fund already meets the ${bufferMonths}-month minimum buffer (${formatCompact(emergencyFloorTarget)}) — no additional cash is reserved for the buffer in this plan.`,
    );
  } else if (emergencyReserveAmount > 0) {
    bullets.push(
      `About ${formatCompact(emergencyReserveAmount)} is set aside first to reach your ${bufferMonths}-month minimum cash buffer (${formatCompact(emergencyFloorTarget)}) before debt payoff.`,
    );
  } else if (efBeforePlanMonths >= bufferMonths && highAprDebtTotal > 0) {
    bullets.push(
      `You already have about ${efBeforePlanMonths.toFixed(1)} month${efBeforePlanMonths === 1 ? '' : 's'} of core obligations in reserves, allowing more cash to safely go toward debt.`,
    );
  }

  if (plannedReserveAmount > 0) {
    bullets.push(
      `Planned expenses due within 12 months (${formatCompact(plannedReserveAmount)} reserved) are funded before longer-term debt reduction.`,
    );
  }

  if (efTopUpAmount > 0 && reserveMode !== 'aggressive') {
    const targetLabel = reserveMode === 'conservative' ? '6-month' : '3-month';
    bullets.push(
      `After high-interest debt, ${formatCompact(efTopUpAmount)} tops up your emergency fund toward a ${targetLabel} target (${formatCompact(strongReserveTarget)}).`,
    );
  }

  if (lowAprDebts.length > 0 && topHighApr) {
    const names = lowAprDebts.map((r) => r.name).slice(0, 2).join(' and ');
    const extra = lowAprDebts.length > 2 ? ` and ${lowAprDebts.length - 2} more` : '';
    bullets.push(
      `${names}${extra} rank lower because their interest rates are relatively moderate compared with higher-cost debt.`,
    );
  }

  if (remainingLiquidity > 0) {
    bullets.push(
      `${formatCompact(remainingLiquidity)} remains liquid after allocations — maintaining some cash reduces the risk of needing future high-interest borrowing.`,
    );
  } else if (availableCash > 0 && activeDebts.length === 0) {
    bullets.push(
      'With no active debt, available cash can stay liquid or be directed toward savings goals.',
    );
  }

  if (unpaidHighApr) {
    bullets.push(
      `${unpaidHighApr.name} (${unpaidHighApr.apr.toFixed(1)}% APR) is not fully reached with ${formatCompact(availableCash)} available — consider Aggressive mode or adding cash.`,
    );
  }

  if (emergencyRunwayMonths >= 3 && reserveMode === 'conservative') {
    bullets.push(
      `After this plan, your emergency fund would cover about ${emergencyRunwayMonths.toFixed(1)} months of core obligations — a stronger cushion for income shocks.`,
    );
  }

  const totalDebtDeployed = debtRecommendations.reduce((s, r) => s + r.suggestedPayoff, 0);
  if (bullets.length < 3 && totalDebtDeployed > 0) {
    bullets.push(
      `About ${formatCompact(totalDebtDeployed)} of ${formatCompact(availableCash)} is directed toward debt, ranked by interest cost and payment impact.`,
    );
  }

  if (bullets.length < 3 && activeDebts.length > 0) {
    bullets.push(
      'Maintaining some liquidity alongside debt payoff helps reduce the risk of needing future high-interest borrowing.',
    );
  }

  const unique = [...new Set(bullets)];
  return unique.slice(0, 6);
}

function buildDebtRecommendation(
  debt: Debt,
  rank: number,
  suggested: number,
  allActiveDebts: Debt[],
): DebtPayoffRecommendation {
  const futureInterest = futureInterestForDebt(debt);
  const months = payoffMonthsForDebt(debt);
  const payment = debt.minimumPayment + debt.extraPayment;
  const fullPayoff = suggested >= debt.balance - 0.01;
  const interestSaved = interestSavedByLumpSum(debt, suggested);

  return {
    debtId: debt.id,
    rank,
    name: debt.name,
    apr: debt.interestRate,
    balance: debt.balance,
    monthlyPayment: payment,
    remainingMonths: months,
    totalFutureInterest: Math.round(futureInterest),
    suggestedPayoff: Math.round(suggested),
    remainingAfterPayoff: Math.max(0, Math.round(debt.balance - suggested)),
    interestSaved,
    monthlyCashflowFreed: fullPayoff ? payment : 0,
    priority: priorityFromScore(scoreDebtPayoffPriority(debt)),
    priorityScore: scoreDebtPayoffPriority(debt),
    whyReasons: buildDebtReasoning({
      debt,
      rank,
      suggestedPayoff: Math.round(suggested),
      interestSaved,
      monthlyCashflowFreed: fullPayoff ? payment : 0,
      allActiveDebts,
    }),
  };
}

function rankByScore(debts: Debt[]): Debt[] {
  return [...debts].sort((a, b) => scoreDebtPayoffPriority(b) - scoreDebtPayoffPriority(a));
}

function formatCompact(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(amount);
}

// ─── Waterfall ────────────────────────────────────────────────────────────────

function buildWaterfall(
  minBufferAmount: number,
  minBufferAlreadyCovered: boolean,
  plannedAmount: number,
  highAprDebtTotal: number,
  efTopUpAmount: number,
  otherDebtTotal: number,
  liquidity: number,
): CashWaterfallSegment[] {
  const segs: CashWaterfallSegment[] = [];
  if (minBufferAlreadyCovered) {
    segs.push({
      id: 'min-buffer',
      kind: 'min-buffer',
      label: 'Minimum cash buffer',
      amount: 0,
      amountNote: 'Already covered',
    });
  } else if (minBufferAmount > 0) {
    segs.push({
      id: 'min-buffer',
      kind: 'min-buffer',
      label: 'Minimum cash buffer',
      amount: minBufferAmount,
    });
  }
  if (plannedAmount > 0)
    segs.push({ id: 'planned', kind: 'planned-reserve', label: 'Planned expenses', amount: plannedAmount });
  if (highAprDebtTotal > 0)
    segs.push({ id: 'hi-debt', kind: 'high-interest-debt', label: 'High-interest debt', amount: highAprDebtTotal });
  if (efTopUpAmount > 0)
    segs.push({ id: 'ef-topup', kind: 'ef-topup', label: 'Extra reserve', amount: efTopUpAmount });
  if (otherDebtTotal > 0)
    segs.push({ id: 'other-debt', kind: 'other-debt', label: 'Other debt payoff', amount: otherDebtTotal });
  if (liquidity > 0)
    segs.push({ id: 'liquidity', kind: 'liquidity', label: 'Leftover cash', amount: liquidity });
  return segs;
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export function optimizeCash(
  data: AppData,
  availableCash: number,
  reserveMode: ReserveMode = 'balanced',
): CashAllocationStrategy {
  const empty: CashAllocationStrategy = {
    availableCash: 0,
    reserveMode,
    coreMonthlyObligations: 0,
    emergencyFloorTarget: 0,
    strongReserveTarget: 0,
    emergencyRunwayMonths: 0,
    emergencyReserveAmount: 0,
    minBufferAlreadyCovered: false,
    plannedReserveAmount: 0,
    efTopUpAmount: 0,
    recommendedRetained: 0,
    deployableCash: 0,
    remainingLiquidity: 0,
    totalInterestAvoided: 0,
    totalCashflowFreed: 0,
    debtRecommendations: [],
    strategyExplanations: [],
    insights: [],
    waterfall: [],
  };

  if (availableCash <= 0) return empty;

  const coreMonthly = monthlyCoreObligations(data.expenses, data.debts);
  const bufferMonths = BUFFER_MONTHS[reserveMode];
  const efTargetMonths = EF_TARGET_MONTHS[reserveMode];

  const emergencyFloorTarget = coreMonthly * bufferMonths;
  const strongReserveTarget = efTargetMonths != null ? coreMonthly * efTargetMonths : coreMonthly * 3;

  const currentEF = data.emergencyFund.currentAmount;

  let remaining = availableCash;

  // ── Phase 1: minimum cash buffer ─────────────────────────────────────────
  const minBufferGap = Math.max(0, emergencyFloorTarget - currentEF);
  const minBufferAlreadyCovered = minBufferGap <= 0 && emergencyFloorTarget > 0;
  const emergencyReserveAmount = Math.min(minBufferGap, remaining);
  remaining -= emergencyReserveAmount;

  // ── Phase 2: near-term planned expenses ──────────────────────────────────
  const plannedNeed = plannedShortfallWithinMonths(data.expenses, PLANNED_HORIZON_MONTHS);
  const plannedReserveAmount = Math.min(plannedNeed, remaining);
  remaining -= plannedReserveAmount;

  // ── Phase 3: high-APR debt (≥ 15%) — before EF top-up ───────────────────
  const activeDebts = data.debts.filter((d) => d.balance > 0);
  const highAprDebts = activeDebts.filter((d) => d.interestRate >= HIGH_APR_THRESHOLD);
  const otherDebts = activeDebts.filter((d) => d.interestRate < HIGH_APR_THRESHOLD);

  const highAprPayoffs = new Map<string, number>();
  const highAprRanked = rankByScore(highAprDebts);
  for (const debt of highAprRanked) {
    const suggested = Math.min(debt.balance, remaining);
    highAprPayoffs.set(debt.id, suggested);
    remaining -= suggested;
  }

  // ── Phase 4: EF top-up toward mode target ────────────────────────────────
  let efTopUpAmount = 0;
  if (efTargetMonths != null) {
    const efAfterBuffer = currentEF + emergencyReserveAmount;
    const gapToTarget = Math.max(0, coreMonthly * efTargetMonths - efAfterBuffer);
    efTopUpAmount = Math.min(gapToTarget, remaining);
    remaining -= efTopUpAmount;
  }

  // ── Phase 5: remaining lower-APR debt ────────────────────────────────────
  const otherPayoffs = new Map<string, number>();
  const otherRanked = rankByScore(otherDebts);
  for (const debt of otherRanked) {
    const suggested = Math.min(debt.balance, remaining);
    otherPayoffs.set(debt.id, suggested);
    remaining -= suggested;
  }

  const remainingLiquidity = Math.max(0, remaining);

  // ── Build ranked recommendations (global order by priority score) ────────
  const allRanked = rankByScore(activeDebts);
  const debtRecommendations = allRanked.map((debt, i) => {
    const suggested =
      (highAprPayoffs.get(debt.id) ?? 0) + (otherPayoffs.get(debt.id) ?? 0);
    return buildDebtRecommendation(debt, i + 1, suggested, activeDebts);
  });

  const highAprDebtTotal = Array.from(highAprPayoffs.values()).reduce((s, v) => s + v, 0);
  const otherDebtTotal = Array.from(otherPayoffs.values()).reduce((s, v) => s + v, 0);

  const totalInterestAvoided = debtRecommendations.reduce((s, r) => s + r.interestSaved, 0);
  const totalCashflowFreed = debtRecommendations.reduce((s, r) => s + r.monthlyCashflowFreed, 0);
  const recommendedRetained = emergencyReserveAmount + plannedReserveAmount + efTopUpAmount;
  const deployableCash = availableCash - recommendedRetained;

  const efAfterAll = currentEF + emergencyReserveAmount + efTopUpAmount;
  const emergencyRunwayMonths = coreMonthly > 0
    ? Math.round((efAfterAll / coreMonthly) * 10) / 10
    : 0;

  // Did we pay high-APR debt before the EF was fully funded?
  const efBeforeTopUp = currentEF + emergencyReserveAmount;
  const efFullTarget = strongReserveTarget;
  const hasHighAprDebtBeforeEfFull =
    highAprDebtTotal > 0 && efBeforeTopUp < efFullTarget;

  const waterfall = buildWaterfall(
    emergencyReserveAmount,
    minBufferAlreadyCovered,
    plannedReserveAmount,
    highAprDebtTotal,
    efTopUpAmount,
    otherDebtTotal,
    remainingLiquidity,
  );

  const efBeforePlanMonths =
    coreMonthly > 0 ? Math.round((currentEF / coreMonthly) * 10) / 10 : 0;

  const strategyExplanations = buildStrategyInsights({
    data,
    reserveMode,
    efBeforePlanMonths,
    emergencyRunwayMonths,
    emergencyReserveAmount,
    minBufferAlreadyCovered,
    emergencyFloorTarget,
    bufferMonths,
    plannedReserveAmount,
    efTopUpAmount,
    highAprDebtTotal,
    hasHighAprDebtBeforeEfFull,
    debtRecommendations,
    availableCash,
    remainingLiquidity,
    strongReserveTarget,
  });

  return {
    availableCash,
    reserveMode,
    coreMonthlyObligations: coreMonthly,
    emergencyFloorTarget,
    strongReserveTarget,
    emergencyRunwayMonths,
    emergencyReserveAmount,
    minBufferAlreadyCovered,
    plannedReserveAmount,
    efTopUpAmount,
    recommendedRetained,
    deployableCash,
    remainingLiquidity,
    totalInterestAvoided,
    totalCashflowFreed,
    debtRecommendations,
    strategyExplanations,
    insights: strategyExplanations.slice(0, 4),
    waterfall,
  };
}

// ─── Display tokens ───────────────────────────────────────────────────────────

/** Visually distinct colors for each waterfall segment kind — dark mode safe. */
export const WATERFALL_COLORS: Record<
  WaterfallKind,
  { bar: string; dot: string }
> = {
  'min-buffer': {
    bar: 'bg-cyan-500 dark:bg-cyan-400',
    dot: 'bg-cyan-500 dark:bg-cyan-400',
  },
  'planned-reserve': {
    bar: 'bg-violet-500 dark:bg-violet-400',
    dot: 'bg-violet-500 dark:bg-violet-400',
  },
  'high-interest-debt': {
    bar: 'bg-rose-600 dark:bg-rose-400',
    dot: 'bg-rose-600 dark:bg-rose-400',
  },
  'ef-topup': {
    bar: 'bg-amber-500 dark:bg-amber-300',
    dot: 'bg-amber-500 dark:bg-amber-300',
  },
  'other-debt': {
    bar: 'bg-orange-500 dark:bg-orange-400',
    dot: 'bg-orange-500 dark:bg-orange-400',
  },
  liquidity: {
    bar: 'bg-slate-500 dark:bg-slate-400',
    dot: 'bg-slate-500 dark:bg-slate-400',
  },
};

export const PRIORITY_BADGES: Record<
  PayoffPriority,
  { label: string; className: string }
> = {
  high: {
    label: 'High priority',
    className: 'bg-rose-100 text-rose-800 dark:bg-rose-500/15 dark:text-rose-300',
  },
  moderate: {
    label: 'Moderate',
    className: 'bg-amber-100 text-amber-800 dark:bg-amber-500/15 dark:text-amber-300',
  },
  low: {
    label: 'Low urgency',
    className: 'bg-zinc-100 text-zinc-700 dark:bg-zinc-500/15 dark:text-zinc-300',
  },
};

export const RESERVE_MODE_META: Record<
  ReserveMode,
  { label: string; description: string }
> = {
  conservative: {
    label: 'Conservative',
    description: 'Keep a larger safety cushion before extra debt payoff.',
  },
  balanced: {
    label: 'Balanced',
    description: 'Keep a basic buffer, then attack expensive debt.',
  },
  aggressive: {
    label: 'Aggressive',
    description: '0.5-month buffer, then high-interest debt first.',
  },
};

/** @deprecated Use WATERFALL_COLORS. */
export const BUCKET_COLORS = WATERFALL_COLORS;
