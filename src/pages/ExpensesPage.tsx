import { useState, useMemo } from 'react';
import type { Expense, ExpenseCategory } from '../types';
import { generateId } from '../utils/storage';
import {
  formatCurrency,
  computePlannedMonthlyRequired,
  monthsUntil,
} from '../utils/calculations';
import {
  mergeValidation,
  validateRequiredName,
  validatePositiveAmount,
  parseNonNegativeInput,
  emptyValidation,
} from '../utils/validation';
import { Card, CardHeader } from '../components/Card';
import { Button } from '../components/Button';
import { Input, Select } from '../components/Input';
import { PageHeader } from '../components/PageHeader';
import { FormAlerts } from '../components/FormAlerts';
import { EmptyState } from '../components/EmptyState';
import { CollapsibleSection } from '../components/CollapsibleSection';
import { useAppActions } from '../context/AppActionsContext';
import { AppIcon, EXPENSE_CATEGORY_ICONS, EMPTY_STATE_ICONS, IconTile } from '../components/icons';
import { Calendar, CheckCircle2, X } from 'lucide-react';

const CATEGORY_OPTIONS: { value: ExpenseCategory; label: string }[] = [
  { value: 'Housing', label: 'Housing' },
  { value: 'Transportation', label: 'Transportation' },
  { value: 'Food', label: 'Food' },
  { value: 'Healthcare', label: 'Healthcare' },
  { value: 'Utilities', label: 'Utilities' },
  { value: 'Subscriptions', label: 'Subscriptions' },
  { value: 'Entertainment', label: 'Entertainment' },
  { value: 'Clothing', label: 'Clothing' },
  { value: 'Personal', label: 'Personal' },
  { value: 'Other', label: 'Other' },
];

interface Props {
  expenses: Expense[];
  onChange: (expenses: Expense[]) => void;
}

function defaultTargetDate(): string {
  const d = new Date();
  d.setFullYear(d.getFullYear() + 1);
  return d.toISOString().split('T')[0];
}

type ExpenseMode = 'recurring' | 'planned';

interface RecurringForm {
  mode: 'recurring';
  name: string;
  amount: number;
  category: ExpenseCategory;
  isFixed: boolean;
}

interface PlannedForm {
  mode: 'planned';
  name: string;
  category: ExpenseCategory;
  targetAmount: number;
  currentSavedOrPaid: number;
  targetDate: string;
}

type FormState = RecurringForm | PlannedForm;

function emptyRecurring(): RecurringForm {
  return { mode: 'recurring', name: '', amount: 0, category: 'Other', isFixed: true };
}

function emptyPlanned(): PlannedForm {
  return {
    mode: 'planned',
    name: '',
    category: 'Other',
    targetAmount: 0,
    currentSavedOrPaid: 0,
    targetDate: defaultTargetDate(),
  };
}

function expenseToForm(expense: Expense): FormState {
  if (expense.isPlannedExpense) {
    return {
      mode: 'planned',
      name: expense.name,
      category: expense.category,
      targetAmount: expense.targetAmount ?? 0,
      currentSavedOrPaid: expense.currentSavedOrPaid ?? 0,
      targetDate: expense.targetDate ?? defaultTargetDate(),
    };
  }
  return {
    mode: 'recurring',
    name: expense.name,
    amount: expense.amount,
    category: expense.category,
    isFixed: expense.isFixed,
  };
}

function formToExpense(form: FormState, id: string): Expense {
  if (form.mode === 'planned') {
    const monthly = computePlannedMonthlyRequired(
      form.targetAmount,
      form.currentSavedOrPaid,
      form.targetDate,
    );
    return {
      id,
      name: form.name,
      amount: monthly,
      category: form.category,
      isFixed: true,
      isPlannedExpense: true,
      targetAmount: form.targetAmount,
      currentSavedOrPaid: form.currentSavedOrPaid,
      targetDate: form.targetDate,
    };
  }
  return {
    id,
    name: form.name,
    amount: form.amount,
    category: form.category,
    isFixed: form.isFixed,
    isPlannedExpense: false,
  };
}

