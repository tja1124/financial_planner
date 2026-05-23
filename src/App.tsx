import { useState, useEffect, useCallback } from 'react';
import { Layout } from './components/Layout';
import type { Page } from './components/Layout';
import { DashboardPage } from './pages/DashboardPage';
import { IncomePage } from './pages/IncomePage';
import { ExpensesPage } from './pages/ExpensesPage';
import { DebtPlannerPage } from './pages/DebtPlannerPage';
import { SavingsGoalsPage } from './pages/SavingsGoalsPage';
import { loadData, saveData } from './utils/storage';
import { computeSummary } from './utils/calculations';
import type { AppData } from './types';

export default function App() {
  const [page, setPage] = useState<Page>('dashboard');
  const [data, setData] = useState<AppData>(() => loadData());

  useEffect(() => {
    saveData(data);
  }, [data]);

  const summary = computeSummary(data.income, data.expenses, data.debts, data.savingsGoals);

  const setDataField = useCallback(
    <K extends keyof AppData>(key: K) =>
      (value: AppData[K]) =>
        setData((prev) => ({ ...prev, [key]: value })),
    []
  );

  return (
    <Layout currentPage={page} onNavigate={setPage}>
      {page === 'dashboard' && <DashboardPage data={data} summary={summary} />}
      {page === 'income' && (
        <IncomePage income={data.income} onChange={setDataField('income')} />
      )}
      {page === 'expenses' && (
        <ExpensesPage expenses={data.expenses} onChange={setDataField('expenses')} />
      )}
      {page === 'debt' && (
        <DebtPlannerPage debts={data.debts} onChange={setDataField('debts')} />
      )}
      {page === 'savings' && (
        <SavingsGoalsPage savingsGoals={data.savingsGoals} onChange={setDataField('savingsGoals')} />
      )}
    </Layout>
  );
}
