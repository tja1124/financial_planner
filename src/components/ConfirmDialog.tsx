import { AnimatePresence, motion } from 'framer-motion';
import { Button } from './Button';
import { useMotion } from '../hooks/useMotion';

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  description: string;
  confirmLabel: string;
  cancelLabel?: string;
  variant?: 'danger' | 'primary';
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel,
  cancelLabel = 'Cancel',
  variant = 'danger',
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const motionProps = useMotion();

  return (
    <AnimatePresence>
      {open && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 sm:p-6"
          role="dialog"
          aria-modal="true"
          aria-labelledby="confirm-dialog-title"
        >
          <motion.button
            type="button"
            className="absolute inset-0 bg-slate-900/50 dark:bg-black/70 backdrop-blur-sm cursor-pointer"
            aria-label="Close dialog"
            onClick={onCancel}
            {...motionProps.modalBackdrop}
          />
          <motion.div
            className="relative surface-overlay rounded-2xl w-full max-w-md p-6 sm:p-7"
            {...motionProps.modalPanel}
          >
            <h2 id="confirm-dialog-title" className="text-lg font-semibold text-primary">
              {title}
            </h2>
            <p className="text-sm text-secondary mt-2.5 leading-relaxed">{description}</p>
            <div className="flex flex-col-reverse sm:flex-row gap-2.5 mt-7">
              <Button variant="secondary" className="flex-1 min-h-[44px]" onClick={onCancel}>
                {cancelLabel}
              </Button>
              <Button
                variant={variant === 'danger' ? 'destructive' : 'primary'}
                className="flex-1 min-h-[44px]"
                onClick={onConfirm}
              >
                {confirmLabel}
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
