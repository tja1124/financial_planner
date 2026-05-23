import { useState } from 'react';
import type { SavingsGoal } from '../types';
import { generateId } from '../utils/storage';
import { formatCurrency, monthsUntil } from '../utils/calculations';
import { Card, CardHeader } from '../components/Card';
import { Button } from '../components/Button';
import { Input } from '../components/Input';

interface Props {
  savingsGoals: SavingsGoal[];
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

export function SavingsGoalsPage({ savingsGoals, onChange }: Props) {
  const [form, setForm] = useState<Omit<SavingsGoal, 'id'>>(emptyGoal());
  const [editingId, setEditingId] = useState<string | null>(null);

  function handleAdd() {
    if (!form.name.trim() || form.targetAmount <= 0) return;
    if (editingId) {
      onChange(savingsGoals.map((g) => (g.id === editingId ? { ...form, id: editingId } : g)));
      setEditingId(null);
    } else {
      onChange([...savingsGoals, { ...form, id: generateId() }]);
    }
    setForm(emptyGoal());
  }

  function handleEdit(goal: SavingsGoal) {
    setEditingId(goal.id);
    setForm({
      name: goal.name,
      targetAmount: goal.targetAmount,
      currentAmount: goal.currentAmount,
      targetDate: goal.targetDate,
    });
  }

  function handleDelete(id: string) {
    onChange(savingsGoals.filter((g) => g.id !== id));
  }

  function handleDeposit(id: string, amount: number) {
    onChange(
      savingsGoals.map((g) =>
        g.id === id ? { ...g, currentAmount: Math.min(g.targetAmount, g.currentAmount + amount) } : g
      )
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Savings Goals</h1>
        <p className="text-slate-500 text-sm mt-1">Set and track your savings targets.</p>
      </div>

      <Card>
        <CardHeader title={editingId ? 'Edit Goal' : 'Add Savings Goal'} />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Input
            label="Goal name"
            placeholder="e.g. Emergency Fund"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
          <Input
            label="Target amount"
            type="number"
            min={0}
            placeholder="0"
            prefix="$"
            value={form.targetAmount || ''}
            onChange={(e) => setForm({ ...form, targetAmount: parseFloat(e.target.value) || 0 })}
          />
          <Input
            label="Already saved"
            type="number"
            min={0}
            placeholder="0"
            prefix="$"
            value={form.currentAmount || ''}
            onChange={(e) => setForm({ ...form, currentAmount: parseFloat(e.target.value) || 0 })}
          />
          <Input
            label="Target date"
            type="date"
            value={form.targetDate}
            onChange={(e) => setForm({ ...form, targetDate: e.target.value })}
          />
        </div>
        <div className="flex gap-2 mt-4">
          <Button onClick={handleAdd} disabled={!form.name.trim() || form.targetAmount <= 0}>
            {editingId ? 'Save Changes' : '+ Add Goal'}
          </Button>
          {editingId && (
            <Button variant="secondary" onClick={() => { setEditingId(null); setForm(emptyGoal()); }}>
              Cancel
            </Button>
          )}
        </div>
      </Card>

      {savingsGoals.length > 0 && (
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
                    <h3 className="font-semibold text-slate-800">{goal.name}</h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Target: {new Date(goal.targetDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
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
                    <span className="text-slate-600 font-medium">{formatCurrency(goal.currentAmount)}</span>
                    <span className="text-slate-400">{formatCurrency(goal.targetAmount)}</span>
                  </div>
                  <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        isComplete ? 'bg-emerald-500' : isPast ? 'bg-red-400' : 'bg-indigo-500'
                      }`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <p className="text-xs text-slate-500 mt-1.5 text-right">{pct.toFixed(0)}% complete</p>
                </div>

                {!isComplete && (
                  <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                    <div>
                      <p className="text-xs text-slate-500">Monthly needed</p>
                      <p className={`text-sm font-semibold ${isPast ? 'text-red-500' : 'text-indigo-600'}`}>
                        {formatCurrency(monthlyNeeded)}/mo
                      </p>
                    </div>
                    <DepositButton onDeposit={(amt) => handleDeposit(goal.id, amt)} />
                  </div>
                )}

                {isComplete && (
                  <div className="flex items-center gap-2 pt-3 border-t border-slate-100">
                    <span className="text-emerald-500 text-lg">✓</span>
                    <p className="text-sm font-medium text-emerald-600">Goal reached!</p>
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}

      {savingsGoals.length === 0 && (
        <div className="text-center py-16 text-slate-400">
          <p className="text-4xl mb-3">🎯</p>
          <p className="font-medium">No savings goals yet</p>
          <p className="text-sm mt-1">Create your first goal above to start saving.</p>
        </div>
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
        placeholder="Amount"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
        autoFocus
        className="w-24 rounded-lg border border-slate-200 text-sm py-1.5 px-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500"
      />
      <Button size="sm" onClick={handleSubmit}>Save</Button>
      <Button size="sm" variant="ghost" onClick={() => setOpen(false)}>✕</Button>
    </div>
  );
}
