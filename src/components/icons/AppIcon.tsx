import type { LucideIcon, LucideProps } from 'lucide-react';

export const ICON_STROKE = 1.75;

export const ICON_SIZE = {
  xs: 14,
  sm: 16,
  md: 20,
  lg: 24,
  xl: 32,
} as const;

export type IconSize = keyof typeof ICON_SIZE;

type Props = LucideProps & {
  icon: LucideIcon;
  size?: IconSize;
};

export function AppIcon({ icon: Icon, size = 'md', className = '', ...props }: Props) {
  const px = ICON_SIZE[size];
  return (
    <Icon
      size={px}
      strokeWidth={ICON_STROKE}
      className={className}
      aria-hidden={props['aria-hidden'] ?? true}
      {...props}
    />
  );
}
