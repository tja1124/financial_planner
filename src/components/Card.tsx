import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  padding?: 'default' | 'none';
}

export function Card({ children, className = '', padding = 'default' }: CardProps) {
  return (
    <div
      className={`bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-100/80 dark:border-slate-700/80 ${
        padding === 'default' ? 'p-6' : ''
      } ${className}`}
    >
      {children}
    </div>
  );
}

interface CardHeaderProps {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}

export function CardHeader({ title, subtitle, action }: CardHeaderProps) {
  return (
    <div className="flex items-start justify-between gap-4 mb-5">
      <div>
        <h2 className="text-base font-semibold text-slate-900 dark:text-slate-50">{title}</h2>
        {subtitle && (
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">{subtitle}</p>
        )}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}
