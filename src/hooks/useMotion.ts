import { useSettings } from '../context/SettingsContext';

const ease = [0.25, 0.1, 0.25, 1] as const;

export function useMotion() {
  const { prefersReducedMotion } = useSettings();

  const instant = prefersReducedMotion;

  return {
    instant,
    fadeIn: instant
      ? { initial: false, animate: { opacity: 1 }, transition: { duration: 0 } }
      : {
          initial: { opacity: 0, y: 6 },
          animate: { opacity: 1, y: 0 },
          transition: { duration: 0.22, ease },
        },
    fadeInSlow: instant
      ? { initial: false, animate: { opacity: 1 }, transition: { duration: 0 } }
      : {
          initial: { opacity: 0, y: 10 },
          animate: { opacity: 1, y: 0 },
          transition: { duration: 0.32, ease },
        },
    stagger: instant ? 0 : 0.05,
    page: instant
      ? { initial: false, animate: { opacity: 1 }, exit: { opacity: 1 } }
      : {
          initial: { opacity: 0, y: 8 },
          animate: { opacity: 1, y: 0 },
          exit: { opacity: 0, y: -4 },
          transition: { duration: 0.2, ease },
        },
    modalBackdrop: instant
      ? { initial: { opacity: 1 }, animate: { opacity: 1 }, exit: { opacity: 1 } }
      : {
          initial: { opacity: 0 },
          animate: { opacity: 1 },
          exit: { opacity: 0 },
          transition: { duration: 0.18 },
        },
    modalPanel: instant
      ? { initial: false, animate: { opacity: 1, scale: 1, y: 0 } }
      : {
          initial: { opacity: 0, scale: 0.97, y: 12 },
          animate: { opacity: 1, scale: 1, y: 0 },
          exit: { opacity: 0, scale: 0.98, y: 8 },
          transition: { duration: 0.24, ease },
        },
    lift: instant
      ? {}
      : {
          whileHover: { y: -2, transition: { duration: 0.15 } },
          whileTap: { scale: 0.99 },
        },
  };
}
