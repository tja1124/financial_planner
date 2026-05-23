import { useState, useEffect, useCallback } from 'react';
import { Layout } from './components/Layout';
import { Onboarding } from './components/Onboarding';
import { DashboardPage } from './pages/DashboardPage';
import { ScenariosPage } from './pages/ScenariosPage';
import { IncomePage } from './pages/IncomePage';
import { ExpensesPage } from './pages/ExpensesPage';
import { DebtPlannerPage } from './pages/DebtPlannerPage';
import { SavingsGoalsPage } from './pages/SavingsGoalsPage';
import {
  loadData,
  saveData,
  defaultData,
  hasCompletedOnboarding,
  completeOnboarding,
  clearAllStorage,
  downloadJsonExport,
  parseImportFile,
  formatLastSaved,
  getLastSaved,
} from './utils/storage';
import { computeSummary } from './utils/calculations';
import { demoData } from './data/demoData';
import type { AppData, Page } from './types';

export default function App() {
  const [showOnboarding, setShowOnboarding] = useState(() => !hasCompletedOnboarding());
  const [page, setPage] = useState<Page>('dashboard');
  const [data, setData] = useState<AppData>(() => loadData());
  const [lastSaved, setLastSaved] = useState<string | null>(() =>
    formatLastSaved(getLastSaved()),
  );
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    saveData(data);
    setLastSaved(formatLastSaved(getLastSaved()));
  }, [data]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 4000);
    return () => clearTimeout(t);
  }, [toast]);

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

  const navigate = useCallback((p: Page) => setPage(p), []);

  const handleOnboardingComplete = useCallback((choice: 'blank' | 'demo') => {
    completeOnboarding();
    if (choice === 'demo') {
      setData(demoData);
      setPage('dashboard');
    } else {
      setData(defaultData);
      setPage('income');
    }
    setShowOnboarding(false);
  }, []);

  const handleLoadDemo = useCallback(() => {
    const hasData =
      data.income.length > 0 ||
      data.expenses.length > 0 ||
      data.debts.length > 0 ||
      data.savingsGoals.length > 0;
    if (
      hasData &&
      !window.confirm(
        'Load demo data? This replaces your current income, expenses, debts, and savings goals.',
      )
    ) {
      return;
    }
    setData(demoData);
    setPage('dashboard');
    setToast('Demo data loaded.');
  }, [data]);

  const handleExport = useCallback(() => {
    downloadJsonExport(data);
    setToast('Backup downloaded.');
  }, [data]);

  const handleImport = useCallback(async (file: File) => {
    try {
      const text = await file.text();
      const imported = parseImportFile(text);
      if (!imported) {
        setToast('Invalid backup file. Please use a FinancePlanner JSON export.');
        return;
      }
      if (
        !window.confirm(
          'Import this backup? It will replace your current data in this browser.',
        )
      ) {
        return;
      }
      setData(imported);
      setPage('dashboard');
      setToast('Backup imported successfully.');
    } catch {
      setToast('Could not read the file. Please try again.');
    }
  }, []);

  const handleReset = useCallback(() => {
    clearAllStorage();
    setData(defaultData);
    setPage('dashboard');
    setLastSaved(null);
    setToast('All data has been reset.');
  }, []);

  if (showOnboarding) {
    return <Onboarding onComplete={handleOnboardingComplete} />;
  }

  return (
    <>
      <Layout
        currentPage={page}
        onNavigate={navigate}
        lastSaved={lastSaved}
        onLoadDemo={handleLoadDemo}
        onExport={handleExport}
        onImport={handleImport}
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

      {toast && (
        <div
          role="status"
          className="fixed bottom-20 lg:bottom-6 left-1/2 -translate-x-1/2 z-50 bg-slate-900 text-white text-sm font-medium px-4 py-2.5 rounded-full shadow-lg max-w-[90vw] text-center"
        >
          {toast}
        </div>
      )}
    </>
  );
}