function validateForm(form: FormState) {
  if (form.mode === 'recurring') {
    return mergeValidation(
      validateRequiredName(form.name),
      validatePositiveAmount(form.amount, 'Monthly amount'),
    );
  }
  const nameV = validateRequiredName(form.name);
  const amtV = validatePositiveAmount(form.targetAmount, 'Target amount');
  const base = mergeValidation(nameV, amtV);
  if (!base.valid) return base;
  if (!form.targetDate) {
    return { valid: false, errors: ['Target date is required.'], warnings: [] };
  }
  const remaining = Math.max(0, form.targetAmount - form.currentSavedOrPaid);
  if (remaining > 0 && monthsUntil(form.targetDate) <= 0) {
    return {
      valid: false,
      errors: ['Target date must be in the future while there is still an amount remaining.'],
      warnings: [],
    };
  }
  return { valid: true, errors: [] as string[], warnings: [] };
}

export function ExpensesPage({ expenses, onChange }: Props) {
  const { data, notifyUndo } = useAppActions();
  const [form, setForm] = useState<FormState>(emptyRecurring());
  const [editingId, setEditingId] = useState<string | null>(null);
  const [filter, setFilter] = useState<string>('All');
  const [validation, setValidation] = useState(emptyValidation());

  const mode: ExpenseMode = form.mode;

  function switchMode(next: ExpenseMode) {
    if (next === form.mode) return;
    if (next === 'planned') {
      setForm({ ...emptyPlanned(), name: form.name });
    } else {
      setForm({ ...emptyRecurring(), name: form.name });
    }
    setValidation(emptyValidation());
  }

  function handleAdd() {
    const result = validateForm(form);
    setValidation(result);
    if (!result.valid) return;

    if (editingId) {
      onChange(
        expenses.map((e) =>
          e.id === editingId ? formToExpense(form, editingId) : e,
        ),
      );
      setEditingId(null);
    } else {
      onChange([...expenses, formToExpense(form, generateId())]);
    }
    setForm(mode === 'planned' ? emptyPlanned() : emptyRecurring());
    setValidation(emptyValidation());
  }

  function handleEdit(expense: Expense) {
    setEditingId(expense.id);
    setForm(expenseToForm(expense));
    setValidation(emptyValidation());
  }

  function handleDelete(id: string) {
    const item = expenses.find((e) => e.id === id);
    const snapshot = data;
    onChange(expenses.filter((e) => e.id !== id));
    notifyUndo(item ? `"${item.name}" removed.` : 'Expense removed.', snapshot);
  }

  function handleCancel() {
    setEditingId(null);
    setForm(emptyRecurring());
    setValidation(emptyValidation());
  }

  function handleContribution(id: string, amount: number) {
    const snapshot = data;
    onChange(
      expenses.map((e) => {
        if (e.id !== id || !e.isPlannedExpense) return e;
        const next = Math.min(e.targetAmount ?? 0, (e.currentSavedOrPaid ?? 0) + amount);
        const monthly = computePlannedMonthlyRequired(
          e.targetAmount ?? 0,
          next,
          e.targetDate ?? defaultTargetDate(),
        );
        return { ...e, currentSavedOrPaid: next, amount: monthly };
      }),
    );
    notifyUndo(`Added ${formatCurrency(amount)} to "${expenses.find((e) => e.id === id)?.name ?? 'expense'}".`, snapshot);
  }

  const categories = ['All', ...new Set(expenses.map((e) => e.category))];
  const filtered = filter === 'All' ? expenses : expenses.filter((e) => e.category === filter);
  const recurringTotal = expenses
    .filter((e) => !e.isPlannedExpense)
    .reduce((s, e) => s + e.amount, 0);
  const plannedMonthly = expenses
    .filter((e) => e.isPlannedExpense)
    .reduce((s, e) => s + e.amount, 0);
  const grandTotal = recurringTotal + plannedMonthly;

  // Computed preview for planned form
  const plannedPreview = useMemo(() => {
    if (form.mode !== 'planned' || form.targetAmount <= 0) return null;
    const monthly = computePlannedMonthlyRequired(
      form.targetAmount,
      form.currentSavedOrPaid,
      form.targetDate,
    );
    const months = monthsUntil(form.targetDate);
    return { monthly, months };
  }, [form]);

  return (
    <div className="page-stack">
      <PageHeader
        title="Expenses"
        subtitle="Track monthly bills and planned one-time expenses like vacations or weddings."
      />

      <Card>
        <CardHeader title={editingId ? 'Edit Expense' : 'Add Expense'} />

        {/* Mode toggle */}
        <div className="flex gap-2 mb-5" data-tour="expense-mode-toggle">
          <ModeChip active={mode === 'recurring'} onClick={() => switchMode('recurring')}>
            Monthly recurring
          </ModeChip>
          <ModeChip active={mode === 'planned'} onClick={() => switchMode('planned')}>
            Planned by date
          </ModeChip>
        </div>

        <FormAlerts validation={validation} />

        {mode === 'recurring' && form.mode === 'recurring' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
            <Input
              label="Expense name"
              placeholder="e.g. Rent, Netflix"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
            <Input
              label="Monthly amount"
              type="number"
              min={0}
              step={50}
              placeholder="0"
              prefix="$"
              value={form.amount || ''}
              onChange={(e) => setForm({ ...form, amount: parseNonNegativeInput(e.target.value) })}
            />
            <Select
              label="Category"
              options={CATEGORY_OPTIONS}
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value as ExpenseCategory })}
            />
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-secondary">Type</label>
              <div className="flex gap-2 mt-0.5">
                {([true, false] as const).map((isFixed) => (
                  <button
                    key={String(isFixed)}
                    type="button"
                    onClick={() => setForm({ ...form, isFixed })}
                    className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-colors border cursor-pointer ${
                      form.isFixed === isFixed
                        ? 'bg-indigo-50 dark:bg-indigo-500/10 border-indigo-300 dark:border-indigo-500/40 text-indigo-700 dark:text-indigo-300'
                        : 'border-[var(--border-default)] text-secondary hover:bg-[var(--surface-secondary)]'
                    }`}
                  >
                    {isFixed ? 'Fixed' : 'Variable'}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {mode === 'planned' && form.mode === 'planned' && (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
              <Input
                label="Expense name"
                placeholder="e.g. Wedding, Car repair"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
              <Input
                label="Total amount needed"
                type="number"
                min={0}
                step={500}
                placeholder="0"
                prefix="$"
                value={form.targetAmount || ''}
                onChange={(e) =>
                  setForm({ ...form, targetAmount: parseNonNegativeInput(e.target.value) })
                }
              />
              <Input
                label="Already saved / paid"
                type="number"
                min={0}
                step={100}
                placeholder="0"
                prefix="$"
                value={form.currentSavedOrPaid || ''}
                onChange={(e) =>
                  setForm({
                    ...form,
                    currentSavedOrPaid: parseNonNegativeInput(e.target.value),
                  })
                }
              />
              <Input
                label="Pay by date"
                type="date"
                value={form.targetDate}
                onChange={(e) => setForm({ ...form, targetDate: e.target.value })}
              />
              <Select
                label="Category"
                options={CATEGORY_OPTIONS}
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value as ExpenseCategory })}
              />
            </div>
            {plannedPreview && plannedPreview.monthly > 0 && (
              <div className="mt-4 flex items-center gap-3 px-4 py-3 rounded-xl bg-indigo-50/80 dark:bg-indigo-500/[0.08] border border-indigo-100 dark:border-indigo-500/20">
                <span className="shrink-0 flex items-center justify-center w-8 h-8 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
                  <AppIcon icon={Calendar} size="sm" />
                </span>
                <p className="text-sm text-indigo-700 dark:text-indigo-300">
                  <span className="font-semibold">
                    {formatCurrency(plannedPreview.monthly)}/mo
                  </span>{' '}
                  needed
                  {plannedPreview.months > 0
                    ? ` over the next ${plannedPreview.months} month${plannedPreview.months > 1 ? 's' : ''}`
                    : ''}
                  . This will count toward your monthly obligations.
                </p>
              </div>
            )}
          </>
        )}

        <div className="flex flex-col sm:flex-row gap-2 mt-5">
          <Button onClick={handleAdd}>{editingId ? 'Save Changes' : '+ Add Expense'}</Button>
          {editingId && (
            <Button variant="secondary" onClick={handleCancel}>
              Cancel
            </Button>
          )}
        </div>
      </Card>

      {expenses.length > 0 ? (
        <Card>
          <CardHeader
            title="Expenses"
            action={
              <div className="text-right">
                <p className="text-sm font-semibold text-red-600 tabular-nums">
                  {formatCurrency(grandTotal)}/mo
                </p>
                {plannedMonthly > 0 && (
                  <p className="text-[11px] text-muted mt-0.5">
                    incl. {formatCurrency(plannedMonthly)} planned
                  </p>
                )}
              </div>
            }
          />
          {categories.length > 2 && (
            <div className="flex gap-2 flex-wrap mb-4 -mt-2">
              {categories.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setFilter(cat)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors cursor-pointer ${
                    filter === cat
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'bg-[var(--surface-secondary)] text-secondary hover:text-primary'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          )}
          <div className="list-divider">
            {filtered.map((expense) =>
              expense.isPlannedExpense ? (
                <PlannedExpenseRow
                  key={expense.id}
                  expense={expense}
                  onEdit={() => handleEdit(expense)}
                  onDelete={() => handleDelete(expense.id)}
                  onContribute={(amt) => handleContribution(expense.id, amt)}
                />
              ) : (
                <RecurringExpenseRow
                  key={expense.id}
                  expense={expense}
                  onEdit={() => handleEdit(expense)}
                  onDelete={() => handleDelete(expense.id)}
                />
              ),
            )}
          </div>
        </Card>
      ) : (
        <Card>
          <EmptyState
            icon={EMPTY_STATE_ICONS.expenses}
            title="No expenses yet"
            description="Add monthly bills, or a planned expense like a wedding or vacation with a target date."
          />
        </Card>
      )}
    </div>
  );
}

// ── Sub-components ──────────────────────────────────────────────

function ModeChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-4 py-2 rounded-xl text-sm font-medium border transition-all cursor-pointer ${
        active
          ? 'bg-indigo-600 dark:bg-indigo-500 text-white border-indigo-600 dark:border-indigo-500 shadow-sm'
          : 'border-[var(--border-default)] text-secondary hover:text-primary hover:bg-[var(--surface-secondary)]'
      }`}
    >
      {children}
    </button>
  );
}

