import React from 'react';
import type { Page } from '../types';
import { DataControls } from './DataControls';

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
  onLoadDemo: () => void;
  onReset: () => void;
  children: React.ReactNode;
}

export function Layout({ currentPage, onNavigate, onLoadDemo, onReset, children }: Props) {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <header className="bg-white/90 backdrop-blur-md border-b border-slate-200/80 sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between gap-4">
          <button
            type="button"
            onClick={() => onNavigate('dashboard')}
            className="flex items-center gap-2 shrink-0 cursor-pointer"
          >
            <span className="text-xl">🌱</span>
            <span className="font-bold text-slate-900 text-base tracking-tight hidden xs:inline">
              FinancePlanner
            </span>
          </button>

          <nav className="hidden lg:flex items-center gap-0.5 flex-1 justify-center">
            {NAV_ITEMS.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => onNavigate(item.id)}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
                  currentPage === item.id
                    ? 'bg-indigo-50 text-indigo-700'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <span className="mr-1">{item.icon}</span>
                {item.label}
              </button>
            ))}
          </nav>

          <div className="shrink-0">
            <DataControls onLoadDemo={onLoadDemo} onReset={onReset} />
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-6xl mx-auto w-full px-4 py-6 sm:py-8 pb-20 lg:pb-8">
        {children}
      </main>

      <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur border-t border-slate-200 z-30 safe-area-pb">
        <div className="flex max-w-lg mx-auto">
          {NAV_ITEMS.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => onNavigate(item.id)}
              className={`flex-1 flex flex-col items-center py-2.5 gap-0.5 min-w-0 cursor-pointer ${
                currentPage === item.id ? 'text-indigo-600' : 'text-slate-500'
              }`}
            >
              <span className="text-lg leading-none">{item.icon}</span>
              <span className="text-[10px] font-medium truncate w-full text-center px-0.5">
                {item.shortLabel ?? item.label.split(' ')[0]}
              </span>
            </button>
          ))}
        </div>
      </nav>
    </div>
  );
}
