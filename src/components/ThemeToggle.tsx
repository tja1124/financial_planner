import { useState } from 'react';
import { useTheme } from '../context/ThemeContext';
import type { ThemePreference } from '../utils/theme';

const OPTIONS: { value: ThemePreference; label: string; icon: string }[] = [
  { value: 'light', label: 'Light', icon: '☀️' },
  { value: 'dark', label: 'Dark', icon: '🌙' },
  { value: 'system', label: 'System', icon: '💻' },
];

export function ThemeToggle() {
  const { preference, setPreference, resolvedTheme } = useTheme();
  const [open, setOpen] = useState(false);

  const current = OPTIONS.find((o) => o.value === preference) ?? OPTIONS[2];

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex items-center justify-center w-9 h-9 rounded-lg border border-slate-200/80 dark:border-white/[0.08] bg-white dark:bg-[var(--surface-secondary)] text-secondary hover:text-primary hover:border-slate-300 dark:hover:border-white/[0.12] transition-all cursor-pointer accent-ring"
        aria-label={`Theme: ${current.label}. Currently ${resolvedTheme} mode.`}
        aria-expanded={open}
        aria-haspopup="listbox"
      >
        <span className="text-base leading-none">{current.icon}</span>
      </button>

      {open && (
        <>
          <button
            type="button"
            className="fixed inset-0 z-40 cursor-default"
            aria-label="Close theme menu"
            onClick={() => setOpen(false)}
          />
          <ul
            role="listbox"
            className="absolute right-0 top-full mt-2 w-36 surface-overlay rounded-xl py-1 z-50"
          >
            {OPTIONS.map((opt) => (
              <li key={opt.value} role="option" aria-selected={preference === opt.value}>
                <button
                  type="button"
                  onClick={() => {
                    setPreference(opt.value);
                    setOpen(false);
                  }}
                  className={`w-full flex items-center gap-2 px-3 py-2.5 text-sm font-medium cursor-pointer transition-colors ${
                    preference === opt.value
                      ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-500/15 dark:text-indigo-300'
                      : 'text-secondary hover:bg-slate-50 dark:hover:bg-white/[0.04]'
                  }`}
                >
                  <span>{opt.icon}</span>
                  {opt.label}
                </button>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
