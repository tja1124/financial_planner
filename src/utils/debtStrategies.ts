import type { Debt, DebtStrategy, DebtStrategyResult } from '../types';

interface SimDebt {
  id: string;
  name: string;
  balance: number;
  monthlyRate: number;
  minimumPayment: number;
  customExtra: number;
}

function cloneDebts(debts: Debt[]): SimDebt[] {
  return debts.map((d) => ({
    id: d.id,
    name: d.name,
    balance: d.balance,
    monthlyRate: d.interestRate / 100 / 12,
    minimumPayment: d.minimumPayment,
    customExtra: d.extraPayment,
  }));
}

function pickTarget(
  active: SimDebt[],
  strategy: DebtStrategy,
): SimDebt | null {
  if (active.length === 0) return null;
  if (strategy === 'snowball') {
    return active.reduce((a, b) => (a.balance <= b.balance ? a : b));
  }
  if (strategy === 'avalanche') {
    return active.reduce((a, b) => (a.monthlyRate >= b.monthlyRate ? a : b));
  }
  return null;
}

export function simulateDebtStrategy(
  debts: Debt[],
  strategy: DebtStrategy,
): DebtStrategyResult {
  if (debts.length === 0) {
    return { strategy, payoffMonths: 0, totalInterest: 0, timeline: [] };
  }

  const sim = cloneDebts(debts);
  const totalExtraPool = sim.reduce((s, d) => s + d.customExtra, 0);
  let month = 0;
  let totalInterest = 0;
  const timeline: { month: number; totalBalance: number }[] = [
    { month: 0, totalBalance: Math.round(sim.reduce((s, d) => s + d.balance, 0)) },
  ];

  while (sim.some((d) => d.balance > 0.01) && month < 360) {
    month++;
    let monthInterest = 0;

    for (const d of sim) {
      if (d.balance <= 0) continue;
      const interest = d.balance * d.monthlyRate;
      monthInterest += interest;
      d.balance += interest;
    }
    totalInterest += monthInterest;

    const active = sim.filter((d) => d.balance > 0.01);
    let extraRemaining =
      strategy === 'custom' ? 0 : totalExtraPool;

    for (const d of active) {
      const pay = Math.min(d.minimumPayment, d.balance);
      d.balance -= pay;
    }

    if (strategy === 'custom') {
      for (const d of active) {
        if (d.balance <= 0 || d.customExtra <= 0) continue;
        const pay = Math.min(d.customExtra, d.balance);
        d.balance -= pay;
      }
    } else {
      let target = pickTarget(sim.filter((d) => d.balance > 0.01), strategy);
      while (extraRemaining > 0 && target) {
        const pay = Math.min(extraRemaining, target.balance);
        target.balance -= pay;
        extraRemaining -= pay;
        if (target.balance <= 0.01) {
          target = pickTarget(
            sim.filter((d) => d.balance > 0.01),
            strategy,
          );
        } else {
          break;
        }
      }
    }

    timeline.push({
      month,
      totalBalance: Math.round(sim.reduce((s, d) => s + Math.max(0, d.balance), 0)),
    });
  }

  return {
    strategy,
    payoffMonths: month,
    totalInterest: Math.round(totalInterest),
    timeline: timeline.filter(
      (_, i) =>
        i === 0 ||
        i === timeline.length - 1 ||
        i % Math.max(1, Math.floor(timeline.length / 24)) === 0,
    ),
  };
}

export function formatPayoffDuration(months: number): string {
  if (months <= 0) return '—';
  const years = Math.floor(months / 12);
  const rem = months % 12;
  if (years > 0) return `${years}y ${rem}mo`;
  return `${months}mo`;
}

export const STRATEGY_LABELS: Record<DebtStrategy, string> = {
  snowball: 'Debt Snowball',
  avalanche: 'Debt Avalanche',
  custom: 'Custom Allocation',
};

export const STRATEGY_DESCRIPTIONS: Record<DebtStrategy, string> = {
  snowball: 'Pay minimums on all debts, then put extra toward the smallest balance first.',
  avalanche: 'Pay minimums on all debts, then put extra toward the highest interest rate first.',
  custom: 'Uses the extra payment you set on each debt individually.',
};
