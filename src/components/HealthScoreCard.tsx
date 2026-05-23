import { memo } from 'react';
import type { HealthScoreResult } from '../types';
import { GRADE_COLORS } from '../utils/healthScore';
import { FadeIn } from './motion/FadeIn';
import { CollapsibleSection } from './CollapsibleSection';

const GRADE_LABELS: Record<HealthScoreResult['grade'], string> = {
  excellent: 'Excellent',
  good: 'Good',
  fair: 'Fair',
  warning: 'Needs attention',
  critical: 'Critical',
};

interface Props {
  health: HealthScoreResult;
}

export const HealthScoreCard = memo(function HealthScoreCard({ health }: Props) {
  const colors = GRADE_COLORS[health.grade];
  const circumference = 2 * Math.PI * 52;
  const offset = circumference - (health.overall / 100) * circumference;

  return (
    <FadeIn className="surface-card p-5 sm:p-6">
      <div className="flex flex-col sm:flex-row gap-6 sm:items-center">
        <div className="flex items-center gap-5 shrink-0">
          <div className="relative w-[120px] h-[120px]">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120" aria-hidden>
              <circle
                cx="60"
                cy="60"
                r="52"
                fill="none"
                className="stroke-zinc-200 dark:stroke-zinc-800"
                strokeWidth="10"
              />
              <circle
                cx="60"
                cy="60"
                r="52"
                fill="none"
                className={`${colors.ring} transition-all duration-700`}
                strokeWidth="10"
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={offset}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className={`text-3xl font-bold tabular-nums ${colors.text}`}>
                {health.overall}
              </span>
              <span className="text-[10px] font-semibold uppercase tracking-wide text-muted">
                / 100
              </span>
            </div>
          </div>
          <div className="sm:hidden">
            <p className="text-sm font-semibold text-primary">Cashflow health</p>
            <p className={`text-xs font-medium mt-0.5 ${colors.text}`}>
              {GRADE_LABELS[health.grade]}
            </p>
          </div>
        </div>

        <div className="flex-1 min-w-0">
          <div className="hidden sm:block mb-2">
            <p className="text-base font-semibold text-primary">Cashflow health score</p>
            <p className={`text-sm font-medium mt-0.5 ${colors.text}`}>
              {GRADE_LABELS[health.grade]} · composite of savings, debt, and buffer
            </p>
          </div>
          <p className="text-sm text-secondary leading-relaxed">
            Based on savings rate, emergency runway, debt-to-income, leftover cashflow, debt load,
            and spending stability. For planning only — not financial advice.
          </p>
        </div>
      </div>

      <CollapsibleSection
        title="Score breakdown"
        summary={`${health.factors.length} factors · tap to expand`}
        defaultExpanded={false}
        collapseOnMobile
      >
        <div className="grid gap-3 sm:grid-cols-2">
          {health.factors.map((f) => (
            <div key={f.id} className="surface-muted p-3.5" title={f.description}>
              <div className="flex justify-between items-center gap-2 mb-2">
                <span className="text-xs font-semibold text-primary">{f.label}</span>
                <span className="text-xs font-bold tabular-nums text-secondary">{f.score}</span>
              </div>
              <div className="h-1.5 rounded-full bg-zinc-200 dark:bg-zinc-800 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    f.score >= 70
                      ? 'bg-emerald-500'
                      : f.score >= 45
                        ? 'bg-amber-500'
                        : 'bg-red-500'
                  }`}
                  style={{ width: `${f.score}%` }}
                />
              </div>
              <p className="text-[11px] text-muted mt-2 leading-snug">{f.description}</p>
            </div>
          ))}
        </div>
      </CollapsibleSection>
    </FadeIn>
  );
});
