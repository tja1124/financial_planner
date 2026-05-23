import type { EmergencyFund, Expense, Debt, IncomeSource } from '../types';
import { formatCurrency } from '../utils/calculations';
import { monthlyDiscretionaryIncome } from '../utils/savingsContributions';
import {
  computeEmergencyRunwayMonths,
  defaultEmergencyTarget,
  getEmergencyFundStatus,
} from '../utils/emergencyFund';
import { parseNonNegativeInput } from '../utils/validation';
import { Shield } from 'lucide-react';
import { Input } from './Input';
import { IconTile } from './icons/IconTile';
import { SavingsContributionControls } from './SavingsContributionControls';
import { CollapsibleSection } from './CollapsibleSection';

interface Props {
  emergencyFund: EmergencyFund;
  expenses: Expense[];
  income: IncomeSource[];
  debts: Debt[];
  onChange: (fund: EmergencyFund) => void;
  onContribute: (amount: number) => void;
}

export function EmergencyFundCard({
  emergencyFund,
  expenses,
  income,
  debts,
  onChange,
  onContribute,
}: Props) {
  const runway = computeEmergencyRunwayMonths(emergencyFund, expenses);
  const status = getEmergencyFundStatus(runway);
  const target =
    emergencyFund.targetAmount > 0
      ? emergencyFund.targetAmount
      : defaultEmergencyTarget(expenses);
  const pct =
    target > 0 ? Math.min(100, (emergencyFund.currentAmount / target) * 100) : 0;

  const discretionary = monthlyDiscretionaryIncome(income, expenses, debts);

  const statusColors: Record<typeof status.tone, string> = {
    vulnerable: 'text-rose-600 dark:text-rose-400 bg-rose-500/10 border-rose-500/20',
    building: 'text-amber-700 dark:text-amber-300 bg-amber-500/10 border-amber-500/20',
    healthy: 'text-emerald-700 dark:text-emerald-300 bg-emerald-500/10 border-emerald-500/20',
    strong: 'text-teal-700 dark:text-teal-300 bg-teal-500/10 border-teal-500/20',
  };

  return (
    <section className="emergency-fund-card overflow-hidden">
      <div className="emergency-fund-card__edge" aria-hidden />
      <div className="p-5 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-5">
          <div>
            <div className="flex items-center gap-2.5 flex-wrap mb-1">
              <IconTile icon={Shield} variant="cyan" size="sm" />
              <h2 className="text-base font-semibold text-primary tracking-tight">
                Emergency Fund
              </h2>
              <span className="text-[10px] font-semibold uppercase tracking-wider text-emerald-600/80 dark:text-emerald-400/90">
                Required
              </span>
            </div>
            <p className="text-sm text-secondary max-w-md leading-relaxed">
              Your safety reserve for essentials. Runway uses only this balance — not vacation or
              other goals.
            </p>
          </div>
          <span
            className={`inline-flex self-start px-2.5 py-1 rounded-full text-xs font-medium border ${statusColors[status.tone]}`}
          >
            {status.label}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5">
          <Input
            label="Current saved"
            type="number"
            min={0}
            step={100}
            prefix="$"
            value={emergencyFund.currentAmount || ''}
            onChange={(e) =>
              onChange({
                ...emergencyFund,
                currentAmount: parseNonNegativeInput(e.target.value),
              })
            }
          />
          <Input
            label="Target amount"
            type="number"
            min={0}
            step={500}
            prefix="$"
            value={emergencyFund.targetAmount || ''}
            onChange={(e) =>
              onChange({
                ...emergencyFund,
                targetAmount: parseNonNegativeInput(e.target.value),
              })
            }
          />
        </div>

        <div>
          <div className="flex justify-between text-sm mb-2">
            <span className="font-medium text-primary tabular-nums">
              {formatCurrency(emergencyFund.currentAmount)}
            </span>
            <span className="text-secondary tabular-nums">{formatCurrency(target)}</span>
          </div>
          <div className="h-2.5 bg-zinc-100 dark:bg-zinc-800/90 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 transition-all duration-500"
              style={{ width: `${pct}%` }}
            />
          </div>
          <div className="flex flex-wrap justify-between gap-2 mt-2 text-xs text-muted">
            <span>{pct.toFixed(0)}% of target</span>
            {runway !== null && (
              <span className="font-medium text-emerald-700 dark:text-emerald-400 tabular-nums">
                {runway.toFixed(1)} months runway
              </span>
            )}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 mt-3">
          <button
            type="button"
            className="text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer accent-ring rounded"
            onClick={() =>
              onChange({
                ...emergencyFund,
                targetAmount: defaultEmergencyTarget(expenses),
              })
            }
          >
            Set target to 3× essentials
          </button>
        </div>

        <CollapsibleSection
          title="Contributions"
          summary={
            emergencyFund.monthlyContribution > 0
              ? `${formatCurrency(emergencyFund.monthlyContribution)}/mo planned`
              : 'Monthly plan and one-time deposits'
          }
          defaultExpanded={false}
          collapseOnMobile
        >
          <SavingsContributionControls
            embedded
            monthlyContribution={emergencyFund.monthlyContribution}
            onMonthlyChange={(amount) =>
              onChange({ ...emergencyFund, monthlyContribution: amount })
            }
            onOneTimeDeposit={onContribute}
            targetAmount={target}
            currentAmount={emergencyFund.currentAmount}
            discretionaryIncome={discretionary}
          />
        </CollapsibleSection>
      </div>
    </section>
  );
}
