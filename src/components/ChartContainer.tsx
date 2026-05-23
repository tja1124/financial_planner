import type { ReactNode } from 'react';

interface ChartContainerProps {
  children: ReactNode;
  height?: number;
  className?: string;
  inset?: boolean;
}

export function ChartContainer({
  children,
  height = 280,
  className = '',
  inset = true,
}: ChartContainerProps) {
  return (
    <div className={`chart-scroll -mx-1 px-1 sm:mx-0 sm:px-0 ${className}`}>
      <div
        className={`min-w-[280px] w-full ${inset ? 'chart-well' : ''}`}
        style={{ height: inset ? height + 24 : height }}
      >
        <div className="w-full" style={{ height }}>
          {children}
        </div>
      </div>
    </div>
  );
}
