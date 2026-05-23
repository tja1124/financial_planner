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
        className="flex items-center justify-center w-9 h-9 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors cursor-pointer"
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
            className="absolute right-0 top-full mt-2 w-36 bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-200 dark:border-slate-600 py-1 z-50"
          >
            {OPTIONS.map((opt) => (
              <li key={opt.value} role="option" aria-selected={preference === opt.value}>
                <button
                  type="button"
                  onClick={() => {
                    setPreference(opt.value);
                    setOpen(false);
                  }}
                  className={`w-full flex items-center gap-2 px-3 py-2 text-sm font-medium cursor-pointer ${
                    preference === opt.value
                      ? 'bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300'
                      : 'text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700'
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
