import React from 'react';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
  padding?: 'default' | 'none';
}

export function Card({
  children,
  className = '',
  padding = 'default',
  ...rest
}: CardProps) {
  return (
    <div
      className={`surface-card ${padding === 'default' ? 'p-6 sm:p-7' : ''} ${className}`}
      {...rest}
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
    <div className="flex items-start justify-between gap-3 mb-4 sm:mb-5">
      <div>
        <h2 className="text-base font-semibold text-primary tracking-tight">{title}</h2>
        {subtitle && (
          <p className="text-sm text-secondary mt-1.5 leading-relaxed max-w-prose">{subtitle}</p>
        )}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}
