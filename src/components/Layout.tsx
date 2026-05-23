import React from 'react';

type Page = 'dashboard' | 'income' | 'expenses' | 'debt' | 'savings';

interface NavItem {
  id: Page;
  label: string;
  icon: string;
}

const NAV_ITEMS: NavItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: '📊' },
  { id: 'income', label: 'Income', icon: '💰' },
  { id: 'expenses', label: 'Expenses', icon: '💸' },
  { id: 'debt', label: 'Debt Planner', icon: '🏦' },
  { id: 'savings', label: 'Savings Goals', icon: '🎯' },
];

interface Props {
  currentPage: Page;
  onNavigate: (page: Page) => void;
  children: React.ReactNode;
}

export function Layout({ currentPage, onNavigate, children }: Props) {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Top header */}
      <header className="bg-white border-b border-slate-100 sticky top-0 z-30">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xl">🌱</span>
            <span className="font-bold text-slate-800 text-base tracking-tight">FinancePlanner</span>
          </div>
          {/* Desktop nav */}
          <nav className="hidden sm:flex items-center gap-1">
            {NAV_ITEMS.map((item) => (
              <button
                key={item.id}
                onClick={() => onNavigate(item.id)}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
                  currentPage === item.id
                    ? 'bg-indigo-50 text-indigo-700'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-800'
                }`}
              >
                <span className="mr-1.5">{item.icon}</span>
                {item.label}
              </button>
            ))}
          </nav>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 max-w-5xl mx-auto w-full px-4 py-8">
        {children}
      </main>

      {/* Mobile bottom nav */}
      <nav className="sm:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-100 z-30">
        <div className="flex">
          {NAV_ITEMS.map((item) => (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`flex-1 flex flex-col items-center py-3 gap-0.5 text-xs font-medium transition-colors cursor-pointer ${
                currentPage === item.id ? 'text-indigo-600' : 'text-slate-500'
              }`}
            >
              <span className="text-base">{item.icon}</span>
              <span className="truncate w-full text-center leading-none">
                {item.label.split(' ')[0]}
              </span>
            </button>
          ))}
        </div>
      </nav>
      {/* Bottom spacer on mobile */}
      <div className="h-16 sm:hidden" />
    </div>
  );
}

export type { Page };
