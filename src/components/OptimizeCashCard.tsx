import { useState, useMemo } from 'react';
import { ChevronDown, ChevronUp, DollarSign, Banknote, Info } from 'lucide-react';
import type { AppData, Page } from '../types';
import { formatCurrency } from '../utils/calculations';
import {
  optimizeCash,
  buildReserveModeExplanation,
  WATERFALL_COLORS,
  PRIORITY_BADGES,
  RESERVE_MODE_META,
  type CashAllocationStrategy,
  type CashWaterfallSegment,
  type DebtPayoffRecommendation,
  type ReserveMode,
} from '../utils/cashOptimization';
import { AppIcon } from './icons';
import { Card, CardHeader } from './Card';
import { CollapsibleSection } from './CollapsibleSection';

// ─── Display helpers ──────────────────────────────────────────────────────────

function formatTimelineMonths(months: number): string {
  if (months >= 360) return '360+ mo';
  if (months > 0) return `${months} mo`;
  return 'No payoff path';
}

function formatReservedStat(strategy: CashAllocationStrategy): { value: string; sub: string } {
  const { recommendedRetained, minBufferAlreadyCovered, emergencyReserveAmount, plannedReserveAmount, efTopUpAmount } =
    strategy;
  if (recommendedRetained > 0) {
    const parts: string[] = [];
    if (emergencyReserveAmount > 0) parts.push('buffer');
    if (plannedReserveAmount > 0) parts.push('planned');
    if (efTopUpAmount > 0) parts.push('EF top-up');
    return {
      value: formatCurrency(recommendedRetained),
      sub: parts.length > 0 ? parts.join(' + ') : 'Buffer + planned',
    };
  }
  if (minBufferAlreadyCovered && emergencyReserveAmount === 0) {
    return { value: 'Already covered', sub: 'Min buffer met from existing EF' };
  }
  return { value: '$0', sub: 'No allocation needed' };
}

function formatDeployableStat(deployable: number): { value: string; sub: string } {
  if (deployable > 0) {
    return { value: formatCurrency(deployable), sub: 'Toward debt' };
  }
  return { value: '$0', sub: 'No allocation needed' };
}

function formatInterestStat(amount: number): { value: string; sub: string } {
  return {
    value: amount > 0 ? `~${formatCurrency(amount)}` : '$0',
    sub: amount > 0 ? 'Est. savings' : 'No debt allocation',
  };
}

function formatCashflowStat(amount: number): { value: string; sub: string } {
  return {
    value: `${formatCurrency(amount)}/mo`,
    sub: amount > 0 ? 'If fully paid off' : 'No full payoffs',
  };
}

function formatRunwayStat(months: number): { value: string; sub: string } {
  return {
    value: `${months.toFixed(1)} mo`,
    sub: 'After this plan',
  };
}

function formatSegmentAmount(seg: CashWaterfallSegment): string {
  if (seg.amountNote) return seg.amountNote;
  return formatCurrency(seg.amount);
}

// ─── Sub-components ───────────────────────────────────────────────────────────

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
      <span className="absolute left-3 text-sm select-none text-muted pointer-events-none">$</span>
      <input
        type="number"
        min={0}
        step={500}
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

function ReserveModeSelector({
  value,
  onChange,
}: {
  value: ReserveMode;
  onChange: (m: ReserveMode) => void;
}) {
  const modes: ReserveMode[] = ['conservative', 'balanced', 'aggressive'];
  return (
    <div>
      <p className="text-xs font-semibold text-secondary mb-2">Reserve strategy</p>
      <div className="flex flex-col sm:flex-row gap-2">
        {modes.map((mode) => {
          const meta = RESERVE_MODE_META[mode];
          const isSelected = value === mode;
          return (
            <button
              key={mode}
              type="button"
              onClick={() => onChange(mode)}
              className={`flex-1 text-left rounded-lg px-3 py-2.5 border transition-colors cursor-pointer ${
                isSelected
                  ? 'border-indigo-500/50 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-300'
                  : 'border-[var(--border-subtle)] bg-[var(--surface-secondary)] text-secondary hover:border-indigo-400/40'
              }`}
            >
              <p className={`text-xs font-semibold ${isSelected ? '' : 'text-primary'}`}>
                {meta.label}
              </p>
              <p className="text-[11px] text-muted mt-0.5 leading-snug">{meta.description}</p>
            </button>
          );
        })}
      </div>
      <p className="mt-2 flex gap-1.5 text-xs text-muted leading-relaxed">
        <AppIcon icon={Info} size="xs" className="shrink-0 mt-0.5 text-muted" />
        <span>{buildReserveModeExplanation(value)}</span>
      </p>
    </div>
  );
}

