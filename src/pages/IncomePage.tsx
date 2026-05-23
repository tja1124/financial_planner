import { useState } from 'react';
import type { IncomeSource } from '../types';
import { generateId } from '../utils/storage';
import { toMonthly, formatCurrency } from '../utils/calculations';
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
import { EMPTY_STATE_ICONS } from '../components/icons';

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
  const { data, notifyUndo } = useAppActions();
  const [form, setForm] = useState<Omit<IncomeSource, 'id'>>(emptySource());
  const [editingId, setEditingId] = useState<string | null>(null);
  const [validation, setValidation] = useState(emptyValidation());

  function handleAdd() {
    const result = mergeValidation(
      validateRequiredName(form.name),
      validatePositiveAmount(form.amount, 'Income amount'),
    );
    setValidation(result);
    if (!result.valid) return;

    if (editingId) {
      onChange(income.map((s) => (s.id === editingId ? { ...form, id: editingId } : s)));
      setEditingId(null);
    } else {
      onChange([...income, { ...form, id: generateId() }]);
    }
    setForm(emptySource());
    setValidation(emptyValidation());
  }

  function handleEdit(source: IncomeSource) {
    setEditingId(source.id);
    setForm({ name: source.name, amount: source.amount, frequency: source.frequency });
    setValidation(emptyValidation());
  }

  function handleDelete(id: string) {
    const item = income.find((s) => s.id === id);
    const snapshot = data;
    onChange(income.filter((s) => s.id !== id));
    notifyUndo(
      item ? `"${item.name}" removed.` : 'Income source removed.',
      snapshot,
    );
  }

  function handleCancel() {
    setEditingId(null);
    setForm(emptySource());
    setValidation(emptyValidation());
  }

  const totalMonthly = income.reduce((sum, s) => sum + toMonthly(s.amount, s.frequency), 0);

  return (
    <div className="page-stack">
      <PageHeader
        title="Income"
        subtitle="Add all sources of income. Amounts are normalized to a monthly total for your plan."
      />

      <Card>
        <CardHeader title={editingId ? 'Edit Income Source' : 'Add Income Source'} />
        <FormAlerts validation={validation} />
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-5">
          <Input
            label="Source name"
            placeholder="e.g. Salary, Freelance"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
          <Input
            label="Amount"
            type="number"
            min={0}
            step={50}
            placeholder="0"
            prefix="$"
            value={form.amount || ''}
            onChange={(e) =>
              setForm({ ...form, amount: parseNonNegativeInput(e.target.value) })
            }
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
        <div className="flex flex-col sm:flex-row gap-2 mt-5">
          <Button onClick={handleAdd}>{editingId ? 'Save Changes' : '+ Add Source'}</Button>
          {editingId && (
            <Button variant="secondary" onClick={handleCancel}>
              Cancel
            </Button>
          )}
        </div>
      </Card>

      {income.length > 0 ? (
        <Card>
          <CardHeader
            title="Income Sources"
            action={
              <span className="text-sm font-semibold text-indigo-600 tabular-nums">
                {formatCurrency(totalMonthly)}/mo
              </span>
            }
          />
          <div className="list-divider">
            {income.map((source) => (
              <div
                key={source.id}
                className="flex flex-col sm:flex-row sm:items-center justify-between py-4 gap-3"
              >
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-primary truncate">{source.name}</p>
                  <p className="text-xs text-muted capitalize mt-0.5">
                    {formatCurrency(source.amount)} {source.frequency} ·{' '}
                    {formatCurrency(toMonthly(source.amount, source.frequency))}/mo
                  </p>
                </div>
                <div className="flex gap-2 shrink-0">
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
      ) : (
        <Card>
          <EmptyState
            icon={EMPTY_STATE_ICONS.income}
            title="No income sources yet"
            description="Add your salary, freelance work, or other income to power your dashboard and forecasts."
          />
        </Card>
      )}
    </div>
  );
}
