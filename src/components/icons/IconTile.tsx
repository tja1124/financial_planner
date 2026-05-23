import type { LucideIcon } from 'lucide-react';
import { AppIcon, type IconSize } from './AppIcon';

const variantStyles = {
  muted: 'bg-[var(--surface-secondary)] text-muted border-[var(--border-subtle)]',
  indigo: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/15',
  emerald: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/15',
  amber: 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/15',
  rose: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/15',
  cyan: 'bg-teal-500/10 text-teal-700 dark:text-teal-400 border-teal-500/15',
} as const;

const sizeStyles: Record<IconSize, string> = {
  xs: 'w-7 h-7 rounded-md',
  sm: 'w-9 h-9 rounded-lg',
  md: 'w-11 h-11 rounded-xl',
  lg: 'w-14 h-14 rounded-xl',
  xl: 'w-16 h-16 rounded-2xl',
};

type Variant = keyof typeof variantStyles;

interface Props {
  icon: LucideIcon;
  variant?: Variant;
  size?: IconSize;
  className?: string;
}

export function IconTile({ icon, variant = 'muted', size = 'lg', className = '' }: Props) {
  const iconSize: IconSize = size === 'xl' ? 'lg' : size === 'lg' ? 'md' : 'sm';
  return (
    <span
      className={`inline-flex items-center justify-center shrink-0 border ${sizeStyles[size]} ${variantStyles[variant]} ${className}`}
    >
      <AppIcon icon={icon} size={iconSize} />
    </span>
  );
}
