import { Button } from './Button';

interface Props {
  message: string;
  onUndo?: () => void;
  onDismiss: () => void;
}

export function Toast({ message, onUndo, onDismiss }: Props) {
  return (
    <div
      role="status"
      className="fixed bottom-20 lg:bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 surface-overlay text-primary text-sm font-medium pl-4 pr-2 py-2.5 rounded-xl max-w-[min(100vw-2rem,28rem)]"
    >
      <span className="flex-1 leading-snug text-secondary">{message}</span>
      {onUndo && (
        <Button
          size="sm"
          variant="secondary"
          className="shrink-0 dark:bg-indigo-500/15 dark:text-indigo-300 dark:border-indigo-500/25"
          onClick={onUndo}
        >
          Undo
        </Button>
      )}
      <button
        type="button"
        onClick={onDismiss}
        className="p-1.5 text-caption hover:text-primary cursor-pointer shrink-0 rounded-md hover:bg-white/[0.06] transition-colors"
        aria-label="Dismiss"
      >
        ✕
      </button>
    </div>
  );
}
