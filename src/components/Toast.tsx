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
      className="fixed bottom-20 lg:bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 bg-slate-900 dark:bg-slate-800 text-white text-sm font-medium pl-4 pr-2 py-2.5 rounded-xl shadow-xl border border-slate-700 dark:border-slate-600 max-w-[min(100vw-2rem,28rem)]"
    >
      <span className="flex-1 leading-snug">{message}</span>
      {onUndo && (
        <Button
          size="sm"
          variant="secondary"
          className="!bg-white/15 !text-white hover:!bg-white/25 shrink-0"
          onClick={() => {
            onUndo();
          }}
        >
          Undo
        </Button>
      )}
      <button
        type="button"
        onClick={onDismiss}
        className="p-1 text-slate-400 hover:text-white cursor-pointer shrink-0"
        aria-label="Dismiss"
      >
        ✕
      </button>
    </div>
  );
}
