import { useState, useMemo, useEffect } from 'react';
import type { Debt, DebtStrategy } from '../types';
import { generateId } from '../utils/storage';
import { formatCurrency } from '../utils/calculations';
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
import { EMPTY_STATE_ICONS } from '../components/icons';
import { CollapsibleSection } from '../components/CollapsibleSection';
import { EmptyState } from '../components/EmptyState';
import { FormAlerts } from '../components/FormAlerts';
import { ChartContainer } from '../components/ChartContainer';
import { ChartTooltip } from '../components/charts/ChartTooltip';
import { DebtChartFilter } from '../components/charts/DebtChartFilter';
import { useAppActions } from '../context/AppActionsContext';
import { useChartTheme } from '../hooks/useChartTheme';
import {
  buildMultiDebtChartRows,
  buildStrategyComparisonRows,
  debtChartKey,
  getDebtTimelineSeries,
} from '../utils/debtChartData';
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
  const [debtChartView, setDebtChartView] = useState(true);
  const [visibleDebtIds, setVisibleDebtIds] = useState<Set<string>>(() => new Set());
  const [validation, setValidation] = useState(emptyValidation());

  useEffect(() => {
    setVisibleDebtIds((prev) => {
      if (debts.length === 0) return new Set();
      const existing = new Set(debts.map((d) => d.id));
      if (prev.size === 0) return existing;
      const next = new Set<string>();
      for (const id of prev) {
        if (existing.has(id)) next.add(id);
      }
      for (const d of debts) {
        if (!prev.has(d.id)) next.add(d.id);
      }
      if (next.size === 0) return existing;
      return next;
    });
  }, [debts]);

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

  const comparisonChartData = useMemo(
    () => buildStrategyComparisonRows(strategyResults),
    [strategyResults],
  );

  const debtIndexById = useMemo(
    () => new Map(debts.map((d, i) => [d.id, i])),
    [debts],
  );

  const perDebtChartData = useMemo(() => {
    const visible = debts.filter((d) => visibleDebtIds.has(d.id));
    const series = visible.map((d) => getDebtTimelineSeries(d));
    return buildMultiDebtChartRows(series);
  }, [debts, visibleDebtIds]);

  const visibleDebtsForChart = useMemo(
    () => debts.filter((d) => visibleDebtIds.has(d.id)),
    [debts, visibleDebtIds],
  );

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

  return (
    <div className="page-stack">
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
            step={50}
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
            step={25}
            placeholder="0"
            prefix="$"
            value={form.minimumPayment || ''}
            onChange={(e) => setForm({ ...form, minimumPayment: parseNonNegativeInput(e.target.value) })}
          />
          <Input
            label="Extra payment (custom)"
            type="number"
            min={0}
            step={25}
            placeholder="0"
            prefix="$"
            value={form.extraPayment || ''}
            onChange={(e) => setForm({ ...form, extraPayment: parseNonNegativeInput(e.target.value) })}
          />
        </div>
        <p className="text-xs text-muted mt-3">
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
            <div className="list-divider">
              {debts.map((debt) => {
                const monthly = debt.minimumPayment + debt.extraPayment;
                const isSelected = selectedDebt?.id === debt.id;
                return (
                  <div key={debt.id} className="py-3">
                    <CollapsibleSection
                      title={debt.name}
                      summary={`${formatCurrency(debt.balance)} · ${formatCurrency(monthly)}/mo`}
                      defaultExpanded={isSelected}
                      collapseOnMobile
                      bordered={false}
                      actions={
                        <>
                          <Button size="sm" variant="ghost" onClick={() => handleEdit(debt)}>
                            Edit
                          </Button>
                          <Button size="sm" variant="danger" onClick={() => handleDelete(debt.id)}>
                            Remove
                          </Button>
                        </>
                      }
                    >
                      <div className="space-y-3 text-sm">
                        <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
                          <div>
                            <dt className="text-muted">Balance</dt>
                            <dd className="font-medium text-primary tabular-nums mt-0.5">
                              {formatCurrency(debt.balance)}
                            </dd>
                          </div>
                          <div>
                            <dt className="text-muted">APR</dt>
                            <dd className="font-medium text-primary tabular-nums mt-0.5">
                              {debt.interestRate}%
                            </dd>
                          </div>
                          <div>
                            <dt className="text-muted">Minimum</dt>
                            <dd className="font-medium text-primary tabular-nums mt-0.5">
                              {formatCurrency(debt.minimumPayment)}/mo
                            </dd>
                          </div>
                          <div>
                            <dt className="text-muted">Extra payment</dt>
                            <dd className="font-medium text-primary tabular-nums mt-0.5">
                              {formatCurrency(debt.extraPayment)}/mo
                            </dd>
                          </div>
                        </dl>
                        <button
                          type="button"
                          onClick={() => setSelectedDebtId(debt.id)}
                          className={`text-xs font-semibold cursor-pointer accent-ring rounded ${
                            isSelected
                              ? 'text-indigo-600 dark:text-indigo-400'
                              : 'text-indigo-600/80 dark:text-indigo-400/80 hover:underline'
                          }`}
                        >
                          {isSelected ? 'Shown on payoff chart' : 'Highlight on payoff chart'}
                        </button>
                      </div>
                    </CollapsibleSection>
                  </div>
                );
              })}
            </div>
          </Card>

          <Card data-tour="debt-strategy-card">
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
                    className={`rounded-xl p-4 sm:p-5 border transition-all ${
                      isBest
                        ? 'border-emerald-500/30 bg-emerald-500/[0.06] ring-1 ring-emerald-500/20'
                        : 'border-[var(--border-subtle)] surface-muted'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <p className="font-semibold text-sm text-primary">
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
                      <p className="text-lg font-bold text-primary">
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
                  <CartesianGrid strokeDasharray="3 3" stroke={chart.grid} vertical={false} />
                  <XAxis dataKey="month" tick={{ fontSize: 11, fill: chart.tick }} tickFormatter={(v) => `Mo ${v}`} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: chart.tick }} tickFormatter={(v) => `$${(Number(v) / 1000).toFixed(0)}k`} axisLine={false} tickLine={false} />
                  <Tooltip
                    content={
                      <ChartTooltip formatLabel={(l) => `Month ${l}`} />
                    }
                  />
                  <Legend wrapperStyle={chart.legendStyle} iconType="circle" iconSize={8} />
                  {STRATEGIES.map((s, i) => (
                    <Line
                      key={s}
                      type="monotone"
                      dataKey={s}
                      stroke={chart.series.lines[i]}
                      strokeWidth={2}
                      dot={false}
                      connectNulls={false}
                      name={STRATEGY_LABELS[s]}
                    />
                  ))}
                </LineChart>
              </ResponsiveContainer>
              </ChartContainer>
            )}
            </Card>

          <Card>
              <CardHeader
                title="Debt Payoff Over Time"
                subtitle="Compare individual debt balances (custom payments per debt)"
                action={
                  <button
                    type="button"
                    onClick={() => setDebtChartView(!debtChartView)}
                    className="text-xs font-medium text-indigo-600 dark:text-indigo-400 cursor-pointer"
                  >
                    {debtChartView ? 'Hide chart' : 'Show chart'}
                  </button>
                }
              />
              <DebtChartFilter
                debts={debts}
                visibleIds={visibleDebtIds}
                onChange={setVisibleDebtIds}
                debtColor={chart.debtColor}
              />
              {debtChartView && visibleDebtsForChart.length > 0 && perDebtChartData.length > 0 && (
                <ChartContainer height={280} className="mt-4">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={perDebtChartData} margin={{ top: 8, right: 8, left: -4, bottom: 4 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke={chart.grid} vertical={false} />
                      <XAxis
                        dataKey="month"
                        tick={{ fontSize: 11, fill: chart.tick }}
                        tickFormatter={(v) => `Mo ${v}`}
                        axisLine={false}
                        tickLine={false}
                      />
                      <YAxis
                        tick={{ fontSize: 11, fill: chart.tick }}
                        tickFormatter={(v) => `$${(Number(v) / 1000).toFixed(0)}k`}
                        axisLine={false}
                        tickLine={false}
                      />
                      <Tooltip content={<ChartTooltip formatLabel={(l) => `Month ${l}`} />} />
                      <Legend wrapperStyle={chart.legendStyle} iconType="circle" iconSize={8} />
                      {visibleDebtsForChart.map((debt) => {
                        const idx = debtIndexById.get(debt.id) ?? 0;
                        return (
                          <Line
                            key={debt.id}
                            type="monotone"
                            dataKey={debtChartKey(debt.id)}
                            stroke={chart.debtColor(idx)}
                            strokeWidth={2}
                            dot={false}
                            connectNulls={false}
                            name={debt.name}
                          />
                        );
                      })}
                    </LineChart>
                  </ResponsiveContainer>
                </ChartContainer>
              )}
            </Card>
        </>
      )}

      {debts.length === 0 && (
        <Card>
          <EmptyState
            icon={EMPTY_STATE_ICONS.debt}
            title="No debts tracked"
            description="Add your debts to compare snowball, avalanche, and custom payoff strategies."
          />
        </Card>
      )}
    </div>
  );
}
