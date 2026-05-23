import { ChevronRight, X } from 'lucide-react';
import type { Recommendation, Page } from '../types';
import { AppIcon, PRIORITY_ICONS } from './icons';

interface Props {
  recommendations: Recommendation[];
  acknowledgedIds: string[];
  onAcknowledge: (id: string) => void;
  onRestoreAll: () => void;
  onNavigate?: (page: Page) => void;
}

const priorityStyles: Record<
  Recommendation['priority'],
  { border: string; bg: string; badge: string }
> = {
  critical: {
    border: 'border-l-red-500/90',
    bg: 'bg-red-50/70 dark:bg-red-500/[0.06]',
    badge: 'text-red-700 dark:text-red-300 bg-red-100 dark:bg-red-500/15',
  },
  warning: {
    border: 'border-l-amber-500/90',
    bg: 'bg-amber-50/70 dark:bg-amber-500/[0.06]',
    badge: 'text-amber-800 dark:text-amber-300 bg-amber-100 dark:bg-amber-500/15',
  },
  opportunity: {
    border: 'border-l-indigo-500/90',
    bg: 'bg-indigo-50/50 dark:bg-indigo-500/[0.06]',
    badge: 'text-indigo-700 dark:text-indigo-300 bg-indigo-100 dark:bg-indigo-500/15',
  },
  healthy: {
    border: 'border-l-emerald-500/90',
    bg: 'bg-emerald-50/60 dark:bg-emerald-500/[0.06]',
    badge: 'text-emerald-700 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-500/15',
  },
};

const priorityLabels: Record<Recommendation['priority'], string> = {
  critical: 'Critical',
  warning: 'Warning',
  healthy: 'Healthy',
  opportunity: 'Opportunity',
};

function isSerious(priority: Recommendation['priority']) {
  return priority === 'critical' || priority === 'warning';
}

export function RecommendationCard({
  recommendations,
  acknowledgedIds,
  onAcknowledge,
  onRestoreAll,
  onNavigate,
}: Props) {
  const visible = recommendations.filter((r) => !acknowledgedIds.includes(r.id));
  const hiddenCount = recommendations.filter((r) => acknowledgedIds.includes(r.id)).length;

  if (recommendations.length === 0) return null;

  return (
    <div className="space-y-3">
      {hiddenCount > 0 && (
        <div className="flex items-center justify-between gap-3 px-1">
          <p className="text-xs text-muted">
            {hiddenCount} acknowledged insight{hiddenCount !== 1 ? 's' : ''} hidden
          </p>
          <button
            type="button"
            onClick={onRestoreAll}
            className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer accent-ring rounded shrink-0"
          >
            Restore insights
          </button>
        </div>
      )}

      {visible.length === 0 ? (
        <p className="text-sm text-secondary py-2 px-1">
          All current insights are acknowledged. Restore them above if you want to review again.
        </p>
      ) : (
        <div className="space-y-2">
          {visible.map((rec) => {
            const style = priorityStyles[rec.priority];
            const PriorityIcon = PRIORITY_ICONS[rec.priority];
            const serious = isSerious(rec.priority);

            return (
              <div
                key={rec.id}
                className={`border-l-[3px] rounded-r-xl px-4 py-3 ${style.border} ${style.bg} transition-colors`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 flex-wrap mb-1">
                      <span
                        className={`inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full ${style.badge}`}
                      >
                        <AppIcon icon={PriorityIcon} size="xs" />
                        {priorityLabels[rec.priority]}
                      </span>
                    </div>
                    <p className="font-semibold text-sm text-primary">{rec.title}</p>
                    <p className="text-sm text-secondary mt-1 leading-relaxed">{rec.description}</p>
                  </div>

                  <div className="flex flex-col items-end gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => onAcknowledge(rec.id)}
                      className={`min-h-[32px] px-2.5 flex items-center gap-1 text-xs font-medium rounded-lg cursor-pointer accent-ring transition-colors ${
                        serious
                          ? 'text-secondary hover:text-primary hover:bg-black/[0.04] dark:hover:bg-white/[0.06]'
                          : 'text-muted hover:text-primary hover:bg-black/[0.04] dark:hover:bg-white/[0.06]'
                      }`}
                      aria-label={serious ? `Acknowledge: ${rec.title}` : `Hide: ${rec.title}`}
                    >
                      {serious ? (
                        'Acknowledge'
                      ) : (
                        <AppIcon icon={X} size="sm" />
                      )}
                    </button>
                    {rec.actionPage && onNavigate && (
                      <button
                        type="button"
                        onClick={() => onNavigate(rec.actionPage!)}
                        className="min-h-[32px] px-2.5 flex items-center gap-0.5 text-xs font-semibold text-indigo-600 dark:text-indigo-300 hover:text-indigo-800 cursor-pointer accent-ring rounded-lg"
                      >
                        Go
                        <AppIcon icon={ChevronRight} size="xs" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
