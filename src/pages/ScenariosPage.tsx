import { useState, useMemo } from 'react';
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

export function ScenariosPage({ data }: Props) {
  const [selected, setSelected] = useState<ScenarioPreset>('current');
  const [custom, setCustom] = useState<ScenarioAdjustments>(getPresetAdjustments('custom'));

  const isEmpty = data.income.length === 0 && data.expenses.length === 0;

  const allScenarios = useMemo(
    () => evaluateAllPresets(data, custom),
    [data, custom],
  );

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
            icon="🔮"
            title="Add your finances first"
            description="Enter income and expenses, then return here to compare what-if plans."
          />
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <PageHeader
        title="Scenarios"
        subtitle="Compare how different strategies affect your monthly cash flow, debt timeline, and savings."
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3">
        {PRESET_ORDER.map((preset) => {
          const metrics = allScenarios.find((s) => s.preset === preset)!;
          const isActive = selected === preset;
          return (
            <button
              key={preset}
              type="button"
              onClick={() => setSelected(preset)}
              className={`text-left p-4 rounded-2xl border-2 transition-all cursor-pointer ${
                isActive
                  ? 'border-indigo-500 bg-indigo-50/80 shadow-sm'
                  : 'border-slate-100 bg-white hover:border-slate-200'
              }`}
            >
              <p className={`font-semibold text-sm ${isActive ? 'text-indigo-700' : 'text-slate-800'}`}>
                {PRESET_LABELS[preset]}
              </p>
              <p className="text-xs text-slate-500 mt-1 line-clamp-2">{PRESET_DESCRIPTIONS[preset]}</p>
              <p
                className={`text-lg font-bold mt-3 tabular-nums ${
                  metrics.monthlyLeftover >= 0 ? 'text-emerald-600' : 'text-red-600'
                }`}
              >
                {formatCurrency(metrics.monthlyLeftover)}
                <span className="text-xs font-normal text-slate-500">/mo left</span>
              </p>
            </button>
          );
        })}
      </div>

      {selected === 'custom' && (
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader
            title={activeMetrics.label}
            subtitle={PRESET_DESCRIPTIONS[selected]}
          />
          <div className="space-y-0">
            <MetricRow label="Monthly leftover" value={activeMetrics.monthlyLeftover} highlight />
            <MetricRow label="Safe weekly spending" value={activeMetrics.safeWeeklySpending} />
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
            {allScenarios.map((s) => {
              const max = Math.max(...allScenarios.map((x) => Math.abs(x.monthlyLeftover)), 1);
              const pct = (Math.abs(s.monthlyLeftover) / max) * 100;
              const positive = s.monthlyLeftover >= 0;
              return (
                <div key={s.preset}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className={selected === s.preset ? 'font-semibold text-indigo-700' : 'text-slate-600'}>
                      {s.label}
                    </span>
                    <span
                      className={`font-semibold tabular-nums ${
                        positive ? 'text-emerald-600' : 'text-red-600'
                      }`}
                    >
                      {formatCurrency(s.monthlyLeftover)}
                    </span>
                  </div>
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${positive ? 'bg-emerald-500' : 'bg-red-400'}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      </div>

      <Card>
        <CardHeader title="Scenario comparison table" />
        <div className="overflow-x-auto -mx-2">
          <table className="w-full text-sm min-w-[640px]">
            <thead>
              <tr className="border-b border-slate-100">
                <th className="text-left py-3 px-2 font-semibold text-slate-600">Metric</th>
                {allScenarios.map((s) => (
                  <th
                    key={s.preset}
                    className={`text-right py-3 px-2 font-semibold ${
                      selected === s.preset ? 'text-indigo-600' : 'text-slate-600'
                    }`}
                  >
                    {s.label.replace(' Plan', '').replace(' Scenario', '')}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              <CompareRow
                label="Monthly leftover"
                values={allScenarios.map((s) => formatCurrency(s.monthlyLeftover))}
              />
              <CompareRow
                label="Weekly spending"
                values={allScenarios.map((s) => formatCurrency(s.safeWeeklySpending))}
              />
              <CompareRow
                label="Debt-free in"
                values={allScenarios.map((s) => formatPayoffDuration(s.debtPayoffMonths))}
              />
              <CompareRow
                label="Total interest"
                values={allScenarios.map((s) => formatCurrency(s.totalDebtInterest))}
              />
              <CompareRow
                label="EF timeline"
                values={allScenarios.map((s) =>
                  s.emergencyFundMonths != null
                    ? formatPayoffDuration(s.emergencyFundMonths)
                    : '—',
                )}
              />
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

function CompareRow({ label, values }: { label: string; values: string[] }) {
  return (
    <tr>
      <td className="py-3 px-2 text-slate-600">{label}</td>
      {values.map((v, i) => (
        <td key={i} className="py-3 px-2 text-right font-medium text-slate-800 tabular-nums">
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
        <span className="font-medium text-slate-700">{label}</span>
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