function AllocationBar({
  segments,
  total,
}: {
  segments: CashWaterfallSegment[];
  total: number;
}) {
  if (total <= 0 || segments.length === 0) return null;
  const barSegs = segments.filter((s) => s.amount > 0);
  const legendSegs = segments.filter((s) => s.amount > 0 || s.amountNote);
  return (
    <div>
      {barSegs.length > 0 ? (
        <div className="flex h-3.5 rounded-full overflow-hidden gap-0.5 bg-[var(--surface-secondary)] ring-1 ring-[var(--border-subtle)]">
          {barSegs.map((seg) => {
            const pct = (seg.amount / total) * 100;
            if (pct < 0.3) return null;
            return (
              <div
                key={seg.id}
                className={`${WATERFALL_COLORS[seg.kind].bar} transition-all duration-500`}
                style={{ width: `${pct}%` }}
                title={`${seg.label}: ${formatCurrency(seg.amount)}`}
              />
            );
          })}
        </div>
      ) : (
        <p className="text-xs text-muted">No cash allocated in this plan — reserves may already be covered.</p>
      )}
      <div className="flex flex-wrap gap-x-4 gap-y-2 mt-3">
        {legendSegs.map((seg) => (
          <div key={seg.id} className="flex items-center gap-1.5 min-w-0">
            <span className={`w-2.5 h-2.5 rounded-sm shrink-0 ${WATERFALL_COLORS[seg.kind].dot}`} />
            <span className="text-xs text-secondary truncate">{seg.label}</span>
            <span
              className={`text-xs font-semibold tabular-nums shrink-0 ${
                seg.amountNote ? 'text-emerald-600 dark:text-emerald-400' : 'text-primary'
              }`}
            >
              {formatSegmentAmount(seg)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function SummaryGrid({ strategy }: { strategy: CashAllocationStrategy }) {
  const reserved = formatReservedStat(strategy);
  const deployable = formatDeployableStat(strategy.deployableCash);
  const interest = formatInterestStat(strategy.totalInterestAvoided);
  const cashflow = formatCashflowStat(strategy.totalCashflowFreed);
  const runway = formatRunwayStat(strategy.emergencyRunwayMonths);

  const stats = [
    { label: 'Reserved', ...reserved, color: 'text-cyan-600 dark:text-cyan-400' },
    { label: 'Deployable', ...deployable, color: 'text-rose-600 dark:text-rose-400' },
    {
      label: 'Interest avoided',
      ...interest,
      color: strategy.totalInterestAvoided > 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-muted',
    },
    {
      label: 'Payments freed',
      ...cashflow,
      color: strategy.totalCashflowFreed > 0 ? 'text-indigo-600 dark:text-indigo-400' : 'text-muted',
    },
    { label: 'EF runway', ...runway, color: 'text-primary' },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
      {stats.map((s) => (
        <div key={s.label} className="surface-muted rounded-xl p-3">
          <p className="text-[11px] text-muted leading-tight mb-1">{s.label}</p>
          <p className={`text-sm font-bold tabular-nums leading-tight ${s.color}`}>{s.value}</p>
          <p className="text-[10px] text-muted mt-1 leading-snug">{s.sub}</p>
        </div>
      ))}
    </div>
  );
}

function DebtPayoffRow({
  rec,
  onNavigate,
}: {
  rec: DebtPayoffRecommendation;
  onNavigate?: (page: Page) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const badge = PRIORITY_BADGES[rec.priority];
  const isZero = rec.suggestedPayoff === 0;

  return (
    <div
      className={`rounded-xl border overflow-hidden transition-colors ${
        isZero
          ? 'border-[var(--border-subtle)] bg-[var(--surface-secondary)] opacity-70'
          : 'border-[var(--border-subtle)] bg-[var(--surface-secondary)]'
      }`}
    >
      <div className="px-3.5 py-3 sm:px-4">
        <div className="flex items-start gap-3">
          <div
            className={`shrink-0 w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold ${
              isZero
                ? 'bg-zinc-100 text-zinc-400 dark:bg-zinc-800 dark:text-zinc-500'
                : rec.priority === 'high'
                  ? 'bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300'
                  : rec.priority === 'moderate'
                    ? 'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300'
                    : 'bg-zinc-100 text-zinc-600 dark:bg-zinc-700 dark:text-zinc-400'
            }`}
          >
            {rec.rank}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <span className="text-sm font-semibold text-primary">{rec.name}</span>
              <span
                className={`text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full ${badge.className}`}
              >
                {badge.label}
              </span>
            </div>

            <dl className="grid grid-cols-2 sm:grid-cols-4 gap-x-3 gap-y-1.5 text-xs">
              <div>
                <dt className="text-muted">APR</dt>
                <dd className="font-semibold text-primary tabular-nums mt-0.5">{rec.apr.toFixed(1)}%</dd>
              </div>
              <div>
                <dt className="text-muted">Balance</dt>
                <dd className="font-semibold text-primary tabular-nums mt-0.5">{formatCurrency(rec.balance)}</dd>
              </div>
              <div>
                <dt className="text-muted">Payment</dt>
                <dd className="font-semibold text-primary tabular-nums mt-0.5">
                  {formatCurrency(rec.monthlyPayment)}/mo
                </dd>
              </div>
              <div>
                <dt className="text-muted">Timeline</dt>
                <dd className="font-semibold text-primary tabular-nums mt-0.5">
                  {formatTimelineMonths(rec.remainingMonths)}
                </dd>
              </div>
            </dl>
          </div>

          <div className="shrink-0 text-right">
            <p className="text-[10px] uppercase tracking-wide text-muted font-semibold">Suggested</p>
            {isZero ? (
              <>
                <p className="text-sm font-bold tabular-nums mt-0.5 text-muted">$0</p>
                <p className="text-[10px] text-muted mt-0.5">No allocation</p>
              </>
            ) : (
              <>
                <p className="text-base font-bold tabular-nums mt-0.5 text-primary">
                  {formatCurrency(rec.suggestedPayoff)}
                </p>
                {rec.remainingAfterPayoff > 0 ? (
                  <p className="text-[10px] text-muted tabular-nums">{formatCurrency(rec.remainingAfterPayoff)} left</p>
                ) : (
                  <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">Paid off</p>
                )}
              </>
            )}
          </div>
        </div>

        {!isZero && (rec.interestSaved > 0 || rec.monthlyCashflowFreed > 0) && (
          <div className="flex flex-wrap gap-3 mt-2.5 pt-2.5 border-t border-[var(--border-subtle)] text-xs">
            {rec.interestSaved > 0 && (
              <span className="text-emerald-700 dark:text-emerald-400 font-medium tabular-nums">
                ~{formatCurrency(rec.interestSaved)} interest avoided
              </span>
            )}
            {rec.monthlyCashflowFreed > 0 && (
              <span className="text-indigo-700 dark:text-indigo-300 font-medium tabular-nums">
                +{formatCurrency(rec.monthlyCashflowFreed)}/mo freed
              </span>
            )}
            {onNavigate && (
              <button
                type="button"
                onClick={() => onNavigate('debt')}
                className="ml-auto inline-flex items-center gap-0.5 text-xs font-semibold text-indigo-600 dark:text-indigo-300 cursor-pointer accent-ring rounded"
              >
                Debt planner <AppIcon icon={ChevronDown} size="xs" className="rotate-[-90deg]" />
              </button>
            )}
          </div>
        )}
      </div>

      <div className="border-t border-[var(--border-subtle)]">
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="w-full flex items-center justify-between px-3.5 sm:px-4 py-2 text-xs text-muted hover:text-secondary transition-colors cursor-pointer"
        >
          <span className="inline-flex items-center gap-1.5 font-medium">
            <AppIcon icon={Info} size="xs" className="opacity-70" />
            Why this recommendation?
          </span>
          <AppIcon icon={expanded ? ChevronUp : ChevronDown} size="xs" />
        </button>
        {expanded && (
          <ul className="px-3.5 sm:px-4 pb-3 space-y-2 text-xs text-secondary leading-relaxed">
            {rec.whyReasons.map((r) => (
              <li key={r} className="flex gap-2">
                <span className="text-muted shrink-0 select-none">•</span>
                <span>{r}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
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
  const [reserveMode, setReserveMode] = useState<ReserveMode>('balanced');

  const strategy = useMemo(
    () => optimizeCash(data, availableCash, reserveMode),
    [data, availableCash, reserveMode],
  );

  const hasCash = availableCash > 0;
  const hasActiveDebt = data.debts.some((d) => d.balance > 0);
  const totalDebtAllocated = strategy.debtRecommendations.reduce((s, r) => s + r.suggestedPayoff, 0);
  const hasDebtAllocation = totalDebtAllocated > 0;

  const bufferNote = strategy.minBufferAlreadyCovered
    ? `Minimum buffer (${formatCurrency(strategy.emergencyFloorTarget)}) already covered by your emergency fund.`
    : `Minimum buffer target: ${formatCurrency(strategy.emergencyFloorTarget)} (${RESERVE_MODE_META[strategy.reserveMode].label.toLowerCase()} mode).`;

  return (
    <Card>
      <CardHeader
        title="Cash Allocation Strategy"
        subtitle="Planning estimate only — not financial advice."
      />

      <div className="space-y-4 pb-4 border-b border-[var(--border-subtle)]">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <div className="flex items-center gap-2 shrink-0">
            <AppIcon icon={Banknote} size="sm" className="text-muted" />
            <span className="text-sm font-medium text-secondary whitespace-nowrap">Available cash</span>
          </div>
          <div className="flex-1 min-w-0 sm:max-w-[220px]">
            <CashInput value={availableCash} onChange={onCashChange} />
          </div>
        </div>
        {hasCash && <ReserveModeSelector value={reserveMode} onChange={setReserveMode} />}
      </div>

      {!hasCash && (
        <div className="flex flex-col items-center gap-3 py-8 text-center">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center">
            <AppIcon icon={DollarSign} size="md" className="text-indigo-500 dark:text-indigo-400" />
          </div>
          <div>
            <p className="text-sm font-medium text-primary">Enter cash you could deploy today</p>
            <p className="text-xs text-muted mt-1 max-w-xs">
              Reserve essentials first, then deploy the rest toward the highest-cost debt.
            </p>
          </div>
        </div>
      )}

      {hasCash && (
        <div className="pt-4 space-y-4">
          <SummaryGrid strategy={strategy} />

          {strategy.waterfall.length > 0 && (
            <AllocationBar segments={strategy.waterfall} total={strategy.availableCash} />
          )}

          <p className="flex gap-2 text-xs text-secondary leading-relaxed">
            <AppIcon icon={Info} size="sm" className="text-muted shrink-0 mt-0.5" />
            <span>
              Core obligations ({formatCurrency(strategy.coreMonthlyObligations)}/mo) = recurring expenses
              + minimum debt payments. {bufferNote} Planned expenses are reserved separately.
            </span>
          </p>

          {strategy.strategyExplanations.length > 0 && (
            <CollapsibleSection
              title="Why this strategy?"
              defaultExpanded={false}
              bordered
              className="!mt-0"
            >
              <ul className="space-y-2 text-xs text-secondary leading-relaxed">
                {strategy.strategyExplanations.map((line) => (
                  <li key={line} className="flex gap-2">
                    <span className="text-muted shrink-0 select-none">•</span>
                    <span>{line}</span>
                  </li>
                ))}
              </ul>
            </CollapsibleSection>
          )}

          {!hasActiveDebt && strategy.deployableCash > 0 && (
            <p className="text-sm text-muted text-center py-2">
              No active debt — deployable cash ({formatCurrency(strategy.deployableCash)}) can stay liquid or
              go to savings goals.
            </p>
          )}

          {hasActiveDebt && strategy.debtRecommendations.length > 0 && (
            <CollapsibleSection
              key={`payoff-${hasDebtAllocation}-${strategy.debtRecommendations.length}`}
              title="Suggested payoff order"
              summary={`${strategy.debtRecommendations.length} debt${strategy.debtRecommendations.length !== 1 ? 's' : ''} ranked · ${hasDebtAllocation ? formatCurrency(totalDebtAllocated) + ' toward debt' : 'No debt allocation in this plan'}`}
              defaultExpanded={hasDebtAllocation}
              bordered
            >
              <div className="space-y-2">
                {strategy.debtRecommendations.map((rec) => (
                  <DebtPayoffRow key={rec.debtId} rec={rec} onNavigate={onNavigate} />
                ))}
              </div>
            </CollapsibleSection>
          )}

          {hasActiveDebt && strategy.debtRecommendations.length === 0 && (
            <p className="text-sm text-muted text-center py-2">
              Reserves use all available cash — no amount remains for debt payoff. Try Aggressive mode or
              increase available cash.
            </p>
          )}
        </div>
      )}
    </Card>
  );
}
