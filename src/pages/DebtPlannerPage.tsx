import { useState, useMemo } from 'react';
import type { Debt, DebtStrategy } from '../types';
import { generateId } from '../utils/storage';
import { formatCurrency, projectDebtPayoff } from '../utils/calculations';
import {
  simulateDebtStrategy,
  formatPayoffDuration,
  STRATEGY_LABELS,
  STRATEGY_DESCRIPTIONS,
} from '../utils/debtStrategies';
import {
  validateDebt,
  parseNonNegativeInput,
  emptyValidation,
} from '../utils/validation';
import { Card, CardHeader } from '../components/Card';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { PageHeader } from '../components/PageHeader';
import { EmptyState } from '../components/EmptyState';
import { FormAlerts } from '../components/FormAlerts';
import { ChartContainer } from '../components/ChartContainer';
import { useAppActions } from '../context/AppActionsContext';
import { useChartTheme } from '../hooks/useChartTheme';
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

const STRATEGIES: DebtStrategy[] = ['snowball', 'avalanche', 'custom'];

const STRATEGY_COLORS: Record<DebtStrategy, string> = {
  snowball: '#10b981',
  avalanche: '#6366f1',
  custom: '#f59e0b',
};

function emptyDebt(): Omit<Debt, 'id'> {
  return { name: '', balance: 0, interestRate: 0, minimumPayment: 0, extraPayment: 0 };
}

