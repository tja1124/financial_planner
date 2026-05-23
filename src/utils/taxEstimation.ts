/**
 * Tax estimation layer — intentionally thin.
 *
 * This module converts gross income to estimated net income using simple
 * effective-rate arithmetic. It is the only place in the app that knows
 * about tax rates. All downstream calculations receive the resulting net
 * figure and remain unaware of the tax logic.
 *
 * No IRS brackets, filing status, or state engines are implemented here.
 * Rates are user-editable effective assumptions.
 */
import type { IncomeSource, TaxProfile } from '../types';

// Default assumptions — Georgia-friendly, all editable by the user.
export const DEFAULT_TAX_PROFILE: TaxProfile = {
  federalRate: 14,
  stateRate: 5.39,
  ficaRate: 7.65,
  pretaxDeductionsMonthly: 0,
  posttaxDeductionsMonthly: 0,
};

/** Convert an entered amount to a monthly figure — no tax applied. */
function toMonthlyAmount(amount: number, frequency: IncomeSource['frequency']): number {
  switch (frequency) {
    case 'weekly':    return (amount * 52) / 12;
    case 'biweekly':  return (amount * 26) / 12;
    case 'monthly':   return amount;
    case 'annually':  return amount / 12;
  }
}

/**
 * Estimated net (take-home) monthly income for a single source.
 *
 * Formula when isGross = true:
 *   net = gross × (1 − federalRate% − stateRate% − ficaRate%)
 *         − pretaxDeductionsMonthly
 *         − posttaxDeductionsMonthly
 *
 * When isGross = false (default): returns the monthly amount directly.
 */
export function estimateNetMonthly(source: IncomeSource): number {
  const grossMonthly = toMonthlyAmount(source.amount, source.frequency);
  if (!source.isGross) return grossMonthly;
  const p = source.taxProfile ?? DEFAULT_TAX_PROFILE;
  const totalTaxRate = (p.federalRate + p.stateRate + p.ficaRate) / 100;
  return Math.max(
    0,
    grossMonthly * (1 - totalTaxRate) - p.pretaxDeductionsMonthly - p.posttaxDeductionsMonthly,
  );
}

/** Estimated monthly taxes + deductions amount for a single source. */
export function estimateMonthlyTax(source: IncomeSource): number {
  const grossMonthly = toMonthlyAmount(source.amount, source.frequency);
  if (!source.isGross) return 0;
  return grossMonthly - estimateNetMonthly(source);
}

/** Gross monthly amount regardless of income type. */
export function grossMonthlyAmount(source: IncomeSource): number {
  return toMonthlyAmount(source.amount, source.frequency);
}

/** Take-home fraction of gross (0–1). Returns 1 for net-entered sources. */
export function effectiveTakeHomeRate(source: IncomeSource): number {
  const gross = grossMonthlyAmount(source);
  if (!source.isGross || gross <= 0) return 1;
  return estimateNetMonthly(source) / gross;
}

// ---------------------------------------------------------------------------
// Normalization helpers (used by storage/migration layer)
// ---------------------------------------------------------------------------

function normalizeTaxProfile(raw: Partial<TaxProfile>): TaxProfile {
  const d = DEFAULT_TAX_PROFILE;
  return {
    federalRate:              Number.isFinite(+raw.federalRate!)  ? +raw.federalRate!  : d.federalRate,
    stateRate:                Number.isFinite(+raw.stateRate!)    ? +raw.stateRate!    : d.stateRate,
    ficaRate:                 Number.isFinite(+raw.ficaRate!)      ? +raw.ficaRate!      : d.ficaRate,
    pretaxDeductionsMonthly:  Math.max(0, +(raw.pretaxDeductionsMonthly  ?? 0) || 0),
    posttaxDeductionsMonthly: Math.max(0, +(raw.posttaxDeductionsMonthly ?? 0) || 0),
  };
}

/**
 * Safely normalize a raw income source from persisted JSON.
 * Existing entries without isGross default to false so stored
 * amounts are treated as net — no dashboard behaviour change.
 */
export function normalizeIncomeSource(raw: Partial<IncomeSource>): IncomeSource {
  const validFreqs: IncomeSource['frequency'][] = ['monthly', 'biweekly', 'weekly', 'annually'];
  const frequency = validFreqs.includes(raw.frequency as IncomeSource['frequency'])
    ? (raw.frequency as IncomeSource['frequency'])
    : 'monthly';
  const isGross = raw.isGross === true;
  return {
    id:         String(raw.id   ?? ''),
    name:       String(raw.name ?? ''),
    amount:     Math.max(0, Number(raw.amount) || 0),
    frequency,
    isGross,
    taxProfile: isGross && raw.taxProfile ? normalizeTaxProfile(raw.taxProfile) : undefined,
  };
}
