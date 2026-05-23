import { ChevronRight } from 'lucide-react';
import type { Recommendation, Page } from '../types';
import { AppIcon, PRIORITY_ICONS } from './icons';

interface Props {
  recommendations: Recommendation[];
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

export function RecommendationCard({ recommendations, onNavigate }: Props) {
  if (recommendations.length === 0) return null;

  return (
    <div className="space-y-2">
      {recommendations.map((rec) => {
        const style = priorityStyles[rec.priority];
        const PriorityIcon = PRIORITY_ICONS[rec.priority];
        return (
          <div
            key={rec.id}
            className={`border-l-[3px] rounded-r-xl px-4 py-3 ${style.border} ${style.bg} transition-colors hover:bg-opacity-80`}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
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
              {rec.actionPage && onNavigate && (
                <button
                  type="button"
                  onClick={() => onNavigate(rec.actionPage!)}
                  className="shrink-0 min-h-[44px] px-3 flex items-center gap-0.5 text-xs font-semibold text-indigo-600 dark:text-indigo-300 hover:text-indigo-800 cursor-pointer accent-ring rounded-lg"
                >
                  Go
                  <AppIcon icon={ChevronRight} size="xs" />
                </button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
