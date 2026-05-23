import { useState } from 'react';
import type { Expense, ExpenseCategory } from '../types';
import { generateId } from '../utils/storage';
import { formatCurrency } from '../utils/calculations';
import { Card, CardHeader } from '../components/Card';
import { Button } from '../components/Button';
import { Input, Select } from '../components/Input';

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
  const [form, setForm] = useState<Omit<Expense, 'id'>>(emptyExpense());
  const [editingId, setEditingId] = useState<string | null>(null);
  const [filter, setFilter] = useState<string>('All');

  function handleAdd() {
    if (!form.name.trim() || form.amount <= 0) return;
    if (editingId) {
      onChange(expenses.map((e) => (e.id === editingId ? { ...form, id: editingId } : e)));
      setEditingId(null);
    } else {
      onChange([...expenses, { ...form, id: generateId() }]);
    }
    setForm(emptyExpense());
  }

  function handleEdit(expense: Expense) {
    setEditingId(expense.id);
    setForm({ name: expense.name, amount: expense.amount, category: expense.category, isFixed: expense.isFixed });
  }

  function handleDelete(id: string) {
    onChange(expenses.filter((e) => e.id !== id));
  }

  function handleCancel() {
    setEditingId(null);
    setForm(emptyExpense());
  }

  const categories = ['All', ...new Set(expenses.map((e) => e.category))];
  const filtered = filter === 'All' ? expenses : expenses.filter((e) => e.category === filter);
  const total = expenses.reduce((sum, e) => sum + e.amount, 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Monthly Expenses</h1>
        <p className="text-slate-500 text-sm mt-1">Track your recurring monthly expenses by category.</p>
      </div>

      <Card>
        <CardHeader title={editingId ? 'Edit Expense' : 'Add Expense'} />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
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
            placeholder="0"
            prefix="$"
            value={form.amount || ''}
            onChange={(e) => setForm({ ...form, amount: parseFloat(e.target.value) || 0 })}
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
              <button
                type="button"
                onClick={() => setForm({ ...form, isFixed: true })}
                className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-colors border cursor-pointer ${
                  form.isFixed
                    ? 'bg-indigo-50 border-indigo-300 text-indigo-700'
                    : 'border-slate-200 text-slate-500 hover:bg-slate-50'
                }`}
              >
                Fixed
              </button>
              <button
                type="button"
                onClick={() => setForm({ ...form, isFixed: false })}
                className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-colors border cursor-pointer ${
                  !form.isFixed
                    ? 'bg-indigo-50 border-indigo-300 text-indigo-700'
                    : 'border-slate-200 text-slate-500 hover:bg-slate-50'
                }`}
              >
                Variable
              </button>
            </div>
          </div>
        </div>
        <div className="flex gap-2 mt-4">
          <Button onClick={handleAdd} disabled={!form.name.trim() || form.amount <= 0}>
            {editingId ? 'Save Changes' : '+ Add Expense'}
          </Button>
          {editingId && (
            <Button variant="secondary" onClick={handleCancel}>
              Cancel
            </Button>
          )}
        </div>
      </Card>

      {expenses.length > 0 && (
        <Card>
          <CardHeader
            title="Expenses"
            action={
              <span className="text-sm font-semibold text-red-500">
                {formatCurrency(total)}/mo
              </span>
            }
          />
          {categories.length > 2 && (
            <div className="flex gap-2 flex-wrap mb-4">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setFilter(cat)}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition-colors cursor-pointer ${
                    filter === cat
                      ? 'bg-indigo-600 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          )}
          <div className="divide-y divide-slate-100">
            {filtered.map((expense) => (
              <div key={expense.id} className="flex items-center justify-between py-3 gap-4">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <span className="text-xl shrink-0">{CATEGORY_EMOJIS[expense.category]}</span>
                  <div className="min-w-0">
                    <p className="font-medium text-slate-800 truncate">{expense.name}</p>
                    <div className="flex items-center gap-2 mt-0.5">
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
                <div className="flex items-center gap-3">
                  <span className="font-semibold text-slate-700 tabular-nums">
                    {formatCurrency(expense.amount)}
                  </span>
                  <Button size="sm" variant="ghost" onClick={() => handleEdit(expense)}>
                    Edit
                  </Button>
                  <Button size="sm" variant="danger" onClick={() => handleDelete(expense.id)}>
                    Remove
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {expenses.length === 0 && (
        <div className="text-center py-16 text-slate-400">
          <p className="text-4xl mb-3">💸</p>
          <p className="font-medium">No expenses yet</p>
          <p className="text-sm mt-1">Start tracking your monthly expenses above.</p>
        </div>
      )}
    </div>
  );
}
