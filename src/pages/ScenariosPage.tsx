import { useState, useMemo, useEffect } from 'react';
import type { AppData, ScenarioAdjustments, ScenarioPreset } from '../types';
import {
  evaluateScenario,
  evaluateAllPresets,
  getPresetAdjustments,
  PRESET_LABELS,
  PRESET_DESCRIPTIONS,
} from '../utils/scenarios';
import { formatCurrency } from '../utils/calculations';
import { formatPayoffDuration } from '../utils/debtStrategies';
import { PageHeader } from '../components/PageHeader';
import { Card, CardHeader } from '../components/Card';
import { EmptyState } from '../components/EmptyState';
import { MetricRow } from '../components/MetricRow';
import { EMPTY_STATE_ICONS } from '../components/icons';

interface Props {
  data: AppData;
}

const PRESET_ORDER: ScenarioPreset[] = [
  'current',
  'aggressive-debt',
  'higher-savings',
  'lower-spending',
  'custom',
];

function isPositiveScenario(monthlyLeftover: number): boolean {
  return monthlyLeftover >= 0;
}

export function ScenariosPage({ data }: Props) {
  const [selected, setSelected] = useState<ScenarioPreset>('current');
  const [custom, setCustom] = useState<ScenarioAdjustments>(getPresetAdjustments('custom'));

  const isEmpty = data.income.length === 0 && data.expenses.length === 0;

  const allScenarios = useMemo(
    () => evaluateAllPresets(data, custom),
    [data, custom],
  );

  const visibleScenarios = useMemo(
    () => allScenarios.filter((s) => isPositiveScenario(s.monthlyLeftover)),
    [allScenarios],
  );

  const visiblePresets = useMemo(
    () => PRESET_ORDER.filter((p) => visibleScenarios.some((s) => s.preset === p)),
    [visibleScenarios],
  );

  useEffect(() => {
    if (visiblePresets.length === 0) return;
    if (!visiblePresets.includes(selected)) {
      setSelected(visiblePresets[0]);
    }
  }, [visiblePresets, selected]);

  const activeAdjustments =
    selected === 'custom' ? custom : getPresetAdjustments(selected);
  const activeMetrics = useMemo(
    () => evaluateScenario(data, selected, activeAdjustments),
    [data, selected, activeAdjustments],
  );

  if (isEmpty) {
    return (
      <div>
        <PageHeader
          title="Scenarios"
          subtitle="Compare financial plans side by side — debt payoff, savings, and spending changes."
        />
        <Card>
          <EmptyState
            icon={EMPTY_STATE_ICONS.scenarios}
            title="Add your finances first"
            description="Enter income and expenses, then return here to compare what-if plans."
          />
        </Card>
      </div>
    );
  }

  const hasVisibleScenarios = visiblePresets.length > 0;

  return (
    <div className="page-stack">
      <PageHeader
        title="Scenarios"
        subtitle="Compare how different strategies affect your monthly cash flow, debt timeline, and savings."
      />

      {hasVisibleScenarios ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3" data-tour="scenarios-presets">
          {visiblePresets.map((preset) => {
            const metrics = visibleScenarios.find((s) => s.preset === preset)!;
            const isActive = selected === preset;
            return (
              <button
                key={preset}
                type="button"
                onClick={() => setSelected(preset)}
                className={`text-left p-4 sm:p-5 rounded-2xl border transition-all duration-200 cursor-pointer ${
                  isActive
                    ? 'border-indigo-500/40 bg-indigo-500/[0.08] ring-1 ring-indigo-500/25 shadow-sm dark:shadow-indigo-500/10'
                    : 'surface-card hover:border-indigo-500/20 dark:hover:bg-[var(--surface-secondary)]'
                }`}
              >
                <p className={`font-semibold text-sm ${isActive ? 'text-indigo-700 dark:text-indigo-300' : 'text-primary'}`}>
                  {PRESET_LABELS[preset]}
                </p>
                <p className="text-xs text-secondary mt-1.5 line-clamp-2">{PRESET_DESCRIPTIONS[preset]}</p>
                <p className="text-lg font-bold mt-3 tabular-nums text-emerald-600 dark:text-emerald-400">
                  {formatCurrency(metrics.monthlyLeftover)}
                  <span className="text-xs font-normal text-muted">/mo left</span>
                </p>
              </button>
            );
          })}
        </div>
      ) : (
        <Card>
          <EmptyState
            icon={EMPTY_STATE_ICONS.scenarios}
            title="No positive scenarios yet"
            description="Every plan modeled here shows a monthly deficit. Reduce expenses, debt payments, or savings targets, then check back for workable options."
          />
        </Card>
      )}

      {hasVisibleScenarios && selected === 'custom' && visiblePresets.includes('custom') && (
        <Card>
          <CardHeader title="Custom adjustments" subtitle="Tune your what-if scenario" />
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <SliderField
              label="Expense reduction"
              value={Math.round((1 - custom.expenseMultiplier) * 100)}
              min={0}
              max={40}
              suffix="% less"
              onChange={(v) =>
                setCustom({ ...custom, expenseMultiplier: 1 - v / 100 })
              }
            />
            <SliderField
              label="Extra debt payment"
              value={custom.extraDebtPayment}
              min={0}
              max={1000}
              step={25}
              suffix="/mo"
              onChange={(v) => setCustom({ ...custom, extraDebtPayment: v })}
            />
            <SliderField
              label="Savings boost"
              value={Math.round((custom.savingsMultiplier - 1) * 100)}
              min={0}
              max={100}
              suffix="% more"
              onChange={(v) =>
                setCustom({ ...custom, savingsMultiplier: 1 + v / 100 })
              }
            />
          </div>
        </Card>
      )}

      {hasVisibleScenarios && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader
              title={activeMetrics.label}
              subtitle={PRESET_DESCRIPTIONS[selected]}
            />
            <div className="space-y-0">
              <MetricRow label="Monthly leftover" value={activeMetrics.monthlyLeftover} highlight />
              <MetricRow label="Weekly flex" value={activeMetrics.safeWeeklySpending} />
              <MetricRow
                label="Debt payoff timeline"
                value={formatPayoffDuration(activeMetrics.debtPayoffMonths)}
                format="text"
              />
              <MetricRow label="Total interest (est.)" value={activeMetrics.totalDebtInterest} />
              <MetricRow
                label="Monthly savings contributions"
                value={activeMetrics.monthlySavingsContribution}
              />
              <MetricRow
                label="Emergency fund timeline"
                value={
                  activeMetrics.emergencyFundMonths != null
                    ? formatPayoffDuration(activeMetrics.emergencyFundMonths)
                    : '—'
                }
                format="text"
              />
            </div>
          </Card>

          <Card>
            <CardHeader title="Compare all scenarios" subtitle="Monthly leftover" />
            <div className="space-y-3">
              {visibleScenarios.map((s) => {
                const max = Math.max(...visibleScenarios.map((x) => x.monthlyLeftover), 1);
                const pct = (s.monthlyLeftover / max) * 100;
                return (
                  <div key={s.preset}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className={selected === s.preset ? 'font-semibold text-indigo-700 dark:text-indigo-400' : 'text-secondary'}>
                        {s.label}
                      </span>
                      <span className="font-semibold tabular-nums text-emerald-600 dark:text-emerald-400">
                        {formatCurrency(s.monthlyLeftover)}
                      </span>
                    </div>
                    <div className="h-2 bg-zinc-100 dark:bg-zinc-800/80 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full bg-emerald-500"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        </div>
      )}

      {hasVisibleScenarios && (
        <Card>
          <CardHeader title="Scenario comparison table" />
          <div className="table-scroll">
            <table className="w-full text-sm min-w-[640px]">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800">
                  <th className="text-left py-3 px-2 font-semibold text-slate-600 dark:text-slate-400">Metric</th>
                  {visibleScenarios.map((s) => (
                    <th
                      key={s.preset}
                      className={`text-right py-3 px-2 font-semibold ${
                        selected === s.preset ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      {s.label.replace(' Plan', '').replace(' Scenario', '')}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="[&_tr]:border-t [&_tr]:border-[var(--border-subtle)] [&_tr:first-child]:border-0">
                <CompareRow
                  label="Monthly leftover"
                  values={visibleScenarios.map((s) => formatCurrency(s.monthlyLeftover))}
                />
                <CompareRow
                  label="Weekly flex"
                  values={visibleScenarios.map((s) => formatCurrency(s.safeWeeklySpending))}
                />
                <CompareRow
                  label="Debt-free in"
                  values={visibleScenarios.map((s) => formatPayoffDuration(s.debtPayoffMonths))}
                />
                <CompareRow
                  label="Total interest"
                  values={visibleScenarios.map((s) => formatCurrency(s.totalDebtInterest))}
                />
                <CompareRow
                  label="EF timeline"
                  values={visibleScenarios.map((s) =>
                    s.emergencyFundMonths != null
                      ? formatPayoffDuration(s.emergencyFundMonths)
                      : '—',
                  )}
                />
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}

function CompareRow({ label, values }: { label: string; values: string[] }) {
  return (
    <tr>
      <td className="py-3 px-2 text-muted">{label}</td>
      {values.map((v, i) => (
        <td key={i} className="py-3 px-2 text-right font-medium text-primary tabular-nums">
          {v}
        </td>
      ))}
    </tr>
  );
}

function SliderField({
  label,
  value,
  min,
  max,
  step = 1,
  suffix,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  suffix: string;
  onChange: (v: number) => void;
}) {
  return (
    <div>
      <div className="flex justify-between text-sm mb-2">
        <span className="font-medium text-slate-700 dark:text-slate-300">{label}</span>
        <span className="font-semibold text-indigo-600 tabular-nums">
          {value}
          {suffix}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="w-full accent-indigo-600"
      />
    </div>
  );
}
