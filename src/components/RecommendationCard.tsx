import type { Recommendation, Page } from '../types';

interface Props {
  recommendations: Recommendation[];
  onNavigate?: (page: Page) => void;
}

const priorityStyles = {
  high: 'border-l-red-500 bg-red-50/50',
  medium: 'border-l-amber-500 bg-amber-50/50',
  low: 'border-l-indigo-500 bg-indigo-50/50',
};

export function RecommendationCard({ recommendations, onNavigate }: Props) {
  if (recommendations.length === 0) return null;

  return (
    <div className="space-y-2">
      {recommendations.map((rec) => (
        <div
          key={rec.id}
          className={`border-l-4 rounded-r-xl px-4 py-3 ${priorityStyles[rec.priority]}`}
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="font-semibold text-sm text-slate-800">{rec.title}</p>
              <p className="text-sm text-slate-600 mt-0.5">{rec.description}</p>
            </div>
            {rec.actionPage && onNavigate && (
              <button
                type="button"
                onClick={() => onNavigate(rec.actionPage!)}
                className="shrink-0 text-xs font-semibold text-indigo-600 hover:text-indigo-800 cursor-pointer whitespace-nowrap"
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
