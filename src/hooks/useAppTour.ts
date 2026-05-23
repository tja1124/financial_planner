import { useCallback, useEffect, useRef } from 'react';
import { driver } from 'driver.js';
import 'driver.js/dist/driver.css';
import type { Page } from '../types';
import { completeTutorial } from '../utils/storage';

type Side = 'top' | 'bottom' | 'left' | 'right';
type Align = 'start' | 'center' | 'end';

const TOUR_STEPS: {
  page: Page;
  element: string;
  title: string;
  description: string;
  side?: Side;
  align?: Align;
}[] = [
  {
    page: 'dashboard',
    element: '[data-tour="dashboard-hero"]',
    title: 'Start with your monthly picture',
    description:
      'See your net monthly cashflow, weekly flex, savings rate, debt timeline, and emergency runway at a glance.',
    side: 'bottom',
    align: 'start',
  },
  {
    page: 'dashboard',
    element: '[data-tour="insights-section"]',
    title: 'Review smart insights',
    description:
      'The app flags the highest-priority actions and lets you acknowledge items once handled.',
    side: 'top',
    align: 'start',
  },
  {
    page: 'income',
    element: '[data-tour="income-form"]',
    title: 'Add your income',
    description:
      'Enter recurring income so the app can calculate monthly cashflow and available flexibility.',
    side: 'bottom',
    align: 'start',
  },
  {
    page: 'expenses',
    element: '[data-tour="expense-mode-toggle"]',
    title: 'Track bills and planned costs',
    description:
      'Add recurring expenses or planned expenses with a deadline, like a wedding or large purchase.',
    side: 'bottom',
    align: 'start',
  },
  {
    page: 'debt',
    element: '[data-tour="debt-strategy-card"]',
    title: 'Plan your debt payoff',
    description:
      'Compare payoff strategies and see how extra payments affect your timeline.',
    side: 'bottom',
    align: 'start',
  },
  {
    page: 'savings',
    element: '[data-tour="emergency-fund-card"]',
    title: 'Build your emergency fund',
    description:
      'Your emergency fund powers runway calculations, while other goals track optional savings.',
    side: 'bottom',
    align: 'start',
  },
  {
    page: 'scenarios',
    element: '[data-tour="scenarios-presets"]',
    title: 'Test financial scenarios',
    description:
      'Preview how changes to income, expenses, savings, or debt affect your plan.',
    side: 'bottom',
    align: 'start',
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
      doneBtnText: 'Finish tour',
      onPopoverRender: (popover) => {
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
          side: step.side ?? ('bottom' as Side),
          align: step.align ?? ('start' as Align),
        },
      })),
    });

    driverRef.current = driverObj;
    driverObj.drive();
  }, [prefersReducedMotion]);

  return { startTour };
}
