import type { LucideIcon } from 'lucide-react';
import { IconTile } from './icons/IconTile';

interface EmptyStateProps {
  icon: LucideIcon;
  iconVariant?: 'muted' | 'indigo' | 'emerald' | 'amber';
  title: string;
  description: string;
  action?: React.ReactNode;
}

export function EmptyState({
  icon,
  iconVariant = 'muted',
  title,
  description,
  action,
}: EmptyStateProps) {
  return (
    <div className="text-center py-16 sm:py-20 px-4">
      <div className="mb-5 flex justify-center">
        <IconTile icon={icon} variant={iconVariant} size="xl" />
      </div>
      <p className="font-semibold text-lg text-primary">{title}</p>
      <p className="text-sm text-secondary mt-2 max-w-sm mx-auto leading-relaxed">{description}</p>
      {action && <div className="mt-7">{action}</div>}
    </div>
  );
}
