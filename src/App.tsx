import { useState, useEffect, useCallback, useMemo, lazy, Suspense } from 'react';
import { Layout } from './components/Layout';
import { Onboarding } from './components/Onboarding';
import { Toast } from './components/Toast';
import { DashboardPage } from './pages/DashboardPage';
import { IncomePage } from './pages/IncomePage';
import { ExpensesPage } from './pages/ExpensesPage';
import { SavingsGoalsPage } from './pages/SavingsGoalsPage';
import { AppActionsProvider, useAppActions } from './context/AppActionsContext';
import { useSettings } from './context/SettingsContext';
import {
  loadData,
  saveData,
  defaultData,
  hasCompletedOnboarding,
  completeOnboarding,
  resetOnboarding,
  clearAllStorage,
  downloadJsonExport,
  parseImportFile,
  formatLastSaved,
  getLastSaved,
} from './utils/storage';
import { computeSummary } from './utils/calculations';
import { demoData } from './data/demoData';
import type { AppData, Page } from './types';

const ScenariosPage = lazy(() =>
  import('./pages/ScenariosPage').then((m) => ({ default: m.ScenariosPage })),
);
const DebtPlannerPage = lazy(() =>
  import('./pages/DebtPlannerPage').then((m) => ({ default: m.DebtPlannerPage })),
);

function PageFallback() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="h-8 w-48 bg-zinc-200 dark:bg-zinc-800 rounded" />
      <div className="surface-card h-40" />
    </div>
  );
}

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

  const handleResetOnboarding = useCallback(() => {
    resetOnboarding();
    setShowOnboarding(true);
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
        onResetOnboarding={handleResetOnboarding}
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
  onResetOnboarding,
}: {
  page: Page;
  setPage: (p: Page) => void;
  data: AppData;
  setData: React.Dispatch<React.SetStateAction<AppData>>;
  lastSaved: string | null;
  setLastSaved: (v: string | null) => void;
  onResetOnboarding: () => void;
}) {
  const { settings } = useSettings();
  const { notifyUndo, showToast, toast, dismissToast } = useAppActions();

  const summary = useMemo(
    () => computeSummary(data.income, data.expenses, data.debts, data.savingsGoals),
    [data.income, data.expenses, data.debts, data.savingsGoals],
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
        'Load demo data? This replaces your current income, expenses, debts, emergency fund, and savings goals.',
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
    downloadJsonExport(data, {
      includeTimestamp: settings.exportIncludeTimestamp,
    });
    showToast('Backup downloaded.');
  }, [data, settings.exportIncludeTimestamp, showToast]);

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
        onResetOnboarding={onResetOnboarding}
      >
        {page === 'dashboard' && (
          <DashboardPage data={data} summary={summary} onNavigate={navigate} />
        )}
        {page === 'scenarios' && (
          <Suspense fallback={<PageFallback />}>
            <ScenariosPage data={data} />
          </Suspense>
        )}
        {page === 'income' && (
          <IncomePage income={data.income} onChange={setDataField('income')} />
        )}
        {page === 'expenses' && (
          <ExpensesPage expenses={data.expenses} onChange={setDataField('expenses')} />
        )}
        {page === 'debt' && (
          <Suspense fallback={<PageFallback />}>
            <DebtPlannerPage debts={data.debts} onChange={setDataField('debts')} />
          </Suspense>
        )}
        {page === 'savings' && (
          <SavingsGoalsPage
            emergencyFund={data.emergencyFund}
            expenses={data.expenses}
            savingsGoals={data.savingsGoals}
            onEmergencyFundChange={setDataField('emergencyFund')}
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
