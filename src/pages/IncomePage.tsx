import { useState } from 'react';
import type { IncomeSource } from '../types';
import { generateId } from '../utils/storage';
import { toMonthly, formatCurrency } from '../utils/calculations';
import { Card, CardHeader } from '../components/Card';
import { Button } from '../components/Button';
import { Input, Select } from '../components/Input';

const FREQUENCY_OPTIONS = [
  { value: 'monthly', label: 'Monthly' },
  { value: 'biweekly', label: 'Bi-weekly' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'annually', label: 'Annually' },
];

interface Props {
  income: IncomeSource[];
  onChange: (income: IncomeSource[]) => void;
}

function emptySource(): Omit<IncomeSource, 'id'> {
  return { name: '', amount: 0, frequency: 'monthly' };
}

export function IncomePage({ income, onChange }: Props) {
  const [form, setForm] = useState<Omit<IncomeSource, 'id'>>(emptySource());
  const [editingId, setEditingId] = useState<string | null>(null);

  function handleAdd() {
    if (!form.name.trim() || form.amount <= 0) return;
    if (editingId) {
      onChange(income.map((s) => (s.id === editingId ? { ...form, id: editingId } : s)));
      setEditingId(null);
    } else {
      onChange([...income, { ...form, id: generateId() }]);
    }
    setForm(emptySource());
  }

  function handleEdit(source: IncomeSource) {
    setEditingId(source.id);
    setForm({ name: source.name, amount: source.amount, frequency: source.frequency });
  }

  function handleDelete(id: string) {
    onChange(income.filter((s) => s.id !== id));
  }

  function handleCancel() {
    setEditingId(null);
    setForm(emptySource());
  }

  const totalMonthly = income.reduce((sum, s) => sum + toMonthly(s.amount, s.frequency), 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Income</h1>
        <p className="text-slate-500 text-sm mt-1">Add all sources of income to calculate your monthly total.</p>
      </div>

      <Card>
        <CardHeader title={editingId ? 'Edit Income Source' : 'Add Income Source'} />
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="sm:col-span-1">
            <Input
              label="Source name"
              placeholder="e.g. Salary, Freelance"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </div>
          <Input
            label="Amount"
            type="number"
            min={0}
            placeholder="0"
            prefix="$"
            value={form.amount || ''}
            onChange={(e) => setForm({ ...form, amount: parseFloat(e.target.value) || 0 })}
          />
          <Select
            label="Frequency"
            options={FREQUENCY_OPTIONS}
            value={form.frequency}
            onChange={(e) =>
              setForm({ ...form, frequency: e.target.value as IncomeSource['frequency'] })
            }
          />
        </div>
        <div className="flex gap-2 mt-4">
          <Button onClick={handleAdd} disabled={!form.name.trim() || form.amount <= 0}>
            {editingId ? 'Save Changes' : '+ Add Source'}
          </Button>
          {editingId && (
            <Button variant="secondary" onClick={handleCancel}>
              Cancel
            </Button>
          )}
        </div>
      </Card>

      {income.length > 0 && (
        <Card>
          <CardHeader
            title="Income Sources"
            action={
              <span className="text-sm font-semibold text-indigo-600">
                {formatCurrency(totalMonthly)}/mo
              </span>
            }
          />
          <div className="divide-y divide-slate-100">
            {income.map((source) => (
              <div
                key={source.id}
                className="flex items-center justify-between py-3 gap-4"
              >
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-slate-800 truncate">{source.name}</p>
                  <p className="text-xs text-slate-500 capitalize">
                    {formatCurrency(source.amount)} {source.frequency} ·{' '}
                    {formatCurrency(toMonthly(source.amount, source.frequency))}/mo
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="ghost" onClick={() => handleEdit(source)}>
                    Edit
                  </Button>
                  <Button size="sm" variant="danger" onClick={() => handleDelete(source.id)}>
                    Remove
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {income.length === 0 && (
        <div className="text-center py-16 text-slate-400">
          <p className="text-4xl mb-3">💰</p>
          <p className="font-medium">No income sources yet</p>
          <p className="text-sm mt-1">Add your first income source above.</p>
        </div>
      )}
    </div>
  );
}
