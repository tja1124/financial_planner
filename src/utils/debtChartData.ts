import type { Debt } from '../types';
import { projectDebtPayoff } from './calculations';

export interface DebtTimelineSeries {
  debtId: string;
  debtName: string;
  payoffMonth: number;
  points: { month: number; balance: number }[];
}

export function debtChartKey(debtId: string): string {
  return `d_${debtId}`;
}

export function getDebtTimelineSeries(debt: Debt): DebtTimelineSeries {
  const payoff = projectDebtPayoff(debt);
  return {
    debtId: debt.id,
    debtName: debt.name,
    payoffMonth: payoff.length,
    points: payoff.map((p) => ({ month: p.month, balance: Math.round(p.balance) })),
  };
}

/** Chart rows with null after each debt's payoff month so lines end cleanly */
export function buildMultiDebtChartRows(
  series: DebtTimelineSeries[],
  maxSamples = 40,
): Record<string, number | string | null>[] {
  if (series.length === 0) return [];

  const keyed = series.map((s) => ({
    key: debtChartKey(s.debtId),
    payoff: s.payoffMonth,
    points: s.points,
  }));

  const maxMonth = Math.max(...keyed.map((k) => k.payoff), 1);
  const step = Math.max(1, Math.ceil(maxMonth / maxSamples));

  const months = new Set<number>([0]);
  for (let m = 0; m <= maxMonth; m += step) months.add(m);
  for (const k of keyed) months.add(k.payoff);

  const sortedMonths = Array.from(months).sort((a, b) => a - b);
  return sortedMonths.map((month) => {
    const row: Record<string, number | string | null> = { month };
    for (const k of keyed) {
      if (month > k.payoff) {
        row[k.key] = null;
      } else {
        let balance = k.points[0]?.balance ?? 0;
        for (const p of k.points) {
          if (p.month <= month) balance = p.balance;
        }
        row[k.key] = balance;
      }
    }
    return row;
  });
}

/** Strategy aggregate timeline — null after strategy completes */
export function balanceAtMonth(
  timeline: { month: number; totalBalance: number }[],
  payoffMonths: number,
  month: number,
): number | null {
  if (month > payoffMonths) return null;
  let balance = timeline[0]?.totalBalance ?? 0;
  for (const t of timeline) {
    if (t.month <= month) balance = t.totalBalance;
  }
  return balance;
}

export function buildStrategyComparisonRows(
  timelines: { strategy: string; payoffMonths: number; timeline: { month: number; totalBalance: number }[] }[],
  maxSamples = 40,
): Record<string, number | string | null>[] {
  if (timelines.length === 0) return [];

  const maxMonth = Math.max(...timelines.map((t) => t.payoffMonths), 1);
  const step = Math.max(1, Math.ceil(maxMonth / maxSamples));

  const months = new Set<number>([0]);
  for (let m = 0; m <= maxMonth; m += step) months.add(m);
  for (const t of timelines) months.add(t.payoffMonths);

  return Array.from(months)
    .sort((a, b) => a - b)
    .map((month) => {
      const row: Record<string, number | string | null> = { month };
      for (const t of timelines) {
        row[t.strategy] = balanceAtMonth(t.timeline, t.payoffMonths, month);
      }
      return row;
    });
}