function RecurringExpenseRow({
  expense,
  onEdit,
  onDelete,
}: {
  expense: Expense;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between py-4 gap-3">
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <IconTile icon={EXPENSE_CATEGORY_ICONS[expense.category]} variant="muted" size="sm" />
        <div className="min-w-0">
          <p className="font-medium text-primary truncate">{expense.name}</p>
          <div className="flex flex-wrap items-center gap-2 mt-0.5">
            <span className="text-xs text-muted">{expense.category}</span>
            <span
              className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${
                expense.isFixed
                  ? 'bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400'
                  : 'bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400'
              }`}
            >
              {expense.isFixed ? 'Fixed' : 'Variable'}
            </span>
          </div>
        </div>
      </div>
      <div className="flex items-center justify-between sm:justify-end gap-3">
        <span className="font-semibold text-primary tabular-nums">
          {formatCurrency(expense.amount)}/mo
        </span>
        <div className="flex gap-2">
          <Button size="sm" variant="ghost" onClick={onEdit}>Edit</Button>
          <Button size="sm" variant="danger" onClick={onDelete}>Remove</Button>
        </div>
      </div>
    </div>
  );
}

function PlannedExpenseRow({
  expense,
  onEdit,
  onDelete,
  onContribute,
}: {
  expense: Expense;
  onEdit: () => void;
  onDelete: () => void;
  onContribute: (amount: number) => void;
}) {
  const target = expense.targetAmount ?? 0;
  const saved = expense.currentSavedOrPaid ?? 0;
  const remaining = Math.max(0, target - saved);
  const pct = target > 0 ? Math.min(100, (saved / target) * 100) : 0;
  const months = expense.targetDate ? monthsUntil(expense.targetDate) : 0;
  const isComplete = remaining <= 0;
  const isOverdue = !isComplete && months <= 0;

  const dueLabel = expense.targetDate
    ? new Date(expense.targetDate + 'T00:00:00').toLocaleDateString('en-US', {
        month: 'short',
        year: 'numeric',
      })
    : '';

  return (
    <div className="py-4">
      <div className="flex items-start gap-3">
        <IconTile
          icon={EXPENSE_CATEGORY_ICONS[expense.category]}
          variant="muted"
          size="sm"
          className="mt-0.5 shrink-0"
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <p className="font-medium text-primary truncate">{expense.name}</p>
                <span className="text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full bg-violet-100 dark:bg-violet-500/15 text-violet-700 dark:text-violet-300">
                  Planned
                </span>
                {isOverdue && (
                  <span className="text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full bg-red-100 dark:bg-red-500/15 text-red-600 dark:text-red-400">
                    Overdue
                  </span>
                )}
                {isComplete && (
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
                    <AppIcon icon={CheckCircle2} size="xs" />
                    Covered
                  </span>
                )}
              </div>
              <p className="text-xs text-muted mt-0.5">
                {formatCurrency(saved)} of {formatCurrency(target)} · {pct.toFixed(0)}%
                {dueLabel && ` · Due ${dueLabel}`}
              </p>
            </div>
            <div className="flex gap-1.5 shrink-0">
              <Button size="sm" variant="ghost" onClick={onEdit}>
                Edit
              </Button>
              <Button size="sm" variant="danger" onClick={onDelete}>
                Remove
              </Button>
            </div>
          </div>

          <div className="h-1.5 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden mt-2.5">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                isComplete ? 'bg-emerald-500' : isOverdue ? 'bg-red-400' : 'bg-violet-500'
              }`}
              style={{ width: `${pct}%` }}
            />
          </div>

          {!isComplete && (
            <CollapsibleSection
              title="Progress & payments"
              summary={`${formatCurrency(expense.amount)}/mo needed${isOverdue ? ' · overdue' : ''}`}
              defaultExpanded={false}
              collapseOnMobile
              bordered
            >
              <div className="space-y-3">
                <p className={`text-xs font-medium ${isOverdue ? 'text-red-500' : 'text-indigo-600 dark:text-indigo-400'}`}>
                  {formatCurrency(expense.amount)}/mo required until covered
                  {months > 0 && ` · ${months} months remaining`}
                </p>
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <p className="text-xs text-muted">
                    {formatCurrency(remaining)} remaining
                  </p>
                  <ContributeButton remaining={remaining} onContribute={onContribute} />
                </div>
              </div>
            </CollapsibleSection>
          )}

          {isComplete && (
            <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium mt-2">
              Fully covered — no monthly obligation
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

function ContributeButton({
  remaining,
  onContribute,
}: {
  remaining: number;
  onContribute: (amount: number) => void;
}) {
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState('');

  function handleSubmit() {
    const val = parseFloat(amount);
    if (val > 0 && val <= remaining) {
      onContribute(val);
      setAmount('');
      setOpen(false);
    }
  }

  if (!open) {
    return (
      <Button size="sm" variant="secondary" onClick={() => setOpen(true)}>
        + Add payment
      </Button>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <input
        type="number"
        min={1}
        step={50}
        max={remaining}
        placeholder="Amount"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
        autoFocus
        className="w-28 rounded-lg border border-[var(--border-default)] bg-[var(--surface-secondary)] text-primary text-sm py-1.5 px-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
      />
      <Button size="sm" onClick={handleSubmit}>Save</Button>
      <Button size="sm" variant="ghost" onClick={() => { setOpen(false); setAmount(''); }} aria-label="Cancel">
        <AppIcon icon={X} size="sm" />
      </Button>
    </div>
  );
}
