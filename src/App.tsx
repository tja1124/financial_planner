import { useState, useEffect, useCallback } from 'react';
import { Layout } from './components/Layout';
import { Onboarding } from './components/Onboarding';
import { Toast } from './components/Toast';
import { DashboardPage } from './pages/DashboardPage';
import { ScenariosPage } from './pages/ScenariosPage';
import { IncomePage } from './pages/IncomePage';
import { ExpensesPage } from './pages/ExpensesPage';
import { DebtPlannerPage } from './pages/DebtPlannerPage';
import { SavingsGoalsPage } from './pages/SavingsGoalsPage';
import { AppActionsProvider, useAppActions } from './context/AppActionsContext';
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

  useEffect(() => {
    if (showOnboarding) return;
    saveData(data);
    setLastSaved(formatLastSaved(getLastSaved()));
  }, [data, showOnboarding]);

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

  if (showOnboarding) {
    return <Onboarding onComplete={handleOnboardingComplete} />;
  }

  return (
    <AppActionsProvider data={data} setData={setData}>
      <AppMain
        page={page}
        setPage={setPage}
        data={data}
        setData={setData}
        lastSaved={lastSaved}
        setLastSaved={setLastSaved}
      />
    </AppActionsProvider>
  );
}

function AppMain({
  page,
  setPage,
  data,
  setData,
  lastSaved,
  setLastSaved,
}: {
  page: Page;
  setPage: (p: Page) => void;
  data: AppData;
  setData: React.Dispatch<React.SetStateAction<AppData>>;
  lastSaved: string | null;
  setLastSaved: (v: string | null) => void;
}) {
  const { notifyUndo, showToast, toast, dismissToast } = useAppActions();

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
    [setData],
  );

  const navigate = useCallback((p: Page) => setPage(p), [setPage]);

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
    const snapshot = data;
    setData(demoData);
    navigate('dashboard');
    notifyUndo('Demo data loaded.', snapshot);
  }, [data, setData, navigate, notifyUndo]);

  const handleExport = useCallback(() => {
    downloadJsonExport(data);
    showToast('Backup downloaded.');
  }, [data, showToast]);

  const handleImport = useCallback(
    async (file: File) => {
      try {
        const text = await file.text();
        const imported = parseImportFile(text);
        if (!imported) {
          showToast('Invalid backup file. Please use a FinancePlanner JSON export.');
          return;
        }
        if (
          !window.confirm(
            'Import this backup? It will replace your current data in this browser.',
          )
        ) {
          return;
        }
        const snapshot = data;
        setData(imported);
        navigate('dashboard');
        notifyUndo('Backup imported.', snapshot);
      } catch {
        showToast('Could not read the file. Please try again.');
      }
    },
    [data, setData, navigate, notifyUndo, showToast],
  );

  const handleReset = useCallback(() => {
    const snapshot = data;
    clearAllStorage();
    setData(defaultData);
    navigate('dashboard');
    setLastSaved(null);
    notifyUndo('All data has been reset.', snapshot);
  }, [data, setData, navigate, setLastSaved, notifyUndo]);

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
        <Toast
          message={toast.message}
          onUndo={toast.onUndo}
          onDismiss={dismissToast}
        />
      )}
    </>
  );
}
