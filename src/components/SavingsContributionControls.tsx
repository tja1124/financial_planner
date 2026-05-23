import { useState } from 'react';
import { X } from 'lucide-react';
import { formatCurrency } from '../utils/calculations';
import {
  conservativeMonthlyRecommendation,
  formatMonthYear,
  isBelowRequiredMonthly,
  projectReachDate,
  requiredMonthlyContribution,
} from '../utils/savingsContributions';
import { Button } from './Button';
import { Input } from './Input';
import { AppIcon } from './icons';
import { FormAlerts } from './FormAlerts';
import type { ValidationResult } from '../utils/validation';

interface Props {
  monthlyContribution: number;
  onMonthlyChange: (amount: number) => void;
  onOneTimeDeposit: (amount: number) => void;
  targetAmount: number;
  currentAmount: number;
  targetDate?: string;
  discretionaryIncome?: number;
  depositLabel?: string;
}

export function SavingsContributionControls({
  monthlyContribution,
  onMonthlyChange,
  onOneTimeDeposit,
  targetAmount,
  currentAmount,
  targetDate,
  discretionaryIncome = 0,
  depositLabel = 'One-time deposit',
}: Props) {
  const [depositOpen, setDepositOpen] = useState(false);
  const [depositAmount, setDepositAmount] = useState('');

  const remaining = Math.max(0, targetAmount - currentAmount);
  const isComplete = targetAmount > 0 && currentAmount >= targetAmount;
  const required =
    targetDate != null
      ? requiredMonthlyContribution(targetAmount, currentAmount, targetDate)
      : null;

  const recommended =
    targetDate && required != null && required > 0
      ? required
      : conservativeMonthlyRecommendation(remaining, discretionaryIncome);

  const planned = monthlyContribution;
  const belowRequired = isBelowRequiredMonthly(planned, required);
  const reachDate = projectReachDate(currentAmount, targetAmount, planned);

  const warnings: ValidationResult['warnings'] = [];
  if (belowRequired && required != null) {
    warnings.push(
      `Your planned ${formatCurrency(planned)}/mo is below ${formatCurrency(required)}/mo needed to hit your target date.`,
    );
  }

  function handleDeposit() {
    const val = parseFloat(depositAmount);
    if (val > 0) {
      onOneTimeDeposit(val);
      setDepositAmount('');
      setDepositOpen(false);
    }
  }

  if (isComplete) return null;

  return (
    <div className="pt-4 border-t border-[var(--border-subtle)] space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <Input
            label="Monthly contribution"
            type="number"
            min={0}
            step={25}
            prefix="$"
            value={planned || ''}
            onChange={(e) => onMonthlyChange(Math.max(0, parseFloat(e.target.value) || 0))}
          />
          <p className="text-[11px] text-muted mt-1">
            Planned recurring amount — not added to balance now
          </p>
        </div>
        <div className="flex flex-col justify-end">
          {!depositOpen ? (
            <Button
              size="sm"
              variant="secondary"
              className="w-full sm:w-auto"
              onClick={() => setDepositOpen(true)}
            >
              + {depositLabel}
            </Button>
          ) : (
            <div className="flex flex-wrap items-end gap-2">
              <input
                type="number"
                min={0}
                step={50}
                placeholder="Amount"
                aria-label="One-time deposit amount"
                value={depositAmount}
                onChange={(e) => setDepositAmount(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleDeposit()}
                autoFocus
                className="w-28 rounded-lg border border-[var(--border-default)] bg-[var(--surface-secondary)] text-primary text-sm py-2 px-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
              />
              <Button size="sm" onClick={handleDeposit}>
                Add now
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setDepositOpen(false)}
                aria-label="Cancel deposit"
              >
                <AppIcon icon={X} size="sm" />
              </Button>
            </div>
          )}
        </div>
      </div>

      {warnings.length > 0 && (
        <FormAlerts validation={{ valid: true, errors: [], warnings }} />
      )}

      <div className="text-xs text-secondary space-y-1 leading-relaxed">
        {planned > 0 && reachDate && (
          <p>
            At {formatCurrency(planned)}/month, you&apos;ll reach this goal around{' '}
            <span className="font-medium text-primary">{formatMonthYear(reachDate)}</span>.
          </p>
        )}
        {recommended > 0 && (planned <= 0 || belowRequired) && (
          <p>
            Recommended:{' '}
            <span className="font-medium text-indigo-600 dark:text-indigo-400 tabular-nums">
              {formatCurrency(recommended)}/mo
            </span>
            {targetDate ? (
              <>
                {' '}
                to reach your target by{' '}
                <span className="font-medium text-primary">
                  {new Date(targetDate + 'T00:00:00').toLocaleDateString('en-US', {
                    month: 'short',
                    year: 'numeric',
                  })}
                </span>
              </>
            ) : (
              <> toward your target at a steady pace</>
            )}
            .
          </p>
        )}
        {planned <= 0 && recommended <= 0 && remaining > 0 && (
          <p className="text-muted">
            Set a monthly contribution to track progress toward your target.
          </p>
        )}
      </div>
    </div>
  );
}
