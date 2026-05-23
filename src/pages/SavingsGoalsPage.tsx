import { useState } from 'react';
import type { EmergencyFund, Expense, Debt, IncomeSource, SavingsGoal } from '../types';
import { generateId } from '../utils/storage';
import { formatCurrency, monthsUntil } from '../utils/calculations';
import { isEmergencyGoalName } from '../utils/emergencyFund';
import { monthlyDiscretionaryIncome } from '../utils/savingsContributions';
import {
  validateSavingsGoal,
  parseNonNegativeInput,
  emptyValidation,
  mergeValidation,
  validateRequiredName,
} from '../utils/validation';
import { Card, CardHeader } from '../components/Card';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { PageHeader } from '../components/PageHeader';
import { FormAlerts } from '../components/FormAlerts';
import { EmptyState } from '../components/EmptyState';
import { EmergencyFundCard } from '../components/EmergencyFundCard';
import { SavingsContributionControls } from '../components/SavingsContributionControls';
import { CollapsibleSection } from '../components/CollapsibleSection';
import { useAppActions } from '../context/AppActionsContext';
import { EMPTY_STATE_ICONS } from '../components/icons';
import { CheckCircle2 } from 'lucide-react';
import { AppIcon } from '../components/icons';

interface Props {
  emergencyFund: EmergencyFund;
  income: IncomeSource[];
  expenses: Expense[];
  debts: Debt[];
  savingsGoals: SavingsGoal[];
  onEmergencyFundChange: (fund: EmergencyFund) => void;
  onChange: (goals: SavingsGoal[]) => void;
}

function emptyGoal(): Omit<SavingsGoal, 'id'> {
  const sixMonths = new Date();
  sixMonths.setMonth(sixMonths.getMonth() + 6);
  return {
    name: '',
    targetAmount: 0,
    currentAmount: 0,
    targetDate: sixMonths.toISOString().split('T')[0],
    monthlyContribution: 0,
  };
}

