import type { Recommendation, Page } from '../types';

interface Props {
  recommendations: Recommendation[];
  onNavigate?: (page: Page) => void;
}

const priorityStyles = {
  high: 'border-l-red-500/80 bg-red-50/80 dark:bg-red-500/[0.07] dark:border-l-red-400/80',
  medium:
    'border-l-amber-500/80 bg-amber-50/80 dark:bg-amber-500/[0.07] dark:border-l-amber-400/80',
  low: 'border-l-indigo-500/80 bg-indigo-50/50 dark:bg-indigo-500/[0.07] dark:border-l-indigo-400/80',
};

export function RecommendationCard({ recommendations, onNavigate }: Props) {
  if (recommendations.length === 0) return null;

  return (
    <div className="space-y-2.5">
      {recommendations.map((rec) => (
        <div
          key={rec.id}
          className={`border-l-[3px] rounded-r-xl px-4 py-3.5 ${priorityStyles[rec.priority]}`}
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="font-semibold text-sm text-primary">{rec.title}</p>
              <p className="text-sm text-secondary mt-1 leading-relaxed">{rec.description}</p>
            </div>
            {rec.actionPage && onNavigate && (
              <button
                type="button"
                onClick={() => onNavigate(rec.actionPage!)}
                className="shrink-0 text-xs font-semibold text-indigo-600 dark:text-indigo-300 hover:text-indigo-800 dark:hover:text-indigo-200 cursor-pointer whitespace-nowrap accent-ring rounded px-1"
              >
                Go →
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
