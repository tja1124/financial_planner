import { useState } from 'react';
import { Button } from './Button';
import { IconTile } from './icons/IconTile';
import { ONBOARDING_CHOICE_ICONS, ONBOARDING_STEP_ICONS } from './icons/maps';

type OnboardingChoice = 'blank' | 'demo' | null;

interface Props {
  onComplete: (choice: 'blank' | 'demo') => void;
}

export function Onboarding({ onComplete }: Props) {
  const [step, setStep] = useState(0);
  const [choice, setChoice] = useState<OnboardingChoice>(null);

  const steps = [
    {
      title: 'Welcome to FinancePlanner',
      body: 'A private, local-first tool to plan income, expenses, debt payoff, and savings — no bank connections required.',
    },
    {
      title: 'Your data stays on this device',
      body: 'Everything is saved in your browser’s local storage. Nothing is sent to a server. Export a backup anytime from the header menu.',
    },
    {
      title: 'How would you like to start?',
      body: 'Explore with sample numbers, or build your plan from scratch.',
      isChoice: true,
    },
    {
      title: 'You’re all set',
      body:
        choice === 'demo'
          ? 'Demo data is loaded. Review the dashboard, then customize income and expenses to match your life.'
          : 'Start by adding your income sources — your dashboard and forecasts update automatically.',
    },
  ];

  const current = steps[step];
  const StepIcon = ONBOARDING_STEP_ICONS[step];
  const isLast = step === steps.length - 1;
  const isChoiceStep = step === 2;

  function handleNext() {
    if (isChoiceStep && !choice) return;
    if (isLast) {
      onComplete(choice === 'demo' ? 'demo' : 'blank');
      return;
    }
    setStep((s) => s + 1);
  }

  function handleBack() {
    if (step > 0) setStep((s) => s - 1);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 dark:bg-black/75 backdrop-blur-md">
      <div className="surface-overlay rounded-3xl w-full max-w-lg overflow-hidden">
        <div className="h-1 bg-zinc-100 dark:bg-zinc-800/80">
          <div
            className="h-full bg-indigo-500 dark:bg-indigo-400 transition-all duration-300"
            style={{ width: `${((step + 1) / steps.length) * 100}%` }}
          />
        </div>

        <div className="p-8 sm:p-10">
          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              <IconTile icon={StepIcon} variant="indigo" size="xl" />
            </div>
            <h1 className="text-2xl font-bold text-primary tracking-tight">{current.title}</h1>
            <p className="text-secondary mt-3 text-sm sm:text-base leading-relaxed">{current.body}</p>
          </div>

          {isChoiceStep && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-8">
              <button
                type="button"
                onClick={() => setChoice('blank')}
                className={`p-5 rounded-2xl border-2 text-left transition-all cursor-pointer ${
                  choice === 'blank'
                    ? 'border-indigo-500/50 bg-indigo-500/[0.08] ring-1 ring-indigo-500/30'
                    : 'border-[var(--border-subtle)] surface-muted hover:border-indigo-500/20'
                }`}
              >
                <IconTile icon={ONBOARDING_CHOICE_ICONS.blank} variant="muted" size="md" />
                <p className="font-semibold text-primary mt-3">Start blank</p>
                <p className="text-xs text-muted mt-1">Enter your own numbers</p>
              </button>
              <button
                type="button"
                onClick={() => setChoice('demo')}
                className={`p-5 rounded-2xl border-2 text-left transition-all cursor-pointer ${
                  choice === 'demo'
                    ? 'border-indigo-500/50 bg-indigo-500/[0.08] ring-1 ring-indigo-500/30'
                    : 'border-[var(--border-subtle)] surface-muted hover:border-indigo-500/20'
                }`}
              >
                <IconTile icon={ONBOARDING_CHOICE_ICONS.demo} variant="muted" size="md" />
                <p className="font-semibold text-primary mt-3">Load demo data</p>
                <p className="text-xs text-muted mt-1">Explore with sample finances</p>
              </button>
            </div>
          )}

          <div className="flex items-center justify-between gap-3">
            <div className="flex gap-1">
              {steps.map((_, i) => (
                <span
                  key={i}
                  className={`h-1.5 rounded-full transition-all ${
                    i === step ? 'w-6 bg-indigo-500 dark:bg-indigo-400' : 'w-1.5 bg-zinc-200 dark:bg-zinc-700'
                  }`}
                />
              ))}
            </div>
            <div className="flex gap-2">
              {step > 0 && !isLast && (
                <Button variant="ghost" onClick={handleBack}>
                  Back
                </Button>
              )}
              <Button onClick={handleNext} disabled={isChoiceStep && !choice}>
                {isLast ? (choice === 'demo' ? 'View dashboard' : 'Add income') : 'Continue'}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
