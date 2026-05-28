import { useState, useMemo } from 'react';
import { ChevronRight, DollarSign, Banknote } from 'lucide-react';
import type { AppData, Page } from '../types';
import { formatCurrency } from '../utils/calculations';
import { optimizeCash, BUCKET_COLORS, type CashBucket } from '../utils/cashOptimization';
import { PRIORITY_ICONS, AppIcon } from './icons';
import { Card, CardHeader } from './Card';
import { CollapsibleSection } from './CollapsibleSection';

// ─── Priority label map ───────────────────────────────────────────────────────

const PRIORITY_LABELS: Record<CashBucket['priority'], string> = {
  critical: 'Priority',
  warning: 'Recommended',
  opportunity: 'Opportunity',
  healthy: 'Healthy',
};

const PRIORITY_BADGE: Record<
  CashBucket['priority'],
  string
> = {
  critical:
    'bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300',
  warning:
    'bg-amber-100 text-amber-800 dark:bg-amber-500/15 dark:text-amber-300',
  opportunity:
    'bg-indigo-100 text-indigo-700 dark:bg-indigo-500/15 dark:text-indigo-300',
  healthy:
    'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300',
};

// ─── Sub-components ───────────────────────────────────────────────────────────

/** Segmented allocation bar + legend */
function AllocationBar({
  buckets,
  total,
}: {
  buckets: CashBucket[];
  total: number;
}) {
  if (total <= 0 || buckets.length === 0) return null;

  return (
    <div className="mt-4">
      {/* Bar */}
      <div className="flex h-3 rounded-full overflow-hidden gap-px bg-[var(--surface-secondary)]">
        {buckets.map((b) => {
          const pct = (b.amount / total) * 100;
          if (pct < 0.5) return null;
          return (
            <div
              key={b.id}
              className={`${BUCKET_COLORS[b.kind].bar} transition-all duration-500`}
              style={{ width: `${pct}%` }}
              title={`${b.label}: ${formatCurrency(b.amount)}`}
            />
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-x-4 gap-y-1.5 mt-2.5">
        {buckets.map((b) => (
          <div key={b.id} className="flex items-center gap-1.5">
            <span
              className={`w-2 h-2 rounded-full shrink-0 ${BUCKET_COLORS[b.kind].dot}`}
            />
            <span className="text-xs text-secondary">{b.label}</span>
            <span className="text-xs font-semibold tabular-nums text-primary">
              {formatCurrency(b.amount)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

/** Single recommendation row */
function BucketRow({
  bucket,
  onNavigate,
}: {
  bucket: CashBucket;
  onNavigate?: (page: Page) => void;
}) {
  const colors = BUCKET_COLORS[bucket.kind];
  const PriorityIcon = PRIORITY_ICONS[bucket.priority];
  const badgeClass = PRIORITY_BADGE[bucket.priority];

  return (
    <div
      className={`rounded-xl px-4 py-3 border border-[var(--border-subtle)] bg-[var(--surface-secondary)]`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 min-w-0 flex-1">
          {/* Color dot */}
          <div
            className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${colors.dot}`}
          />

          <div className="min-w-0 flex-1">
            {/* Badge + label row */}
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <span
                className={`inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full ${badgeClass}`}
              >
                <AppIcon icon={PriorityIcon} size="xs" />
                {PRIORITY_LABELS[bucket.priority]}
              </span>
              <span className="text-sm font-semibold text-primary">
                {bucket.label}
              </span>
            </div>

            {/* Amount */}
            <p className="text-xs text-muted leading-relaxed">
              {bucket.rationale}
            </p>
          </div>
        </div>

        {/* Right: amount + action */}
        <div className="flex flex-col items-end gap-1.5 shrink-0 ml-1">
          <span className="text-sm font-bold tabular-nums text-primary">
            {formatCurrency(bucket.amount)}
          </span>
          {bucket.actionPage && onNavigate && (
            <button
              type="button"
              onClick={() => onNavigate(bucket.actionPage!)}
              className="inline-flex items-center gap-0.5 text-xs font-semibold text-indigo-600 dark:text-indigo-300 hover:text-indigo-800 dark:hover:text-indigo-200 cursor-pointer accent-ring rounded transition-colors"
            >
              Go
              <AppIcon icon={ChevronRight} size="xs" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Cash input ───────────────────────────────────────────────────────────────

function CashInput({
  value,
  onChange,
}: {
  value: number;
  onChange: (v: number) => void;
}) {
  const [raw, setRaw] = useState(value > 0 ? String(value) : '');

  function commit(str: string) {
    const n = parseFloat(str.replace(/[^0-9.]/g, ''));
    const safe = Number.isFinite(n) && n >= 0 ? n : 0;
    onChange(safe);
    setRaw(safe > 0 ? String(safe) : '');
  }

  return (
    <div className="relative flex items-center">
      <span className="absolute left-3 text-caption text-sm select-none text-muted pointer-events-none">
        $
      </span>
      <input
        type="number"
        min={0}
        step={100}
        placeholder="0"
        value={raw}
        onChange={(e) => setRaw(e.target.value)}
        onBlur={(e) => commit(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            commit((e.target as HTMLInputElement).value);
            (e.target as HTMLInputElement).blur();
          }
        }}
        className="w-full pl-7 pr-3 py-2.5 rounded-lg border border-slate-200 dark:border-white/[0.08] bg-white dark:bg-[var(--surface-secondary)] text-sm text-primary placeholder:text-caption focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500/50 dark:focus:ring-indigo-400/30 transition tabular-nums"
      />
    </div>
  );
}

// ─── Main card ────────────────────────────────────────────────────────────────

interface Props {
  data: AppData;
  availableCash: number;
  onCashChange: (amount: number) => void;
  onNavigate?: (page: Page) => void;
}

export function OptimizeCashCard({
  data,
  availableCash,
  onCashChange,
  onNavigate,
}: Props) {
  const result = useMemo(
    () => optimizeCash(data, availableCash),
    [data, availableCash],
  );

  const hasCash = availableCash > 0;
  const hasBuckets = result.buckets.length > 0;

  return (
    <Card>
      <CardHeader
        title="Optimize Cash"
        subtitle="Tell us how much you have available to allocate."
      />

      {/* Available cash input */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-4 pb-4 border-b border-[var(--border-subtle)]">
        <div className="flex items-center gap-2 shrink-0">
          <AppIcon
            icon={Banknote}
            size="sm"
            className="text-muted shrink-0"
          />
          <span className="text-sm font-medium text-secondary whitespace-nowrap">
            Available cash
          </span>
        </div>
        <div className="flex-1 min-w-0 sm:max-w-[200px]">
          <CashInput value={availableCash} onChange={onCashChange} />
        </div>
        {hasCash && (
          <p className="text-xs text-muted sm:ml-2">
            Enter/blur to update
          </p>
        )}
      </div>

      {/* Empty prompt */}
      {!hasCash && (
        <div className="flex flex-col items-center gap-3 py-6 text-center">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center">
            <AppIcon
              icon={DollarSign}
              size="md"
              className="text-indigo-500 dark:text-indigo-400"
            />
          </div>
          <div>
            <p className="text-sm font-medium text-primary">
              Enter your available cash above
            </p>
            <p className="text-xs text-muted mt-1 max-w-xs">
              We'll show you where it'll have the most impact — debt, emergency
              fund, or savings goals.
            </p>
          </div>
        </div>
      )}

      {/* Results */}
      {hasCash && hasBuckets && (
        <div className="space-y-4">
          {/* Allocation bar */}
          <AllocationBar
            buckets={result.buckets}
            total={result.availableCash}
          />

          {/* Recommendation rows */}
          <CollapsibleSection
            title="Recommended allocation"
            summary={`${result.buckets.length} prioritized use${result.buckets.length !== 1 ? 's' : ''} for ${formatCurrency(availableCash)}`}
            defaultExpanded
            bordered
            collapseOnMobile
          >
            <div className="space-y-2">
              {result.buckets.map((bucket) => (
                <BucketRow
                  key={bucket.id}
                  bucket={bucket}
                  onNavigate={onNavigate}
                />
              ))}
            </div>
          </CollapsibleSection>
        </div>
      )}
    </Card>
  );
}
