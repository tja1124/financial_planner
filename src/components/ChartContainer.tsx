import type { ReactNode } from 'react';

interface ChartContainerProps {
  children: ReactNode;
  height?: number;
  className?: string;
}

export function ChartContainer({
  children,
  height = 280,
  className = '',
}: ChartContainerProps) {
  return (
    <div className={`chart-scroll -mx-2 px-2 sm:mx-0 sm:px-0 ${className}`}>
      <div className="min-w-[280px] w-full" style={{ height }}>
        {children}
      </div>
    </div>
  );
}
