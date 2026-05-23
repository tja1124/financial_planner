import { useMemo } from 'react';
import { useTheme } from '../context/ThemeContext';

export function useChartTheme() {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';

  return useMemo(
    () => ({
      isDark,
      grid: isDark ? '#334155' : '#f1f5f9',
      tick: isDark ? '#94a3b8' : '#64748b',
      tooltip: {
        contentStyle: {
          backgroundColor: isDark ? '#1e293b' : '#ffffff',
          border: `1px solid ${isDark ? '#475569' : '#e2e8f0'}`,
          borderRadius: '8px',
          fontSize: '12px',
          color: isDark ? '#f1f5f9' : '#1e293b',
        },
      },
      legendStyle: { color: isDark ? '#cbd5e1' : '#475569', fontSize: 12 },
    }),
    [isDark],
  );
}