export function SavingsGoalsPage({
  emergencyFund,
  income,
  expenses,
  debts,
  savingsGoals,
  onEmergencyFundChange,
  onChange,
}: Props) {
  const { data, notifyUndo } = useAppActions();
  const [form, setForm] = useState<Omit<SavingsGoal, 'id'>>(emptyGoal());
  const [editingId, setEditingId] = useState<string | null>(null);
  const [validation, setValidation] = useState(emptyValidation());

  const discretionary = monthlyDiscretionaryIncome(income, expenses, debts);

  function handleAdd() {
    const nameCheck = isEmergencyGoalName(form.name)
      ? {
          valid: false,
          errors: [
            'Use the Emergency Fund section above for your safety reserve. Other goals are for vacations, purchases, etc.',
          ],
          warnings: [],
        }
      : validateRequiredName(form.name);

    const result = mergeValidation(nameCheck, validateSavingsGoal(form));
    setValidation(result);
    if (!result.valid) return;

    if (editingId) {
      onChange(savingsGoals.map((g) => (g.id === editingId ? { ...form, id: editingId } : g)));
      setEditingId(null);
    } else {
      onChange([...savingsGoals, { ...form, id: generateId() }]);
    }
    setForm(emptyGoal());
    setValidation(emptyValidation());
  }

  function handleEdit(goal: SavingsGoal) {
    setEditingId(goal.id);
    setForm({
      name: goal.name,
      targetAmount: goal.targetAmount,
      currentAmount: goal.currentAmount,
      targetDate: goal.targetDate,
      monthlyContribution: goal.monthlyContribution,
    });
    setValidation(emptyValidation());
  }

  function handleDelete(id: string) {
    const item = savingsGoals.find((g) => g.id === id);
    const snapshot = data;
    onChange(savingsGoals.filter((g) => g.id !== id));
    notifyUndo(item ? `"${item.name}" removed.` : 'Savings goal removed.', snapshot);
  }

  function handleDeposit(id: string, amount: number) {
    const snapshot = data;
    onChange(
      savingsGoals.map((g) =>
        g.id === id ? { ...g, currentAmount: Math.min(g.targetAmount, g.currentAmount + amount) } : g,
      ),
    );
    notifyUndo(`Deposited ${formatCurrency(amount)}.`, snapshot);
  }

  function handleEmergencyContribute(amount: number) {
    const snapshot = data;
    const uncapped = emergencyFund.currentAmount + amount;
    const next =
      emergencyFund.targetAmount > 0
        ? Math.min(emergencyFund.targetAmount, uncapped)
        : uncapped;
    onEmergencyFundChange({ ...emergencyFund, currentAmount: next });
    notifyUndo(`Deposited ${formatCurrency(amount)} to Emergency Fund.`, snapshot);
  }

  function updateGoal(id: string, patch: Partial<SavingsGoal>) {
    onChange(savingsGoals.map((g) => (g.id === id ? { ...g, ...patch } : g)));
  }

  return (
    <div className="page-stack">
      <PageHeader
        title="Savings"
        subtitle="Your emergency reserve is separate from dated goals like vacations or major purchases."
      />

      <EmergencyFundCard
        emergencyFund={emergencyFund}
        expenses={expenses}
        income={income}
        debts={debts}
        onChange={onEmergencyFundChange}
        onContribute={handleEmergencyContribute}
      />

      <div data-tour="savings-goals">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-muted mb-3 px-0.5">
          Savings goals
        </h2>

        <Card>
          <CardHeader title={editingId ? 'Edit Goal' : 'Add Savings Goal'} />
          <FormAlerts validation={validation} />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 sm:gap-5">
            <Input
              label="Goal name"
              placeholder="e.g. Vacation, Home down payment"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
            <Input
              label="Target amount"
              type="number"
              min={0}
              step={100}
              placeholder="0"
              prefix="$"
              value={form.targetAmount || ''}
              onChange={(e) =>
                setForm({ ...form, targetAmount: parseNonNegativeInput(e.target.value) })
              }
            />
            <Input
              label="Already saved"
              type="number"
              min={0}
              step={50}
              placeholder="0"
              prefix="$"
              value={form.currentAmount || ''}
              onChange={(e) =>
                setForm({ ...form, currentAmount: parseNonNegativeInput(e.target.value) })
              }
            />
            <Input
              label="Target date"
              type="date"
              value={form.targetDate}
              onChange={(e) => setForm({ ...form, targetDate: e.target.value })}
            />
            <Input
              label="Monthly contribution"
              type="number"
              min={0}
              step={25}
              placeholder="0"
              prefix="$"
              value={form.monthlyContribution || ''}
              onChange={(e) =>
                setForm({
                  ...form,
                  monthlyContribution: parseNonNegativeInput(e.target.value),
                })
              }
            />
          </div>
          <p className="text-xs text-muted mt-3">
            Monthly contribution is your planned recurring amount. Use one-time deposits on each goal
            card to add money now.
          </p>
          <div className="flex flex-col sm:flex-row gap-2 mt-5">
            <Button onClick={handleAdd}>{editingId ? 'Save Changes' : '+ Add Goal'}</Button>
            {editingId && (
              <Button
                variant="secondary"
                onClick={() => {
                  setEditingId(null);
                  setForm(emptyGoal());
                  setValidation(emptyValidation());
                }}
              >
                Cancel
              </Button>
            )}
          </div>
        </Card>

      {savingsGoals.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {savingsGoals.map((goal) => {
            const progress =
              goal.targetAmount > 0
                ? Math.min(100, (goal.currentAmount / goal.targetAmount) * 100)
                : 0;
            const months = monthsUntil(goal.targetDate);
            const isComplete = progress >= 100;
            const isPast = months < 0 && !isComplete;

            const targetLabel = new Date(goal.targetDate + 'T00:00:00').toLocaleDateString(
              'en-US',
              { month: 'short', year: 'numeric' },
            );

            return (
              <Card key={goal.id} className="!p-4 sm:!p-5">
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="min-w-0">
                    <h3 className="font-semibold text-primary truncate">{goal.name}</h3>
                    <p className="text-xs text-muted mt-0.5">
                      Target {targetLabel}
                      {isPast && <span className="text-red-400 ml-1">· overdue</span>}
                    </p>
                  </div>
                  <div className="flex gap-1.5 shrink-0">
                    <Button size="sm" variant="ghost" onClick={() => handleEdit(goal)}>
                      Edit
                    </Button>
                    <Button size="sm" variant="danger" onClick={() => handleDelete(goal.id)}>
                      Remove
                    </Button>
                  </div>
                </div>

                <div className="mb-1">
                  <div className="flex justify-between text-xs mb-1.5 tabular-nums">
                    <span className="font-medium text-primary">
                      {formatCurrency(goal.currentAmount)}
                    </span>
                    <span className="text-muted">{progress.toFixed(0)}%</span>
                    <span className="text-secondary">{formatCurrency(goal.targetAmount)}</span>
                  </div>
                  <div className="h-2 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        isComplete ? 'bg-emerald-500' : isPast ? 'bg-red-400' : 'bg-indigo-500'
                      }`}
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>

                {isComplete ? (
                  <div className="flex items-center gap-2 pt-3 mt-3 border-t divider">
                    <AppIcon
                      icon={CheckCircle2}
                      size="md"
                      className="text-emerald-500 dark:text-emerald-400"
                    />
                    <p className="text-sm font-medium text-emerald-600 dark:text-emerald-400">
                      Goal reached
                    </p>
                  </div>
                ) : (
                  <CollapsibleSection
                    title="Contribution plan"
                    summary={
                      goal.monthlyContribution > 0
                        ? `${formatCurrency(goal.monthlyContribution)}/mo planned`
                        : 'Monthly plan and deposits'
                    }
                    defaultExpanded={false}
                    collapseOnMobile
                  >
                    <SavingsContributionControls
                      embedded
                      monthlyContribution={goal.monthlyContribution}
                      onMonthlyChange={(amount) =>
                        updateGoal(goal.id, { monthlyContribution: amount })
                      }
                      onOneTimeDeposit={(amt) => handleDeposit(goal.id, amt)}
                      targetAmount={goal.targetAmount}
                      currentAmount={goal.currentAmount}
                      targetDate={goal.targetDate}
                      discretionaryIncome={discretionary}
                    />
                  </CollapsibleSection>
                )}
              </Card>
            );
          })}
        </div>
      ) : (
        <Card>
          <EmptyState
            icon={EMPTY_STATE_ICONS.savings}
            title="No optional goals yet"
            description="Add a vacation, major purchase, or other dated goal. Your emergency fund stays separate above."
          />
        </Card>
      )}
      </div>
    </div>
  );
}
