import { useState } from 'react';
import type { Expense, ExpenseCategory } from '../types';
import { generateId } from '../utils/storage';
import { formatCurrency } from '../utils/calculations';
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
import { useAppActions } from '../context/AppActionsContext';

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

const CATEGORY_EMOJIS: Record<ExpenseCategory, string> = {
  Housing: '🏠',
  Transportation: '🚗',
  Food: '🍔',
  Healthcare: '💊',
  Utilities: '💡',
  Subscriptions: '📱',
  Entertainment: '🎬',
  Clothing: '👕',
  Personal: '💆',
  Other: '📦',
};

interface Props {
  expenses: Expense[];
  onChange: (expenses: Expense[]) => void;
}

function emptyExpense(): Omit<Expense, 'id'> {
  return { name: '', amount: 0, category: 'Other', isFixed: true };
}

export function ExpensesPage({ expenses, onChange }: Props) {
  const { data, notifyUndo } = useAppActions();
  const [form, setForm] = useState<Omit<Expense, 'id'>>(emptyExpense());
  const [editingId, setEditingId] = useState<string | null>(null);
  const [filter, setFilter] = useState<string>('All');
  const [validation, setValidation] = useState(emptyValidation());

  function handleAdd() {
    const result = mergeValidation(
      validateRequiredName(form.name),
      validatePositiveAmount(form.amount, 'Monthly amount'),
    );
    setValidation(result);
    if (!result.valid) return;

    if (editingId) {
      onChange(expenses.map((e) => (e.id === editingId ? { ...form, id: editingId } : e)));
      setEditingId(null);
    } else {
      onChange([...expenses, { ...form, id: generateId() }]);
    }
    setForm(emptyExpense());
    setValidation(emptyValidation());
  }

  function handleEdit(expense: Expense) {
    setEditingId(expense.id);
    setForm({
      name: expense.name,
      amount: expense.amount,
      category: expense.category,
      isFixed: expense.isFixed,
    });
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
    setForm(emptyExpense());
    setValidation(emptyValidation());
  }

  const categories = ['All', ...new Set(expenses.map((e) => e.category))];
  const filtered = filter === 'All' ? expenses : expenses.filter((e) => e.category === filter);
  const total = expenses.reduce((sum, e) => sum + e.amount, 0);

  return (
    <div className="page-stack">
      <PageHeader
        title="Monthly Expenses"
        subtitle="Track recurring bills by category. Fixed vs variable helps with scenario planning."
      />

      <Card>
        <CardHeader title={editingId ? 'Edit Expense' : 'Add Expense'} />
        <FormAlerts validation={validation} />
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
            step="0.01"
            placeholder="0"
            prefix="$"
            value={form.amount || ''}
            onChange={(e) =>
              setForm({ ...form, amount: parseNonNegativeInput(e.target.value) })
            }
          />
          <Select
            label="Category"
            options={CATEGORY_OPTIONS}
            value={form.category}
            onChange={(e) => setForm({ ...form, category: e.target.value as ExpenseCategory })}
          />
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-slate-700">Type</label>
            <div className="flex gap-2 mt-1">
              {([true, false] as const).map((isFixed) => (
                <button
                  key={String(isFixed)}
                  type="button"
                  onClick={() => setForm({ ...form, isFixed })}
                  className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-colors border cursor-pointer ${
                    form.isFixed === isFixed
                      ? 'bg-indigo-50 border-indigo-300 text-indigo-700'
                      : 'border-slate-200 text-slate-500 hover:bg-slate-50'
                  }`}
                >
                  {isFixed ? 'Fixed' : 'Variable'}
                </button>
              ))}
            </div>
          </div>
        </div>
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
              <span className="text-sm font-semibold text-red-600 tabular-nums">
                {formatCurrency(total)}/mo
              </span>
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
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          )}
          <div className="list-divider">
            {filtered.map((expense) => (
              <div
                key={expense.id}
                className="flex flex-col sm:flex-row sm:items-center justify-between py-4 gap-3"
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <span className="text-xl shrink-0">{CATEGORY_EMOJIS[expense.category]}</span>
                  <div className="min-w-0">
                    <p className="font-medium text-slate-800 dark:text-slate-100 truncate">{expense.name}</p>
                    <div className="flex flex-wrap items-center gap-2 mt-0.5">
                      <span className="text-xs text-slate-500">{expense.category}</span>
                      <span
                        className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${
                          expense.isFixed
                            ? 'bg-blue-50 text-blue-600'
                            : 'bg-amber-50 text-amber-600'
                        }`}
                      >
                        {expense.isFixed ? 'Fixed' : 'Variable'}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-between sm:justify-end gap-3">
                  <span className="font-semibold text-slate-700 tabular-nums">
                    {formatCurrency(expense.amount)}
                  </span>
                  <div className="flex gap-2">
                    <Button size="sm" variant="ghost" onClick={() => handleEdit(expense)}>
                      Edit
                    </Button>
                    <Button size="sm" variant="danger" onClick={() => handleDelete(expense.id)}>
                      Remove
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      ) : (
        <Card>
          <EmptyState
            icon="💸"
            title="No expenses yet"
            description="Add rent, utilities, subscriptions, and other monthly costs to see your true budget."
          />
        </Card>
      )}
    </div>
  );
}
