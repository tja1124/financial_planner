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
  side: Side;
  align: Align;
  popoverOffset?: number;
}[] = [
  {
    page: 'dashboard',
    element: '[data-tour="dashboard-hero"]',
    title: 'Your monthly picture',
    description:
      'Track your monthly net position and weekly flex after obligations.',
    side: 'bottom',
    align: 'center',
    popoverOffset: 16,
  },
  {
    page: 'dashboard',
    element: '[data-tour="insights-section"]',
    title: 'Smart insights',
    description:
      'Review prioritized recommendations and acknowledge items once handled.',
    side: 'bottom',
    align: 'start',
    popoverOffset: 14,
  },
  {
    page: 'income',
    element: '[data-tour="income-form"]',
    title: 'Add your income',
    description:
      'Add recurring income. The app converts each source to a monthly total.',
    side: 'left',
    align: 'start',
    popoverOffset: 16,
  },
  {
    page: 'expenses',
    element: '[data-tour="expense-mode-toggle"]',
    title: 'Track expenses',
    description:
      'Choose recurring bills or planned expenses with a target date.',
    side: 'top',
    align: 'center',
    popoverOffset: 12,
  },
  {
    page: 'debt',
    element: '[data-tour="debt-strategy-card"]',
    title: 'Plan debt payoff',
    description:
      'Compare payoff strategies and see how extra payments change your timeline.',
    side: 'top',
    align: 'end',
    popoverOffset: 16,
  },
  {
    page: 'savings',
    element: '[data-tour="emergency-fund-card"]',
    title: 'Emergency fund',
    description:
      'Manage your emergency fund separately from optional goals.',
    side: 'top',
    align: 'start',
    popoverOffset: 14,
  },
  {
    page: 'scenarios',
    element: '[data-tour="scenarios-presets"]',
    title: 'Test scenarios',
    description:
      'Preview how changes affect cashflow, savings, and debt payoff.',
    side: 'bottom',
    align: 'center',
    popoverOffset: 14,
  },
];

function afterPageRender(callback: () => void) {
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      window.setTimeout(callback, 60);
    });
  });
}

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
  const reducedMotionRef = useRef(prefersReducedMotion);
  reducedMotionRef.current = prefersReducedMotion;

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
      smoothScroll: true,
      overlayOpacity: 0.38,
      stagePadding: 10,
      stageRadius: 14,
      popoverOffset: 14,
      allowClose: true,
      popoverClass: 'fp-tour-popover',
      progressText: '{{current}} of {{total}}',
      nextBtnText: 'Next',
      prevBtnText: 'Back',
      doneBtnText: 'Finish tour',
      onPopoverRender: (popover) => {
        popover.closeButton.setAttribute('aria-label', 'Close tour');
      },
      onHighlighted: (element) => {
        element?.scrollIntoView({
          behavior: reducedMotionRef.current ? 'auto' : 'smooth',
          block: 'center',
          inline: 'nearest',
        });
      },
      onNextClick: () => {
        const currentIdx = driverObj.getActiveIndex() ?? 0;
        const nextIdx = currentIdx + 1;

        if (nextIdx < TOUR_STEPS.length) {
          const nextStep = TOUR_STEPS[nextIdx];
          const currentStep = TOUR_STEPS[currentIdx];

          if (nextStep.page !== currentStep.page) {
            navigateRef.current(nextStep.page);
            afterPageRender(() => {
              driverObj.refresh();
              driverObj.moveNext();
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
            afterPageRender(() => {
              driverObj.refresh();
              driverObj.movePrevious();
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
          side: step.side,
          align: step.align,
          popoverOffset: step.popoverOffset,
        },
      })),
    });

    driverRef.current = driverObj;

    afterPageRender(() => {
      driverObj.drive();
    });
  }, [prefersReducedMotion]);

  return { startTour };
}
