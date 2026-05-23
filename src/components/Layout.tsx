import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Page } from '../types';
import { DataControls } from './DataControls';
import { ThemeToggle } from './ThemeToggle';
import { SettingsModal } from './SettingsModal';
import { useMotion } from '../hooks/useMotion';

interface NavItem {
  id: Page;
  label: string;
  icon: string;
  shortLabel?: string;
}

const NAV_ITEMS: NavItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: '📊', shortLabel: 'Home' },
  { id: 'scenarios', label: 'Scenarios', icon: '🔮', shortLabel: 'Plans' },
  { id: 'income', label: 'Income', icon: '💰' },
  { id: 'expenses', label: 'Expenses', icon: '💸' },
  { id: 'debt', label: 'Debt', icon: '🏦', shortLabel: 'Debt' },
  { id: 'savings', label: 'Savings', icon: '🎯' },
];

interface Props {
  currentPage: Page;
  onNavigate: (page: Page) => void;
  lastSaved: string | null;
  onLoadDemo: () => void;
  onExport: () => void;
  onImport: (file: File) => void;
  onReset: () => void;
  onResetOnboarding: () => void;
  children: React.ReactNode;
}

export function Layout({
  currentPage,
  onNavigate,
  lastSaved,
  onLoadDemo,
  onExport,
  onImport,
  onReset,
  onResetOnboarding,
  children,
}: Props) {
  const [settingsOpen, setSettingsOpen] = useState(false);
  const motionProps = useMotion();

  return (
    <div className="min-h-screen flex flex-col">
      <header className="surface-nav border-b sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="h-[3.25rem] sm:h-14 flex items-center justify-between gap-2 sm:gap-3">
            <button
              type="button"
              onClick={() => onNavigate('dashboard')}
              className="flex items-center gap-2.5 shrink-0 cursor-pointer group accent-ring rounded-lg -ml-1 pl-1 min-h-[44px]"
            >
              <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-indigo-600 text-white text-sm font-bold shadow-sm group-hover:bg-indigo-500 dark:shadow-indigo-500/25 transition-colors">
                FP
              </span>
              <span className="font-bold text-primary text-base tracking-tight hidden sm:block">
                FinancePlanner
              </span>
            </button>

            <nav className="hidden xl:flex items-center gap-1 flex-1 justify-center max-w-2xl mx-auto">
              {NAV_ITEMS.map((item) => (
                <NavButton
                  key={item.id}
                  item={item}
                  active={currentPage === item.id}
                  onClick={() => onNavigate(item.id)}
                  showLabel
                />
              ))}
            </nav>

            <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
              <button
                type="button"
                onClick={() => setSettingsOpen(true)}
                className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-lg text-muted hover:text-primary hover:bg-slate-100/80 dark:hover:bg-white/[0.05] transition-colors cursor-pointer accent-ring"
                aria-label="Settings"
              >
                <span className="text-lg" aria-hidden>
                  ⚙
                </span>
              </button>
              <ThemeToggle />
              <DataControls
                lastSaved={lastSaved}
                onLoadDemo={onLoadDemo}
                onExport={onExport}
                onImport={onImport}
                onReset={onReset}
              />
            </div>
          </div>

          <nav className="hidden lg:flex xl:hidden items-center gap-1 pb-2.5 overflow-x-auto scrollbar-none momentum-scroll">
            {NAV_ITEMS.map((item) => (
              <NavButton
                key={item.id}
                item={item}
                active={currentPage === item.id}
                onClick={() => onNavigate(item.id)}
                showLabel
              />
            ))}
          </nav>
        </div>
      </header>

      <main className="flex-1 max-w-6xl mx-auto w-full px-4 sm:px-6 py-6 sm:py-9 pb-[calc(5.5rem+env(safe-area-inset-bottom))] lg:pb-10">
        <AnimatePresence mode="wait">
          <motion.div key={currentPage} {...motionProps.page}>
            {children}
          </motion.div>
        </AnimatePresence>
      </main>

      {lastSaved && (
        <p className="hidden lg:block fixed bottom-3 left-1/2 -translate-x-1/2 text-[10px] text-caption z-10 pointer-events-none">
          Saved locally · {lastSaved}
        </p>
      )}

      <nav
        className="lg:hidden fixed bottom-0 left-0 right-0 z-30 border-t border-[var(--border-default)] bg-[var(--surface-nav)] backdrop-blur-2xl backdrop-saturate-150 safe-area-pb shadow-[0_-4px_24px_rgba(0,0,0,0.06)] dark:shadow-[0_-4px_32px_rgba(0,0,0,0.45)]"
        aria-label="Main navigation"
      >
        <div className="flex max-w-lg mx-auto">
          {NAV_ITEMS.map((item) => (
            <NavButton
              key={item.id}
              item={item}
              active={currentPage === item.id}
              onClick={() => onNavigate(item.id)}
              mobile
            />
          ))}
        </div>
      </nav>

      <SettingsModal
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        onResetOnboarding={onResetOnboarding}
      />
    </div>
  );
}

function NavButton({
  item,
  active,
  onClick,
  showLabel,
  mobile,
}: {
  item: NavItem;
  active: boolean;
  onClick: () => void;
  showLabel?: boolean;
  mobile?: boolean;
}) {
  if (mobile) {
    return (
      <button
        type="button"
        onClick={onClick}
        aria-current={active ? 'page' : undefined}
        className={`flex-1 flex flex-col items-center justify-center min-h-[56px] py-2 gap-0.5 min-w-0 cursor-pointer relative transition-colors touch-manipulation ${
          active ? 'text-indigo-600 dark:text-indigo-300' : 'text-muted'
        }`}
      >
        {active && (
          <span className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-indigo-600 dark:bg-indigo-400 rounded-full" />
        )}
        <span className="text-xl leading-none">{item.icon}</span>
        <span className="text-[10px] font-semibold truncate w-full text-center px-0.5">
          {item.shortLabel ?? item.label.split(' ')[0]}
        </span>
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      aria-current={active ? 'page' : undefined}
      className={`px-3 py-2.5 min-h-[44px] rounded-lg text-sm font-medium transition-all cursor-pointer whitespace-nowrap accent-ring ${
        active
          ? 'nav-active'
          : 'text-secondary hover:text-primary hover:bg-slate-100/80 dark:hover:bg-white/[0.05]'
      }`}
    >
      <span className="mr-1.5" aria-hidden>
        {item.icon}
      </span>
      {showLabel && item.label}
    </button>
  );
}
