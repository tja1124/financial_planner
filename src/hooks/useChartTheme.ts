import { useMemo } from 'react';
import { useTheme } from '../context/ThemeContext';

const CHART_SERIES_LIGHT = {
  income: '#10b981',
  expenses: '#ef4444',
  debt: '#f59e0b',
  savings: '#6366f1',
  leftover: '#3b82f6',
  cumulative: '#2563eb',
  lines: ['#6366f1', '#10b981', '#f59e0b'] as const,
  pie: ['#4f46e5', '#059669', '#dc2626', '#0284c7', '#d97706', '#7c3aed', '#db2777', '#0d9488', '#ea580c'],
  debtLines: ['#4f46e5', '#059669', '#dc2626', '#0284c7', '#d97706', '#7c3aed', '#db2777', '#0d9488'],
};

const CHART_SERIES_DARK = {
  income: '#4ade80',
  expenses: '#fb7185',
  debt: '#fbbf24',
  savings: '#a78bfa',
  leftover: '#60a5fa',
  cumulative: '#93c5fd',
  lines: ['#a5b4fc', '#4ade80', '#fbbf24'] as const,
  pie: ['#818cf8', '#4ade80', '#fb7185', '#38bdf8', '#fbbf24', '#c084fc', '#f472b6', '#2dd4bf', '#fb923c'],
  debtLines: ['#818cf8', '#4ade80', '#fb7185', '#38bdf8', '#fbbf24', '#c084fc', '#f472b6', '#2dd4bf'],
};

export function useChartTheme() {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';
  const series = isDark ? CHART_SERIES_DARK : CHART_SERIES_LIGHT;

  return useMemo(
    () => ({
      isDark,
      series,
      grid: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(15, 23, 42, 0.06)',
      tick: isDark ? '#a1a1aa' : '#64748b',
      axis: isDark ? '#71717a' : '#94a3b8',
      tooltip: {
        contentStyle: {
          backgroundColor: isDark ? '#1c1c22' : '#ffffff',
          border: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(15,23,42,0.1)'}`,
          borderRadius: '10px',
          fontSize: '12px',
          fontWeight: 500,
          color: isDark ? '#fafafa' : '#0f172a',
          boxShadow: isDark
            ? '0 8px 32px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.05)'
            : '0 4px 16px rgba(15,23,42,0.08)',
          padding: '10px 12px',
        },
        labelStyle: {
          color: isDark ? '#a1a1aa' : '#64748b',
          fontWeight: 500,
          marginBottom: 4,
        },
        itemStyle: {
          color: isDark ? '#fafafa' : '#0f172a',
        },
      },
      legendStyle: {
        color: isDark ? '#d4d4d8' : '#475569',
        fontSize: 12,
        fontWeight: 500,
      },
      cursor: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(15,23,42,0.04)',
      debtColor: (index: number) => series.debtLines[index % series.debtLines.length],
      pieColor: (index: number) => series.pie[index % series.pie.length],
    }),
    [isDark, series],
  );
}
