import { useState, useEffect, useCallback } from 'react';
import { Layout } from './components/Layout';
import { DashboardPage } from './pages/DashboardPage';
import { ScenariosPage } from './pages/ScenariosPage';
import { IncomePage } from './pages/IncomePage';
import { ExpensesPage } from './pages/ExpensesPage';
import { DebtPlannerPage } from './pages/DebtPlannerPage';
import { SavingsGoalsPage } from './pages/SavingsGoalsPage';
import { loadData, saveData, defaultData } from './utils/storage';
import { computeSummary } from './utils/calculations';
import { demoData } from './data/demoData';
import type { AppData, Page } from './types';

export default function App() {
  const [page, setPage] = useState<Page>('dashboard');
  const [data, setData] = useState<AppData>(() => loadData());

  useEffect(() => {
    saveData(data);
  }, [data]);

  const summary = computeSummary(
    data.income,
    data.expenses,
    data.debts,
    data.savingsGoals,
  );

  const setDataField = useCallback(
    <K extends keyof AppData>(key: K) =>
      (value: AppData[K]) =>
        setData((prev) => ({ ...prev, [key]: value })),
    [],
  );

  const handleLoadDemo = useCallback(() => {
    const hasData =
      data.income.length > 0 ||
      data.expenses.length > 0 ||
      data.debts.length > 0 ||
      data.savingsGoals.length > 0;
    if (
      hasData &&
      !window.confirm(
        'Load demo data? This will replace your current income, expenses, debts, and savings goals.',
      )
    ) {
      return;
    }
    setData(demoData);
    setPage('dashboard');
  }, [data]);

  const handleReset = useCallback(() => {
    setData(defaultData);
    setPage('dashboard');
  }, []);

  const navigate = useCallback((p: Page) => setPage(p), []);

  return (
    <Layout
      currentPage={page}
      onNavigate={navigate}
      onLoadDemo={handleLoadDemo}
      onReset={handleReset}
    >
      {page === 'dashboard' && (
        <DashboardPage data={data} summary={summary} onNavigate={navigate} />
      )}
      {page === 'scenarios' && <ScenariosPage data={data} />}
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
        <SavingsGoalsPage
          savingsGoals={data.savingsGoals}
          onChange={setDataField('savingsGoals')}
        />
      )}
    </Layout>
  );
}
