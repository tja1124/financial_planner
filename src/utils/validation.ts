import type { Debt, SavingsGoal } from '../types';
import { monthsUntil } from './calculations';

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

export function emptyValidation(): ValidationResult {
  return { valid: true, errors: [], warnings: [] };
}

export function mergeValidation(...results: ValidationResult[]): ValidationResult {
  return {
    valid: results.every((r) => r.valid),
    errors: results.flatMap((r) => r.errors),
    warnings: results.flatMap((r) => r.warnings),
  };
}

export function validateRequiredName(name: string): ValidationResult {
  if (!name.trim()) {
    return { valid: false, errors: ['Name is required.'], warnings: [] };
  }
  return emptyValidation();
}

export function validatePositiveAmount(
  amount: number,
  label = 'Amount',
): ValidationResult {
  if (amount <= 0) {
    return { valid: false, errors: [`${label} must be greater than zero.`], warnings: [] };
  }
  if (amount < 0) {
    return { valid: false, errors: [`${label} cannot be negative.`], warnings: [] };
  }
  return emptyValidation();
}

export function validateNonNegative(
  amount: number,
  label: string,
): ValidationResult {
  if (amount < 0) {
    return { valid: false, errors: [`${label} cannot be negative.`], warnings: [] };
  }
  return emptyValidation();
}

export function monthlyInterestCharge(balance: number, annualRate: number): number {
  return balance * (annualRate / 100 / 12);
}

export function validateDebt(debt: Omit<Debt, 'id'>): ValidationResult {
  const base = mergeValidation(
    validateRequiredName(debt.name),
    validatePositiveAmount(debt.balance, 'Balance'),
    validateNonNegative(debt.interestRate, 'Interest rate'),
    validateNonNegative(debt.minimumPayment, 'Minimum payment'),
    validateNonNegative(debt.extraPayment, 'Extra payment'),
  );

  if (!base.valid) return base;

  const warnings: string[] = [];
  const interest = monthlyInterestCharge(debt.balance, debt.interestRate);

  if (debt.minimumPayment > 0 && debt.minimumPayment < interest) {
    warnings.push(
      `Minimum payment (${debt.minimumPayment.toFixed(0)}) is below monthly interest (~${interest.toFixed(0)}). Balance may grow over time.`,
    );
  }

  const totalPayment = debt.minimumPayment + debt.extraPayment;
  if (totalPayment > 0 && totalPayment < interest) {
    warnings.push(
      `Total payment is less than monthly interest. Consider increasing payments to make progress.`,
    );
  }

  return { ...base, warnings };
}

export function validateSavingsGoal(goal: Omit<SavingsGoal, 'id'>): ValidationResult {
  const base = mergeValidation(
    validateRequiredName(goal.name),
    validatePositiveAmount(goal.targetAmount, 'Target amount'),
    validateNonNegative(goal.currentAmount, 'Current amount'),
  );

  if (!base.valid) return base;

  const warnings: string[] = [];

  if (goal.currentAmount > goal.targetAmount) {
    warnings.push('Current amount exceeds target. Target will be capped when saving.');
  }

  if (!goal.targetDate) {
    return { ...base, warnings, valid: false, errors: ['Target date is required.'] };
  }

  const target = new Date(goal.targetDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (target < today) {
    warnings.push('Target date is in the past. Monthly contribution estimates may be unrealistic.');
  }

  const months = monthsUntil(goal.targetDate);
  const remaining = Math.max(0, goal.targetAmount - goal.currentAmount);

  if (months > 0 && remaining > 0) {
    const monthlyNeeded = remaining / months;
    if (monthlyNeeded > 10000) {
      warnings.push(
        `Requires ~$${Math.round(monthlyNeeded).toLocaleString()}/month to hit this date — consider a later target date.`,
      );
    }
  }

  if (months <= 0 && remaining > 0) {
    warnings.push('Goal is overdue with balance remaining.');
  }

  return { ...base, warnings };
}

export function clampNonNegative(value: number): number {
  return Math.max(0, value);
}

export function parseNonNegativeInput(value: string): number {
  const n = parseFloat(value);
  if (Number.isNaN(n)) return 0;
  return clampNonNegative(n);
}
