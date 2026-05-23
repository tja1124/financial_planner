import { useCallback, useEffect, useRef } from 'react';
import { driver } from 'driver.js';
import 'driver.js/dist/driver.css';
import type { Page } from '../types';
import { completeTutorial } from '../utils/storage';

const TOUR_STEPS: { page: Page; element: string; title: string; description: string }[] = [
  {
    page: 'dashboard',
    element: '[data-tour="dashboard-hero"]',
    title: 'Your financial dashboard',
    description:
      'See your monthly cashflow, savings progress, debt timeline, and emergency runway — updated automatically as you add data.',
  },
  {
    page: 'income',
    element: '[data-tour="income-form"]',
    title: 'Add your income sources',
    description:
      'Enter your salary, freelance, or any other income after taxes. Projections across all pages update immediately.',
  },
  {
    page: 'expenses',
    element: '[data-tour="expense-mode-toggle"]',
    title: 'Track recurring and planned expenses',
    description:
      'Log fixed and variable bills under Recurring. Use Planned for one-time costs like a trip or wedding — the app calculates monthly savings required.',
  },
  {
    page: 'debt',
    element: '[data-tour="debt-strategy"]',
    title: 'Debt payoff strategies',
    description:
      'Add loans and credit cards to compare snowball, avalanche, and custom payoff strategies — and see exactly when you become debt-free.',
  },
  {
    page: 'savings',
    element: '[data-tour="emergency-fund-card"]',
    title: 'Emergency fund and savings goals',
    description:
      'Your emergency reserve is tracked separately from optional goals so runway calculations stay accurate. Add a monthly contribution plan to both.',
  },
  {
    page: 'scenarios',
    element: '[data-tour="scenarios-presets"]',
    title: 'Test financial decisions safely',
    description:
      'Scenarios let you model what happens if you reduce spending, accelerate debt payoff, or increase savings — before committing to any change.',
  },
];

interface Options {
  navigate: (page: Page) => void;
  prefersReducedMotion: boolean;
  onFinished?: () => void;
}

export function useAppTour({ navigate, prefersReducedMotion, onFinished }: Options) {
  const navigateRef = useRef(navigate);
  navigateRef.current = navigate;
  const onFinishedRef = useRef(onFinished);
  onFinishedRef.current = onFinished;

  const driverRef = useRef<ReturnType<typeof driver> | null>(null);

  useEffect(() => {
    return () => {
      driverRef.current?.destroy();
    };
  }, []);

  const startTour = useCallback(() => {
    driverRef.current?.destroy();

    // Ensure we start on dashboard
    navigateRef.current('dashboard');

    const driverObj = driver({
      showProgress: true,
      animate: !prefersReducedMotion,
      overlayOpacity: 0.55,
      allowClose: true,
      popoverClass: 'fp-tour-popover',
      progressText: '{{current}} of {{total}}',
      nextBtnText: 'Next',
      prevBtnText: 'Back',
      doneBtnText: 'Finish',
      onPopoverRender: (popover) => {
        // Remove default close button's default icon (replaced via CSS)
        popover.closeButton.setAttribute('aria-label', 'Close tour');
      },
      onNextClick: () => {
        const currentIdx = driverObj.getActiveIndex() ?? 0;
        const nextIdx = currentIdx + 1;

        if (nextIdx < TOUR_STEPS.length) {
          const nextStep = TOUR_STEPS[nextIdx];
          const currentStep = TOUR_STEPS[currentIdx];

          if (nextStep.page !== currentStep.page) {
            navigateRef.current(nextStep.page);
            // Wait one animation frame tick for React to commit the new page
            requestAnimationFrame(() => {
              requestAnimationFrame(() => {
                driverObj.moveNext();
              });
            });
          } else {
            driverObj.moveNext();
          }
        } else {
          driverObj.moveNext();
        }
      },
      onPrevClick: () => {
        const currentIdx = driverObj.getActiveIndex() ?? 0;
        const prevIdx = currentIdx - 1;

        if (prevIdx >= 0) {
          const prevStep = TOUR_STEPS[prevIdx];
          const currentStep = TOUR_STEPS[currentIdx];

          if (prevStep.page !== currentStep.page) {
            navigateRef.current(prevStep.page);
            requestAnimationFrame(() => {
              requestAnimationFrame(() => {
                driverObj.movePrevious();
              });
            });
          } else {
            driverObj.movePrevious();
          }
        } else {
          driverObj.movePrevious();
        }
      },
      onDestroyStarted: () => {
        completeTutorial();
        onFinishedRef.current?.();
        driverObj.destroy();
      },
      steps: TOUR_STEPS.map((step) => ({
        element: step.element,
        popover: {
          title: step.title,
          description: step.description,
          side: 'bottom' as const,
          align: 'start' as const,
        },
      })),
    });

    driverRef.current = driverObj;
    driverObj.drive();
  }, [prefersReducedMotion]);

  return { startTour };
}
