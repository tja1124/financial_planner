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
          className="flex gap-2 text-sm text-red-700 bg-red-50 border border-red-100 rounded-lg px-3 py-2"
        >
          <span className="shrink-0" aria-hidden>✕</span>
          <span>{msg}</span>
        </div>
      ))}
      {validation.warnings.map((msg) => (
        <div
          key={msg}
          role="status"
          className="flex gap-2 text-sm text-amber-800 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2"
        >
          <span className="shrink-0" aria-hidden>⚠</span>
          <span>{msg}</span>
        </div>
      ))}
    </div>
  );
}
