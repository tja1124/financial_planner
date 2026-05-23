import { useState } from 'react';
import type { Debt } from '../types';
import { generateId } from '../utils/storage';
import { formatCurrency, projectDebtPayoff } from '../utils/calculations';
import { Card, CardHeader } from '../components/Card';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';

interface Props {
  debts: Debt[];
  onChange: (debts: Debt[]) => void;
}

function emptyDebt(): Omit<Debt, 'id'> {
  return { name: '', balance: 0, interestRate: 0, minimumPayment: 0, extraPayment: 0 };
}

export function DebtPlannerPage({ debts, onChange }: Props) {
  const [form, setForm] = useState<Omit<Debt, 'id'>>(emptyDebt());
  const [editingId, setEditingId] = useState<string | null>(null);
  const [selectedDebtId, setSelectedDebtId] = useState<string | null>(null);

  function handleAdd() {
    if (!form.name.trim() || form.balance <= 0) return;
    if (editingId) {
      onChange(debts.map((d) => (d.id === editingId ? { ...form, id: editingId } : d)));
      setEditingId(null);
    } else {
      const newDebt = { ...form, id: generateId() };
      onChange([...debts, newDebt]);
      if (!selectedDebtId) setSelectedDebtId(newDebt.id);
    }
    setForm(emptyDebt());
  }

  function handleEdit(debt: Debt) {
    setEditingId(debt.id);
    setForm({
      name: debt.name,
      balance: debt.balance,
      interestRate: debt.interestRate,
      minimumPayment: debt.minimumPayment,
      extraPayment: debt.extraPayment,
    });
  }

  function handleDelete(id: string) {
    onChange(debts.filter((d) => d.id !== id));
    if (selectedDebtId === id) setSelectedDebtId(debts.find((d) => d.id !== id)?.id ?? null);
  }

  const selectedDebt = debts.find((d) => d.id === selectedDebtId) ?? debts[0] ?? null;
  const payoffData = selectedDebt ? projectDebtPayoff(selectedDebt) : [];
  const payoffMonths = payoffData.length;
  const payoffYears = Math.floor(payoffMonths / 12);
  const payoffRemMonths = payoffMonths % 12;
  const totalInterest = payoffData.reduce((s, m) => s + m.interest, 0);

  const chartData = payoffData
    .filter((_, i) => i % Math.max(1, Math.floor(payoffData.length / 24)) === 0 || i === payoffData.length - 1)
    .map((m) => ({ month: m.month, balance: Math.round(m.balance) }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Debt Planner</h1>
        <p className="text-slate-500 text-sm mt-1">Track your debts and see payoff projections.</p>
      </div>

      <Card>
        <CardHeader title={editingId ? 'Edit Debt' : 'Add Debt'} />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <Input
            label="Debt name"
            placeholder="e.g. Credit Card, Car Loan"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
          <Input
            label="Current balance"
            type="number"
            min={0}
            placeholder="0"
            prefix="$"
            value={form.balance || ''}
            onChange={(e) => setForm({ ...form, balance: parseFloat(e.target.value) || 0 })}
          />
          <Input
            label="Interest rate"
            type="number"
            min={0}
            max={100}
            step={0.1}
            placeholder="0"
            suffix="%"
            value={form.interestRate || ''}
            onChange={(e) => setForm({ ...form, interestRate: parseFloat(e.target.value) || 0 })}
          />
          <Input
            label="Minimum payment"
            type="number"
            min={0}
            placeholder="0"
            prefix="$"
            value={form.minimumPayment || ''}
            onChange={(e) => setForm({ ...form, minimumPayment: parseFloat(e.target.value) || 0 })}
          />
          <Input
            label="Extra payment"
            type="number"
            min={0}
            placeholder="0"
            prefix="$"
            value={form.extraPayment || ''}
            onChange={(e) => setForm({ ...form, extraPayment: parseFloat(e.target.value) || 0 })}
          />
        </div>
        <div className="flex gap-2 mt-4">
          <Button onClick={handleAdd} disabled={!form.name.trim() || form.balance <= 0}>
            {editingId ? 'Save Changes' : '+ Add Debt'}
          </Button>
          {editingId && (
            <Button variant="secondary" onClick={() => { setEditingId(null); setForm(emptyDebt()); }}>
              Cancel
            </Button>
          )}
        </div>
      </Card>

      {debts.length > 0 && (
        <>
          <Card>
            <CardHeader
              title="Your Debts"
              action={
                <span className="text-sm font-semibold text-red-500">
                  {formatCurrency(debts.reduce((s, d) => s + d.balance, 0))} total
                </span>
              }
            />
            <div className="divide-y divide-slate-100">
              {debts.map((debt) => (
                <div key={debt.id} className="py-3">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setSelectedDebtId(debt.id)}
                          className={`font-medium truncate cursor-pointer transition-colors ${
                            selectedDebt?.id === debt.id ? 'text-indigo-600' : 'text-slate-800 hover:text-indigo-500'
                          }`}
                        >
                          {debt.name}
                        </button>
                        {selectedDebt?.id === debt.id && (
                          <span className="text-xs bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-full font-medium">
                            Viewing
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {formatCurrency(debt.balance)} balance · {debt.interestRate}% APR ·{' '}
                        {formatCurrency(debt.minimumPayment + debt.extraPayment)}/mo payment
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="ghost" onClick={() => handleEdit(debt)}>
                        Edit
                      </Button>
                      <Button size="sm" variant="danger" onClick={() => handleDelete(debt.id)}>
                        Remove
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {selectedDebt && payoffData.length > 0 && (
            <Card>
              <CardHeader
                title={`Payoff Projection: ${selectedDebt.name}`}
                subtitle={
                  payoffYears > 0
                    ? `Paid off in ${payoffYears}y ${payoffRemMonths}mo · ${formatCurrency(totalInterest)} in interest`
                    : `Paid off in ${payoffMonths} months · ${formatCurrency(totalInterest)} in interest`
                }
              />
              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="bg-slate-50 rounded-xl p-4 text-center">
                  <p className="text-xs text-slate-500 mb-1">Balance</p>
                  <p className="font-bold text-slate-800">{formatCurrency(selectedDebt.balance)}</p>
                </div>
                <div className="bg-red-50 rounded-xl p-4 text-center">
                  <p className="text-xs text-slate-500 mb-1">Total Interest</p>
                  <p className="font-bold text-red-600">{formatCurrency(totalInterest)}</p>
                </div>
                <div className="bg-emerald-50 rounded-xl p-4 text-center">
                  <p className="text-xs text-slate-500 mb-1">Payoff In</p>
                  <p className="font-bold text-emerald-700">
                    {payoffYears > 0 ? `${payoffYears}y ${payoffRemMonths}mo` : `${payoffMonths}mo`}
                  </p>
                </div>
              </div>
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis
                    dataKey="month"
                    tick={{ fontSize: 11, fill: '#94a3b8' }}
                    tickFormatter={(v) => `Mo ${v}`}
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: '#94a3b8' }}
                    tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
                  />
                  <Tooltip
                    formatter={(v) => [formatCurrency(Number(v)), 'Balance']}
                    labelFormatter={(l) => `Month ${l}`}
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="balance"
                    stroke="#6366f1"
                    strokeWidth={2}
                    dot={false}
                    name="Remaining Balance"
                  />
                </LineChart>
              </ResponsiveContainer>
            </Card>
          )}
        </>
      )}

      {debts.length === 0 && (
        <div className="text-center py-16 text-slate-400">
          <p className="text-4xl mb-3">🏦</p>
          <p className="font-medium">No debts tracked</p>
          <p className="text-sm mt-1">Add a debt above to see your payoff timeline.</p>
        </div>
      )}
    </div>
  );
}
