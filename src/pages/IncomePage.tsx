import { useState } from 'react';
import { Info } from 'lucide-react';
import type { IncomeSource, TaxProfile } from '../types';
import { generateId } from '../utils/storage';
import { toMonthly, formatCurrency } from '../utils/calculations';
import {
  DEFAULT_TAX_PROFILE,
  estimateNetMonthly,
  estimateMonthlyTax,
  grossMonthlyAmount,
  effectiveTakeHomeRate,
} from '../utils/taxEstimation';
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
import { CollapsibleSection } from '../components/CollapsibleSection';
import {
  CrudPageLayout,
  crudFormCardClass,
  crudListItemClass,
} from '../components/CrudPageLayout';
import { useAppActions } from '../context/AppActionsContext';
import { EMPTY_STATE_ICONS } from '../components/icons';

const FREQUENCY_OPTIONS = [
  { value: 'monthly',   label: 'Monthly' },
  { value: 'biweekly',  label: 'Bi-weekly' },
  { value: 'weekly',    label: 'Weekly' },
  { value: 'annually',  label: 'Annually' },
];

interface Props {
  income: IncomeSource[];
  onChange: (income: IncomeSource[]) => void;
}

function emptySource(): Omit<IncomeSource, 'id'> {
  return {
    name:        '',
    amount:      0,
    frequency:   'monthly',
    isGross:     false,
    taxProfile:  { ...DEFAULT_TAX_PROFILE },
  };
}