export function DebtPlannerPage({ debts, onChange }: Props) {
  const { data, notifyUndo } = useAppActions();
  const chart = useChartTheme();
  const [form, setForm] = useState<Omit<Debt, 'id'>>(emptyDebt());
  const [editingId, setEditingId] = useState<string | null>(null);
  const [selectedDebtId, setSelectedDebtId] = useState<string | null>(null);
  const [compareView, setCompareView] = useState(true);
  const [validation, setValidation] = useState(emptyValidation());

  const strategyResults = useMemo(
    () => STRATEGIES.map((s) => simulateDebtStrategy(debts, s)),
    [debts],
  );

  const bestStrategy = useMemo(() => {
    if (strategyResults.every((r) => r.payoffMonths === 0)) return null;
    return strategyResults.reduce((best, cur) =>
      cur.totalInterest < best.totalInterest ? cur : best,
    );
  }, [strategyResults]);

  const comparisonChartData = useMemo(() => {
    const maxMonths = Math.max(...strategyResults.map((r) => r.payoffMonths), 1);
    const step = Math.max(1, Math.floor(maxMonths / 24));
    const points: Record<string, number | string>[] = [];

    for (let m = 0; m <= maxMonths; m += step) {
      const point: Record<string, number | string> = { month: m };
      for (const result of strategyResults) {
        let balance = result.timeline[0]?.totalBalance ?? 0;
        for (const t of result.timeline) {
          if (t.month <= m) balance = t.totalBalance;
        }
        if (m > result.payoffMonths) balance = 0;
        point[result.strategy] = balance;
      }
      points.push(point);
    }
    return points;
  }, [strategyResults]);

  function handleAdd() {
    const result = validateDebt(form);
    setValidation(result);
    if (!result.valid) return;

    if (editingId) {
      onChange(debts.map((d) => (d.id === editingId ? { ...form, id: editingId } : d)));
      setEditingId(null);
    } else {
      const newDebt = { ...form, id: generateId() };
      onChange([...debts, newDebt]);
      if (!selectedDebtId) setSelectedDebtId(newDebt.id);
    }
    setForm(emptyDebt());
    setValidation(emptyValidation());
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
    setValidation(emptyValidation());
  }

  function handleDelete(id: string) {
    const item = debts.find((d) => d.id === id);
    const snapshot = data;
    onChange(debts.filter((d) => d.id !== id));
    if (selectedDebtId === id) setSelectedDebtId(debts.find((d) => d.id !== id)?.id ?? null);
    notifyUndo(item ? `"${item.name}" removed.` : 'Debt removed.', snapshot);
  }

  const selectedDebt = debts.find((d) => d.id === selectedDebtId) ?? debts[0] ?? null;
  const payoffData = selectedDebt ? projectDebtPayoff(selectedDebt) : [];
  const payoffMonths = payoffData.length;
  const payoffYears = Math.floor(payoffMonths / 12);
  const payoffRemMonths = payoffMonths % 12;
  const totalInterest = payoffData.reduce((s, m) => s + m.interest, 0);

  const singleChartData = payoffData
    .filter(
      (_, i) =>
        i % Math.max(1, Math.floor(payoffData.length / 24)) === 0 ||
        i === payoffData.length - 1,
    )
    .map((m) => ({ month: m.month, balance: Math.round(m.balance) }));

  return (
    <div className="space-y-8">
      <PageHeader
        title="Debt Planner"
        subtitle="Compare snowball vs avalanche payoff strategies and track individual debts."
      />

      <Card>
        <CardHeader title={editingId ? 'Edit Debt' : 'Add Debt'} />
        <FormAlerts validation={validation} />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
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
            onChange={(e) => setForm({ ...form, balance: parseNonNegativeInput(e.target.value) })}
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
            onChange={(e) => setForm({ ...form, interestRate: parseNonNegativeInput(e.target.value) })}
          />
          <Input
            label="Minimum payment"
            type="number"
            min={0}
            placeholder="0"
            prefix="$"
            value={form.minimumPayment || ''}
            onChange={(e) => setForm({ ...form, minimumPayment: parseNonNegativeInput(e.target.value) })}
          />
          <Input
            label="Extra payment (custom)"
            type="number"
            min={0}
            placeholder="0"
            prefix="$"
            value={form.extraPayment || ''}
            onChange={(e) => setForm({ ...form, extraPayment: parseNonNegativeInput(e.target.value) })}
          />
        </div>
        <p className="text-xs text-slate-500 mt-3">
          Extra payments apply to the Custom strategy. Snowball and avalanche pool all extras automatically.
        </p>
        <div className="flex flex-col sm:flex-row gap-2 mt-5">
          <Button onClick={handleAdd}>{editingId ? 'Save Changes' : '+ Add Debt'}</Button>
          {editingId && (
            <Button
              variant="secondary"
              onClick={() => {
                setEditingId(null);
                setForm(emptyDebt());
                setValidation(emptyValidation());
              }}
            >
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
                <span className="text-sm font-semibold text-red-600">
                  {formatCurrency(debts.reduce((s, d) => s + d.balance, 0))} total
                </span>
              }
            />
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {debts.map((debt) => (
                <div key={debt.id} className="py-3 flex items-center justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <button
                      type="button"
                      onClick={() => setSelectedDebtId(debt.id)}
                      className={`font-medium truncate cursor-pointer ${
                        selectedDebt?.id === debt.id
                          ? 'text-indigo-600 dark:text-indigo-400'
                          : 'text-slate-800 dark:text-slate-100'
                      }`}
                    >
                      {debt.name}
                    </button>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {formatCurrency(debt.balance)} · {debt.interestRate}% APR ·{' '}
                      {formatCurrency(debt.minimumPayment + debt.extraPayment)}/mo
                      {debt.extraPayment > 0 && (
                        <span className="text-indigo-600"> (+{formatCurrency(debt.extraPayment)} extra)</span>
                      )}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="ghost" onClick={() => handleEdit(debt)}>Edit</Button>
                    <Button size="sm" variant="danger" onClick={() => handleDelete(debt.id)}>Remove</Button>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <Card>
            <CardHeader
              title="Strategy Comparison"
              subtitle="Same debts, different payoff methods"
              action={
                <button
                  type="button"
                  onClick={() => setCompareView(!compareView)}
                  className="text-xs font-medium text-indigo-600 cursor-pointer"
                >
                  {compareView ? 'Hide chart' : 'Show chart'}
                </button>
              }
            />
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
              {strategyResults.map((result) => {
                const isBest = bestStrategy?.strategy === result.strategy && debts.length > 0;
                return (
                  <div
                    key={result.strategy}
                    className={`rounded-xl p-4 border-2 ${
                      isBest
                        ? 'border-emerald-400 dark:border-emerald-600 bg-emerald-50/50 dark:bg-emerald-950/30'
                        : 'border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <p className="font-semibold text-sm text-slate-800 dark:text-slate-100">
                        {STRATEGY_LABELS[result.strategy]}
                      </p>
                      {isBest && (
                        <span className="text-[10px] font-bold uppercase tracking-wide text-emerald-600 bg-emerald-100 px-2 py-0.5 rounded-full">
                          Lowest interest
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 mb-3 leading-relaxed">
                      {STRATEGY_DESCRIPTIONS[result.strategy]}
                    </p>
                    <div className="space-y-1">
                      <p className="text-xs text-slate-500">Payoff</p>
                      <p className="text-lg font-bold text-slate-800">
                        {formatPayoffDuration(result.payoffMonths)}
                      </p>
                      <p className="text-xs text-slate-500 mt-2">Total interest</p>
                      <p className="text-base font-semibold text-red-600">
                        {formatCurrency(result.totalInterest)}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>

            {compareView && comparisonChartData.length > 1 && (
              <ChartContainer height={260}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={comparisonChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke={chart.grid} />
                  <XAxis dataKey="month" tick={{ fontSize: 11, fill: chart.tick }} tickFormatter={(v) => `Mo ${v}`} />
                  <YAxis tick={{ fontSize: 11, fill: chart.tick }} tickFormatter={(v) => `$${(Number(v) / 1000).toFixed(0)}k`} />
                  <Tooltip formatter={(v) => [formatCurrency(Number(v)), '']} contentStyle={chart.tooltip.contentStyle} />
                  <Legend />
                  {STRATEGIES.map((s) => (
                    <Line
                      key={s}
                      type="monotone"
                      dataKey={s}
                      stroke={STRATEGY_COLORS[s]}
                      strokeWidth={2}
                      dot={false}
                      name={STRATEGY_LABELS[s]}
                    />
                  ))}
                </LineChart>
              </ResponsiveContainer>
              </ChartContainer>
            )}
          </Card>

          {selectedDebt && payoffData.length > 0 && (
            <Card>
              <CardHeader
                title={`Individual: ${selectedDebt.name}`}
                subtitle={
                  payoffYears > 0
                    ? `Paid off in ${payoffYears}y ${payoffRemMonths}mo · ${formatCurrency(totalInterest)} interest (custom extras)`
                    : `Paid off in ${payoffMonths} months · ${formatCurrency(totalInterest)} interest`
                }
              />
              <ChartContainer height={200}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={singleChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke={chart.grid} />
                  <XAxis dataKey="month" tick={{ fontSize: 11, fill: chart.tick }} />
                  <YAxis tick={{ fontSize: 11, fill: chart.tick }} tickFormatter={(v) => `$${(Number(v) / 1000).toFixed(0)}k`} />
                  <Tooltip formatter={(v) => [formatCurrency(Number(v)), 'Balance']} contentStyle={chart.tooltip.contentStyle} />
                  <Line type="monotone" dataKey="balance" stroke="#6366f1" strokeWidth={2} dot={false} name="Balance" />
                </LineChart>
              </ResponsiveContainer>
              </ChartContainer>
            </Card>
          )}
        </>
      )}

      {debts.length === 0 && (
        <Card>
          <EmptyState
            icon="🏦"
            title="No debts tracked"
            description="Add your debts to compare snowball, avalanche, and custom payoff strategies."
          />
        </Card>
      )}
    </div>
  );
}
