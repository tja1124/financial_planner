import type { LucideIcon } from 'lucide-react';
import type { ExpenseCategory } from '../../types';
import type { Page } from '../../types';
import type { InsightPriority } from '../../types';
import {
  AlertCircle,
  AlertTriangle,
  Banknote,
  BarChart3,
  Car,
  CheckCircle2,
  Clapperboard,
  FileEdit,
  FlaskConical,
  HeartPulse,
  Home,
  Landmark,
  LayoutDashboard,
  Lightbulb,
  Lock,
  Package,
  PiggyBank,
  Receipt,
  Rocket,
  Shirt,
  Smartphone,
  Sparkles,
  Sprout,
  Target,
  TrendingUp,
  Utensils,
  Wallet,
} from 'lucide-react';

export const NAV_ICONS: Record<Page, LucideIcon> = {
  dashboard: LayoutDashboard,
  scenarios: FlaskConical,
  income: Wallet,
  expenses: Receipt,
  debt: Landmark,
  savings: Target,
};

export const EMPTY_STATE_ICONS = {
  dashboard: BarChart3,
  income: Banknote,
  expenses: Receipt,
  debt: Landmark,
  savings: Target,
  scenarios: FlaskConical,
} as const;

export const EXPENSE_CATEGORY_ICONS: Record<ExpenseCategory, LucideIcon> = {
  Housing: Home,
  Transportation: Car,
  Food: Utensils,
  Healthcare: HeartPulse,
  Utilities: Lightbulb,
  Subscriptions: Smartphone,
  Entertainment: Clapperboard,
  Clothing: Shirt,
  Personal: Sparkles,
  Other: Package,
};

export const PRIORITY_ICONS: Record<InsightPriority, LucideIcon> = {
  critical: AlertCircle,
  warning: AlertTriangle,
  healthy: CheckCircle2,
  opportunity: TrendingUp,
};

export const ONBOARDING_STEP_ICONS = [Sprout, Lock, Sparkles, Rocket] as const;
export const ONBOARDING_CHOICE_ICONS = {
  blank: FileEdit,
  demo: BarChart3,
} as const;

export const BRAND_ICON = PiggyBank;