export function IncomePage({ income, onChange }: Props) {
  const { data, notifyUndo } = useAppActions();
  const [form, setForm]           = useState<Omit<IncomeSource, 'id'>>(emptySource());
  const [editingId, setEditingId] = useState<string | null>(null);
  const [validation, setValidation] = useState(emptyValidation());

  // ---------------------------------------------------------------------------
  // Form helpers
  // ---------------------------------------------------------------------------

  function updateTaxProfile(field: keyof TaxProfile, value: number) {
    setForm((prev) => ({
      ...prev,
      taxProfile: { ...(prev.taxProfile ?? DEFAULT_TAX_PROFILE), [field]: value },
    }));
  }

  function handleAdd() {
    const result = mergeValidation(
      validateRequiredName(form.name),
      validatePositiveAmount(form.amount, 'Income amount'),
    );
    setValidation(result);
    if (!result.valid) return;

    const sourceToSave: Omit<IncomeSource, 'id'> = {
      ...form,
      taxProfile: form.isGross ? form.taxProfile : undefined,
    };

    if (editingId) {
      onChange(income.map((s) => (s.id === editingId ? { ...sourceToSave, id: editingId } : s)));
      setEditingId(null);
    } else {
      onChange([...income, { ...sourceToSave, id: generateId() }]);
    }
    setForm(emptySource());
    setValidation(emptyValidation());
  }

  function handleEdit(source: IncomeSource) {
    setEditingId(source.id);
    setForm({
      name:       source.name,
      amount:     source.amount,
      frequency:  source.frequency,
      isGross:    source.isGross ?? false,
      taxProfile: source.taxProfile ?? { ...DEFAULT_TAX_PROFILE },
    });
    setValidation(emptyValidation());
  }

  function handleDelete(id: string) {
    const item     = income.find((s) => s.id === id);
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

  // ---------------------------------------------------------------------------
  // Live preview values (form state only)
  // ---------------------------------------------------------------------------
  const previewGross = toMonthly(form.amount, form.frequency);
  const previewNet   = estimateNetMonthly({ ...form, id: 'preview' });
  const previewTax   = previewGross - previewNet;
  const previewRate  = previewGross > 0 ? (previewNet / previewGross) * 100 : 0;
  const showPreview  = form.isGross && form.amount > 0;

  // ---------------------------------------------------------------------------
  // Summary values (all sources)
  // ---------------------------------------------------------------------------
  const totalNetMonthly = income.reduce((sum, s) => sum + estimateNetMonthly(s), 0);
  const hasGross        = income.some((s) => s.isGross);
  const totalGross      = income.reduce((sum, s) => sum + grossMonthlyAmount(s), 0);
  const totalTax        = income.reduce((sum, s) => sum + estimateMonthlyTax(s), 0);
  const overallRate     = totalGross > 0 ? (totalNetMonthly / totalGross) * 100 : 100;

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------
  return (
    <div className="page-stack">
      <PageHeader
        title="Income"
        subtitle="Add all sources of income. Gross amounts are converted to estimated take-home for your plan."
      />

      <CrudPageLayout
        editingActive={!!editingId}
        form={
      <Card data-tour="income-form" className={crudFormCardClass(!!editingId)}>
        <CardHeader title={editingId ? 'Edit Income Source' : 'Add Income Source'} />
        <FormAlerts validation={validation} />

        <div className="grid grid-cols-1 gap-3 sm:gap-4">
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

        {/* Gross / Net toggle */}
        <div className="mt-5">
          <p className="text-sm font-medium text-secondary mb-2">Income type</p>
          <div className="inline-flex gap-1 p-1 rounded-xl bg-[var(--surface-secondary)] border border-[var(--border-subtle)]">
            <button
              type="button"
              onClick={() => setForm({ ...form, isGross: false })}
              className={`px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all ${
                !form.isGross
                  ? 'bg-white dark:bg-[var(--surface-primary)] text-primary shadow-sm'
                  : 'text-muted hover:text-secondary'
              }`}
            >
              Already net income
            </button>
            <button
              type="button"
              onClick={() => setForm({ ...form, isGross: true })}
              className={`px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all ${
                form.isGross
                  ? 'bg-white dark:bg-[var(--surface-primary)] text-primary shadow-sm'
                  : 'text-muted hover:text-secondary'
              }`}
            >
              Gross before taxes
            </button>
          </div>
        </div>

        {/* Tax assumptions (only when gross) */}
        {form.isGross && (
          <CollapsibleSection
            title="Tax assumptions"
            summary="Editable effective rates — not tax advice"
            defaultExpanded={false}
            bordered={true}
          >
            <div className="grid grid-cols-2 gap-3 mt-1">
              <Input
                label="Federal rate (%)"
                type="number"
                min={0}
                max={50}
                step={0.1}
                value={form.taxProfile?.federalRate ?? DEFAULT_TAX_PROFILE.federalRate}
                onChange={(e) =>
                  updateTaxProfile('federalRate', parseFloat(e.target.value) || 0)
                }
              />
              <Input
                label="State rate (%)"
                type="number"
                min={0}
                max={20}
                step={0.01}
                value={form.taxProfile?.stateRate ?? DEFAULT_TAX_PROFILE.stateRate}
                onChange={(e) =>
                  updateTaxProfile('stateRate', parseFloat(e.target.value) || 0)
                }
              />
              <Input
                label="FICA rate (%)"
                type="number"
                min={0}
                max={20}
                step={0.01}
                value={form.taxProfile?.ficaRate ?? DEFAULT_TAX_PROFILE.ficaRate}
                onChange={(e) =>
                  updateTaxProfile('ficaRate', parseFloat(e.target.value) || 0)
                }
              />
              <Input
                label="Pre-tax deductions/mo"
                type="number"
                min={0}
                step={10}
                prefix="$"
                value={form.taxProfile?.pretaxDeductionsMonthly ?? 0}
                onChange={(e) =>
                  updateTaxProfile(
                    'pretaxDeductionsMonthly',
                    parseNonNegativeInput(e.target.value),
                  )
                }
              />
              <Input
                label="Post-tax deductions/mo"
                type="number"
                min={0}
                step={10}
                prefix="$"
                value={form.taxProfile?.posttaxDeductionsMonthly ?? 0}
                onChange={(e) =>
                  updateTaxProfile(
                    'posttaxDeductionsMonthly',
                    parseNonNegativeInput(e.target.value),
                  )
                }
              />
            </div>
            <p className="flex items-center gap-1.5 text-xs text-muted mt-3">
              <Info size={12} className="shrink-0" />
              Planning estimate only — not tax advice.
            </p>
          </CollapsibleSection>
        )}

        {/* Live take-home preview */}
        {showPreview && (
          <div className="mt-4 p-4 rounded-xl bg-[var(--surface-secondary)] border border-[var(--border-subtle)]">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted mb-3">
              Estimated take-home preview
            </p>
            <div className="space-y-2">
              <div className="flex justify-between items-center text-sm">
                <span className="text-secondary">Gross monthly</span>
                <span className="tabular-nums font-medium text-primary">
                  {formatCurrency(previewGross)}
                </span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-secondary">Est. taxes &amp; deductions</span>
                <span className="tabular-nums font-medium text-rose-500 dark:text-rose-400">
                  −{formatCurrency(previewTax)}
                </span>
              </div>
              <div className="flex justify-between items-center text-sm pt-2 border-t border-[var(--border-subtle)]">
                <span className="font-semibold text-primary">Est. take-home</span>
                <span className="tabular-nums font-semibold text-emerald-600 dark:text-emerald-400">
                  {formatCurrency(previewNet)}/mo
                </span>
              </div>
            </div>
            <p className="text-xs text-muted mt-2.5">
              {previewRate.toFixed(0)}% effective take-home rate
            </p>
          </div>
        )}

        <div className="flex flex-col gap-2 mt-4">
          <Button onClick={handleAdd}>{editingId ? 'Save Changes' : '+ Add Source'}</Button>
          {editingId && (
            <Button variant="secondary" onClick={handleCancel}>
              Cancel editing
            </Button>
          )}
        </div>
      </Card>
        }
        list={
      income.length > 0 ? (
        <Card>
          <CardHeader
            title="Income Sources"
            action={
              <span className="text-sm font-semibold text-indigo-600 dark:text-indigo-400 tabular-nums">
                {formatCurrency(totalNetMonthly)}/mo net
              </span>
            }
          />
          <div className="list-divider">
            {income.map((source) => {
              const netMo   = estimateNetMonthly(source);
              const grossMo = grossMonthlyAmount(source);
              const rate    = effectiveTakeHomeRate(source);
              return (
                <div
                  key={source.id}
                  className={crudListItemClass(
                    editingId === source.id,
                    'flex flex-col sm:flex-row sm:items-center justify-between py-4 gap-3',
                  )}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-primary truncate">{source.name}</p>
                      {source.isGross && (
                        <span className="shrink-0 text-[10px] font-semibold uppercase tracking-wide text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-400/10 px-1.5 py-0.5 rounded-md">
                          Gross
                        </span>
                      )}
                    </div>
                    {source.isGross ? (
                      <p className="text-xs text-muted mt-0.5">
                        {formatCurrency(source.amount)} {source.frequency} ·{' '}
                        Gross {formatCurrency(grossMo)}/mo ·{' '}
                        <span className="text-emerald-600 dark:text-emerald-400 font-medium">
                          Est. take-home {formatCurrency(netMo)}/mo
                        </span>{' '}
                        ({(rate * 100).toFixed(0)}%)
                      </p>
                    ) : (
                      <p className="text-xs text-muted capitalize mt-0.5">
                        {formatCurrency(source.amount)} {source.frequency} ·{' '}
                        {formatCurrency(toMonthly(source.amount, source.frequency))}/mo
                      </p>
                    )}
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
              );
            })}
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
      )
        }
        after={
      hasGross && income.length > 0 ? (
        <Card className="mt-4">
          <CardHeader title="Income Summary" />
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-muted mb-1.5">
                Gross monthly
              </p>
              <p className="text-xl font-bold text-primary tabular-nums">
                {formatCurrency(totalGross)}
              </p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-muted mb-1.5">
                Est. taxes
              </p>
              <p className="text-xl font-bold text-rose-600 dark:text-rose-400 tabular-nums">
                −{formatCurrency(totalTax)}
              </p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-muted mb-1.5">
                Net monthly
              </p>
              <p className="text-xl font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">
                {formatCurrency(totalNetMonthly)}
              </p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-muted mb-1.5">
                Take-home rate
              </p>
              <p className="text-xl font-bold text-primary tabular-nums">
                {overallRate.toFixed(0)}%
              </p>
            </div>
          </div>
        </Card>
      ) : null
        }
      />
    </div>
  );
}
