import { AlertCircle, AlertTriangle, CheckCircle2, Info } from 'lucide-react';
import { AppIcon } from './AppIcon';

export type StatusTone = 'healthy' | 'warning' | 'critical' | 'neutral' | 'info';

const config: Record<
  StatusTone,
  { icon: typeof CheckCircle2; labelClass: string; containerClass: string }
> = {
  healthy: {
    icon: CheckCircle2,
    labelClass: 'text-emerald-700 dark:text-emerald-300',
    containerClass:
      'bg-emerald-500/[0.08] border-emerald-500/20 text-emerald-700 dark:text-emerald-300',
  },
  warning: {
    icon: AlertTriangle,
    labelClass: 'text-amber-800 dark:text-amber-300',
    containerClass: 'bg-amber-500/[0.08] border-amber-500/20 text-amber-800 dark:text-amber-300',
  },
  critical: {
    icon: AlertCircle,
    labelClass: 'text-rose-700 dark:text-rose-300',
    containerClass: 'bg-rose-500/[0.08] border-rose-500/20 text-rose-700 dark:text-rose-300',
  },
  neutral: {
    icon: Info,
    labelClass: 'text-secondary',
    containerClass: 'bg-[var(--surface-secondary)] border-[var(--border-subtle)] text-secondary',
  },
  info: {
    icon: Info,
    labelClass: 'text-indigo-700 dark:text-indigo-300',
    containerClass: 'bg-indigo-500/[0.08] border-indigo-500/20 text-indigo-700 dark:text-indigo-300',
  },
};

interface Props {
  tone: StatusTone;
  children: React.ReactNode;
  className?: string;
}

export function StatusIndicator({ tone, children, className = '' }: Props) {
  const { icon: Icon, containerClass } = config[tone];
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium tracking-wide border ${containerClass} ${className}`}
    >
      <AppIcon icon={Icon} size="xs" className="shrink-0" />
      <span>{children}</span>
    </span>
  );
}
