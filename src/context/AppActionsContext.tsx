import {
  createContext,
  useCallback,
  useContext,
  useRef,
  useState,
  type ReactNode,
  type Dispatch,
  type SetStateAction,
} from 'react';
import type { AppData } from '../types';
import { cloneAppData } from '../utils/undo';

export interface ToastState {
  message: string;
  onUndo?: () => void;
}

interface AppActionsContextValue {
  data: AppData;
  setData: Dispatch<SetStateAction<AppData>>;
  notifyUndo: (message: string, previousSnapshot: AppData) => void;
  showToast: (message: string) => void;
  toast: ToastState | null;
  dismissToast: () => void;
}

const AppActionsContext = createContext<AppActionsContextValue | null>(null);

interface ProviderProps {
  data: AppData;
  setData: Dispatch<SetStateAction<AppData>>;
  children: ReactNode;
}

export function AppActionsProvider({ data, setData, children }: ProviderProps) {
  const [toast, setToast] = useState<ToastState | null>(null);
  const undoTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const dismissToast = useCallback(() => {
    if (undoTimeoutRef.current) {
      clearTimeout(undoTimeoutRef.current);
      undoTimeoutRef.current = null;
    }
    setToast(null);
  }, []);

  const showToast = useCallback(
    (message: string) => {
      dismissToast();
      setToast({ message });
      undoTimeoutRef.current = setTimeout(() => setToast(null), 4000);
    },
    [dismissToast],
  );

  const notifyUndo = useCallback(
    (message: string, previousSnapshot: AppData) => {
      dismissToast();
      const snapshot = cloneAppData(previousSnapshot);
      setToast({
        message,
        onUndo: () => {
          setData(snapshot);
          dismissToast();
          setToast({ message: 'Action undone.' });
          undoTimeoutRef.current = setTimeout(() => setToast(null), 2500);
        },
      });
      undoTimeoutRef.current = setTimeout(() => setToast(null), 8000);
    },
    [dismissToast, setData],
  );

  const value: AppActionsContextValue = {
    data,
    setData,
    notifyUndo,
    showToast,
    toast,
    dismissToast,
  };

  return (
    <AppActionsContext.Provider value={value}>{children}</AppActionsContext.Provider>
  );
}

export function useAppActions(): AppActionsContextValue {
  const ctx = useContext(AppActionsContext);
  if (!ctx) throw new Error('useAppActions must be used within AppActionsProvider');
  return ctx;
}
