import { AnimatePresence, motion } from 'framer-motion';
import { GraduationCap } from 'lucide-react';
import { Button } from './Button';
import { useMotion } from '../hooks/useMotion';

interface Props {
  open: boolean;
  onStart: () => void;
  onSkip: () => void;
}

export function TourWelcomeModal({ open, onStart, onSkip }: Props) {
  const motionProps = useMotion();

  return (
    <AnimatePresence>
      {open && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center p-4 sm:p-6"
          role="dialog"
          aria-modal="true"
          aria-labelledby="tour-welcome-title"
        >
          <motion.div
            className="absolute inset-0 bg-slate-900/50 dark:bg-black/70 backdrop-blur-sm"
            {...motionProps.modalBackdrop}
            onClick={onSkip}
          />
          <motion.div
            className="relative surface-overlay rounded-2xl w-full max-w-sm overflow-hidden z-10"
            {...motionProps.modalPanel}
          >
            {/* Indigo accent stripe */}
            <div className="h-[3px] w-full bg-indigo-500 dark:bg-indigo-400" />

            <div className="p-7 sm:p-8">
              <div className="flex justify-center mb-5">
                <span className="flex items-center justify-center w-14 h-14 rounded-2xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
                  <GraduationCap size={28} strokeWidth={1.75} aria-hidden />
                </span>
              </div>

              <h2
                id="tour-welcome-title"
                className="text-xl font-bold text-primary tracking-tight text-center leading-snug"
              >
                Welcome to FinancePlanner
              </h2>
              <p className="text-sm text-secondary mt-2.5 text-center leading-relaxed">
                Plan your income, expenses, debt payoff, emergency fund, and savings goals — all
                locally on your device.
              </p>

              <div className="mt-7 flex flex-col gap-2.5">
                <Button className="w-full" onClick={onStart}>
                  Start quick tour
                </Button>
                <Button variant="ghost" className="w-full" onClick={onSkip}>
                  Skip for now
                </Button>
              </div>

              <p className="text-[11px] text-muted text-center mt-4 leading-relaxed">
                You can replay this tour anytime from Settings.
              </p>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
