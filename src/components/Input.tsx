import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  prefix?: string;
  suffix?: string;
}

export function Input({ label, error, prefix, suffix, className = '', id, ...props }: InputProps) {
  const inputId = id || label.toLowerCase().replace(/\s+/g, '-');
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={inputId} className="text-sm font-medium text-secondary">
        {label}
      </label>
      <div className="relative flex items-center">
        {prefix && (
          <span className="absolute left-3 text-caption text-sm select-none">{prefix}</span>
        )}
        <input
          id={inputId}
          {...props}
          className={`w-full rounded-lg border bg-white dark:bg-[var(--surface-secondary)] text-sm text-primary placeholder:text-caption focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500/50 dark:focus:ring-indigo-400/30 transition py-2.5 border-slate-200 dark:border-white/[0.08] ${prefix ? 'pl-7' : 'pl-3'} ${suffix ? 'pr-10' : 'pr-3'} ${error ? 'border-red-400 dark:border-red-500/50' : ''} ${className}`}
        />
        {suffix && (
          <span className="absolute right-3 text-caption text-sm select-none">{suffix}</span>
        )}
      </div>
      {error && <p className="text-xs text-red-500 dark:text-red-400">{error}</p>}
    </div>
  );
}

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
  options: { value: string; label: string }[];
}

export function Select({ label, options, className = '', id, ...props }: SelectProps) {
  const selectId = id || label.toLowerCase().replace(/\s+/g, '-');
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={selectId} className="text-sm font-medium text-secondary">
        {label}
      </label>
      <select
        id={selectId}
        {...props}
        className={`w-full rounded-lg border border-slate-200 dark:border-white/[0.08] bg-white dark:bg-[var(--surface-secondary)] text-sm text-primary focus:outline-none focus:ring-2 focus:ring-indigo-500/40 dark:focus:ring-indigo-400/30 transition py-2.5 px-3 ${className}`}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
}
