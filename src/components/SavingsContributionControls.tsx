import { useState } from 'react';
import { CalendarClock, CirclePlus, X } from 'lucide-react';
import { formatCurrency } from '../utils/calculations';
import {
  conservativeMonthlyRecommendation,
  formatMonthYear,
  isBelowRequiredMonthly,
  projectReachDate,
  requiredMonthlyContribution,
} from '../utils/savingsContributions';
import { Button } from './Button';
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
  /** When wrapped in CollapsibleSection, omit duplicate heading/border */
  embedded?: boolean;
}

const amountInputClass =
  'w-full rounded-lg border border-slate-200 dark:border-white/[0.08] bg-white dark:bg-[var(--surface-secondary)] text-primary text-sm py-2.5 pl-7 pr-3 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 dark:focus:ring-indigo-400/30 tabular-nums';

export function SavingsContributionControls({
  monthlyContribution,
  onMonthlyChange,
  onOneTimeDeposit,
  targetAmount,
  currentAmount,
  targetDate,
  discretionaryIncome = 0,
  embedded = false,
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
  const showUseRecommended =
    recommended > 0 && Math.abs(planned - recommended) > 0.5;

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
    <section className={embedded ? '' : 'mt-5 pt-5 border-t border-[var(--border-subtle)]'}>
      {!embedded && (
        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted mb-3">
          Contributions
        </h3>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {/* Monthly plan */}
        <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-secondary)]/40 dark:bg-white/[0.02] p-4 flex flex-col gap-3 min-h-[11rem]">
          <div className="flex items-start gap-2.5">
            <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 shrink-0">
              <AppIcon icon={CalendarClock} size="sm" />
            </span>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-primary leading-tight">Monthly plan</p>
              <p className="text-[11px] text-muted mt-0.5 leading-snug">
                Used for projections and monthly cashflow.
              </p>
            </div>
          </div>

          <div>
            <label htmlFor="monthly-plan-amount" className="sr-only">
              Monthly plan amount
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted select-none">
                $
              </span>
              <input
                id="monthly-plan-amount"
                type="number"
                min={0}
                step={25}
                placeholder="0"
                value={planned || ''}
                onChange={(e) =>
                  onMonthlyChange(Math.max(0, parseFloat(e.target.value) || 0))
                }
                className={amountInputClass}
              />
            </div>
            <p className="text-[11px] text-muted mt-1.5">per month · not added to balance now</p>
          </div>

          <div className="mt-auto space-y-2">
            {recommended > 0 && (
              <p className="text-xs text-secondary leading-relaxed">
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
                  <> to reach your target steadily</>
                )}
                .
              </p>
            )}
            {showUseRecommended && (
              <Button
                type="button"
                size="sm"
                variant="ghost"
                className="!px-2 !py-1 text-xs h-auto"
                onClick={() => onMonthlyChange(Math.round(recommended * 100) / 100)}
              >
                Use recommended
              </Button>
            )}
            {planned > 0 && reachDate && (
              <p className="text-[11px] text-muted leading-relaxed">
                At this pace, on track around{' '}
                <span className="font-medium text-secondary">{formatMonthYear(reachDate)}</span>.
              </p>
            )}
            {planned <= 0 && recommended <= 0 && remaining > 0 && (
              <p className="text-[11px] text-muted">Set a monthly plan to include this in projections.</p>
            )}
          </div>
        </div>

        {/* One-time deposit */}
        <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-secondary)]/40 dark:bg-white/[0.02] p-4 flex flex-col gap-3 min-h-[11rem]">
          <div className="flex items-start gap-2.5">
            <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 shrink-0">
              <AppIcon icon={CirclePlus} size="sm" />
            </span>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-primary leading-tight">One-time deposit</p>
              <p className="text-[11px] text-muted mt-0.5 leading-snug">
                Adds to your balance today. You can undo after saving.
              </p>
            </div>
          </div>

          <div className="flex-1 flex flex-col justify-center">
            {!depositOpen ? (
              <Button
                type="button"
                size="sm"
                variant="secondary"
                className="self-start"
                onClick={() => setDepositOpen(true)}
              >
                Add deposit
              </Button>
            ) : (
              <div className="space-y-2.5">
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted select-none">
                    $
                  </span>
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
                    className={amountInputClass}
                  />
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Button type="button" size="sm" onClick={handleDeposit}>
                    Add to balance
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      setDepositOpen(false);
                      setDepositAmount('');
                    }}
                    aria-label="Cancel deposit"
                  >
                    <AppIcon icon={X} size="sm" />
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {warnings.length > 0 && (
        <div className="mt-3">
          <FormAlerts validation={{ valid: true, errors: [], warnings }} />
        </div>
      )}
    </section>
  );
}
