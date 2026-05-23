import type { ValidationResult } from '../utils/validation';

interface Props {
  validation: ValidationResult;
}

export function FormAlerts({ validation }: Props) {
  if (validation.errors.length === 0 && validation.warnings.length === 0) {
    return null;
  }

  return (
    <div className="space-y-2 mb-4">
      {validation.errors.map((msg) => (
        <div
          key={msg}
          role="alert"
          className="flex gap-2 text-sm text-red-700 dark:text-red-200 bg-red-50 dark:bg-red-500/10 border border-red-200/80 dark:border-red-500/20 rounded-lg px-3 py-2.5"
        >
          <span className="shrink-0" aria-hidden>✕</span>
          <span>{msg}</span>
        </div>
      ))}
      {validation.warnings.map((msg) => (
        <div
          key={msg}
          role="status"
          className="flex gap-2 text-sm text-amber-800 dark:text-amber-200 bg-amber-50 dark:bg-amber-500/10 border border-amber-200/80 dark:border-amber-500/20 rounded-lg px-3 py-2.5"
        >
          <span className="shrink-0" aria-hidden>⚠</span>
          <span>{msg}</span>
        </div>
      ))}
    </div>
  );
}
