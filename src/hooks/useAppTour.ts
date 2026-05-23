import { useCallback, useEffect, useRef } from 'react';
import { driver } from 'driver.js';
import 'driver.js/dist/driver.css';
import type { Page } from '../types';
import { completeTutorial } from '../utils/storage';

type Side = 'top' | 'bottom' | 'left' | 'right';
type Align = 'start' | 'center' | 'end';

const TOUR_STAGE_PADDING = 12;
const TOUR_STAGE_RADIUS = 12;
const TOUR_OVERLAY_OPACITY = 0.4;
const TOUR_POPOVER_OFFSET = 16;

const TOUR_STEPS: {
  page: Page;
  element: string;
  title: string;
  description: string;
  side: Side;
  align: Align;
}[] = [
  {
    page: 'dashboard',
    element: '[data-tour="dashboard-hero"]',
    title: 'Your monthly picture',
    description: 'Track your monthly net position and weekly flex after obligations.',
    side: 'bottom',
    align: 'center',
  },
  {
    page: 'dashboard',
    element: '[data-tour="insights-section"]',
    title: 'Smart insights',
    description: 'Review prioritized recommendations and acknowledge items once handled.',
    side: 'bottom',
    align: 'start',
  },
  {
    page: 'income',
    element: '[data-tour="income-form"]',
    title: 'Add your income',
    description: 'Add recurring income. The app converts each source to a monthly total.',
    side: 'bottom',
    align: 'start',
  },
  {
    page: 'expenses',
    element: '[data-tour="expense-mode-toggle"]',
    title: 'Track expenses',
    description: 'Choose recurring bills or planned expenses with a target date.',
    side: 'bottom',
    align: 'start',
  },
  {
    page: 'debt',
    element: '[data-tour="debt-strategy-card"]',
    title: 'Plan debt payoff',
    description: 'Compare payoff strategies and see how extra payments change your timeline.',
    side: 'bottom',
    align: 'start',
  },
  {
    page: 'savings',
    element: '[data-tour="emergency-fund-card"]',
    title: 'Emergency fund',
    description: 'Manage your emergency fund separately from optional goals.',
    side: 'bottom',
    align: 'start',
  },
  {
    page: 'scenarios',
    element: '[data-tour="scenarios-presets"]',
    title: 'Test scenarios',
    description: 'Preview how changes affect cashflow, savings, and debt payoff.',
    side: 'bottom',
    align: 'start',
  },
];

/**
 * Poll the DOM until `selector` is present or `timeoutMs` elapses.
 * Returns the element or null on timeout.
 */
function waitForElement(selector: string, timeoutMs = 2500): Promise<Element | null> {
  return new Promise((resolve) => {
    const immediate = document.querySelector(selector);
    if (immediate) {
      resolve(immediate);
      return;
    }

    const started = Date.now();
    const id = window.setInterval(() => {
      const el = document.querySelector(selector);
      if (el) {
        window.clearInterval(id);
        resolve(el);
      } else if (Date.now() - started >= timeoutMs) {
        window.clearInterval(id);
        if (import.meta.env.DEV) {
          console.warn(`[Tour] element not found after ${timeoutMs}ms: ${selector}`);
        }
        resolve(null);
      }
    }, 50);
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

  const driverRef = useRef<ReturnType<typeof driver> | null>(null);
  /** Tracks the step index that is currently displayed / being navigated to. */
  const currentStepRef = useRef(0);
  /** Prevents two concurrent goToStep calls from racing. */
  const navigatingRef = useRef(false);

  useEffect(() => {
    return () => {
      driverRef.current?.destroy();
    };
  }, []);

  const startTour = useCallback(() => {
    driverRef.current?.destroy();
    currentStepRef.current = 0;
    navigatingRef.current = false;

    const driverObj = driver({
      showProgress: true,
      animate: !prefersReducedMotion,
      smoothScroll: false, // we handle scrolling ourselves before driving
      overlayOpacity: TOUR_OVERLAY_OPACITY,
      stagePadding: TOUR_STAGE_PADDING,
      stageRadius: TOUR_STAGE_RADIUS,
      popoverOffset: TOUR_POPOVER_OFFSET,
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
        const nextIdx = currentStepRef.current + 1;
        if (nextIdx >= TOUR_STEPS.length) {
          // Last step — destroy triggers completeTutorial via onDestroyStarted
          driverObj.destroy();
          return;
        }
        void goToStep(nextIdx);
      },
      onPrevClick: () => {
        const prevIdx = currentStepRef.current - 1;
        if (prevIdx < 0) return;
        void goToStep(prevIdx);
      },
      onDestroyStarted: () => {
        // Called both on ESC / click-outside and on programmatic destroy
        completeTutorial();
        onFinishedRef.current?.();
        // driver.js completes the destroy after this callback returns
      },
      steps: TOUR_STEPS.map((step) => ({
        element: step.element,
        popover: {
          title: step.title,
          description: step.description,
          side: step.side,
          align: step.align,
        },
      })),
    });

    /**
     * Navigate to the step's page, wait for the target element to appear in
     * the DOM, then tell driver.js to highlight that exact step.
     * A guard prevents concurrent calls from racing each other.
     */
    async function goToStep(index: number) {
      if (navigatingRef.current) return;
      navigatingRef.current = true;

      try {
        const step = TOUR_STEPS[index];
        currentStepRef.current = index;

        // Navigate — idempotent if already on this page
        navigateRef.current(step.page);

        // Wait until React has rendered the page and the target is in the DOM
        const el = await waitForElement(step.element);
        if (!el) {
          if (import.meta.env.DEV) {
            console.warn(`[Tour] Skipping step ${index} — element missing: ${step.element}`);
          }
          return;
        }

        // Scroll the target into view before driver positions the popover
        el.scrollIntoView({ behavior: 'instant', block: 'center', inline: 'nearest' });

        // Give the browser one frame to apply the scroll
        await new Promise<void>((r) => requestAnimationFrame(() => r()));

        // Drive to this specific step index (initialises driver on first call)
        driverObj.drive(index);
      } finally {
        navigatingRef.current = false;
      }
    }

    driverRef.current = driverObj;

    // Kick off from step 0
    void goToStep(0);
  }, [prefersReducedMotion]);

  return { startTour };
}
