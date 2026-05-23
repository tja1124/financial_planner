import { useState } from 'react';
import type { EmergencyFund, Expense, SavingsGoal } from '../types';
import { generateId } from '../utils/storage';
import { formatCurrency, monthsUntil } from '../utils/calculations';
import { isEmergencyGoalName } from '../utils/emergencyFund';
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
import { useAppActions } from '../context/AppActionsContext';
import { AppIcon, EMPTY_STATE_ICONS } from '../components/icons';
import { CheckCircle2, X } from 'lucide-react';

interface Props {
  emergencyFund: EmergencyFund;
  expenses: Expense[];
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
  };
}

export function SavingsGoalsPage({
  emergencyFund,
  expenses,
  savingsGoals,
  onEmergencyFundChange,
  onChange,
}: Props) {
  const { data, notifyUndo } = useAppActions();
  const [form, setForm] = useState<Omit<SavingsGoal, 'id'>>(emptyGoal());
  const [editingId, setEditingId] = useState<string | null>(null);
  const [validation, setValidation] = useState(emptyValidation());

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
    notifyUndo(`Added ${formatCurrency(amount)} to Emergency Fund.`, snapshot);
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
        onChange={onEmergencyFundChange}
        onContribute={handleEmergencyContribute}
      />

      <div>
        <h2 className="text-xs font-semibold uppercase tracking-wider text-muted mb-3 px-0.5">
          Savings goals
        </h2>

        <Card>
          <CardHeader title={editingId ? 'Edit Goal' : 'Add Savings Goal'} />
          <FormAlerts validation={validation} />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
            <Input
              label="Goal name"
              placeholder="e.g. Vacation, Wedding"
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
          </div>
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
      </div>

      {savingsGoals.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {savingsGoals.map((goal) => {
            const pct = Math.min(100, (goal.currentAmount / goal.targetAmount) * 100);
            const remaining = Math.max(0, goal.targetAmount - goal.currentAmount);
            const months = monthsUntil(goal.targetDate);
            const monthlyNeeded = months > 0 ? remaining / months : remaining;
            const isComplete = pct >= 100;
            const isPast = months < 0 && !isComplete;

            return (
              <Card key={goal.id}>
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-semibold text-primary">{goal.name}</h3>
                    <p className="text-xs text-muted mt-0.5">
                      Target:{' '}
                      {new Date(goal.targetDate + 'T00:00:00').toLocaleDateString('en-US', {
                        month: 'short',
                        year: 'numeric',
                      })}
                      {isPast && <span className="text-red-400 ml-1">(overdue)</span>}
                    </p>
                  </div>
                  <div className="flex gap-1.5">
                    <Button size="sm" variant="ghost" onClick={() => handleEdit(goal)}>
                      Edit
                    </Button>
                    <Button size="sm" variant="danger" onClick={() => handleDelete(goal.id)}>
                      Remove
                    </Button>
                  </div>
                </div>

                <div className="mb-3">
                  <div className="flex justify-between text-sm mb-1.5">
                    <span className="font-medium text-primary">{formatCurrency(goal.currentAmount)}</span>
                    <span className="text-secondary">{formatCurrency(goal.targetAmount)}</span>
                  </div>
                  <div className="h-2.5 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        isComplete ? 'bg-emerald-500' : isPast ? 'bg-red-400' : 'bg-indigo-500'
                      }`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <p className="text-xs text-muted mt-1.5 text-right">{pct.toFixed(0)}% complete</p>
                </div>

                {!isComplete && (
                  <div className="flex items-center justify-between pt-3 border-t divider">
                    <div>
                      <p className="text-xs text-muted">Monthly needed</p>
                      <p
                        className={`text-sm font-semibold ${isPast ? 'text-red-500' : 'text-indigo-600 dark:text-indigo-400'}`}
                      >
                        {formatCurrency(monthlyNeeded)}/mo
                      </p>
                    </div>
                    <DepositButton onDeposit={(amt) => handleDeposit(goal.id, amt)} />
                  </div>
                )}

                {isComplete && (
                  <div className="flex items-center gap-2 pt-3 border-t divider">
                    <AppIcon icon={CheckCircle2} size="md" className="text-emerald-500 dark:text-emerald-400" />
                    <p className="text-sm font-medium text-emerald-600 dark:text-emerald-400">
                      Goal reached!
                    </p>
                  </div>
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
            description="Add a vacation, wedding, or purchase goal with a target date. Your emergency fund stays separate above."
          />
        </Card>
      )}
    </div>
  );
}

function DepositButton({ onDeposit }: { onDeposit: (amount: number) => void }) {
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState('');

  function handleSubmit() {
    const val = parseFloat(amount);
    if (val > 0) {
      onDeposit(val);
      setAmount('');
      setOpen(false);
    }
  }

  if (!open) {
    return (
      <Button size="sm" variant="secondary" onClick={() => setOpen(true)}>
        + Deposit
      </Button>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <input
        type="number"
        min={0}
        step={50}
        placeholder="Amount"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
        autoFocus
        className="w-24 rounded-lg border border-[var(--border-default)] bg-[var(--surface-secondary)] text-primary text-sm py-1.5 px-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
      />
      <Button size="sm" onClick={handleSubmit}>
        Save
      </Button>
      <Button size="sm" variant="ghost" onClick={() => setOpen(false)} aria-label="Cancel">
        <AppIcon icon={X} size="sm" />
      </Button>
    </div>
  );
}
