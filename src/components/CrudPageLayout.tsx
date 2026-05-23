import { useEffect, useRef, type ReactNode } from 'react';
import {
  CRUD_LAYOUT_GRID_CLASS,
  CRUD_STICKY_PANEL_CLASS,
} from './crudStickyLayout';

interface Props {
  form: ReactNode;
  list: ReactNode;
  /** Renders below the two-column grid (summary cards, charts, etc.) */
  after?: ReactNode;
  /** Scroll form into view on narrow screens when editing starts */
  editingActive?: boolean;
  /** Changes when a different item is selected for edit — triggers subtle form attention */
  editingKey?: string | null;
  className?: string;
}

/**
 * Desktop (lg+): sticky form with viewport-centered offset + scrollable panel.
 * Mobile: stacked layout, no sticky.
 */
export function CrudPageLayout({
  form,
  list,
  after,
  editingActive = false,
  editingKey = null,
  className = '',
}: Props) {
  const formRef = useRef<HTMLDivElement>(null);
  const wasEditingRef = useRef(false);
  const prevEditingKeyRef = useRef<string | null>(null);

  useEffect(() => {
    if (!editingActive) {
      wasEditingRef.current = false;
      prevEditingKeyRef.current = null;
      return;
    }

    const enteringEdit = !wasEditingRef.current;
    const switchingItem =
      editingKey != null &&
      prevEditingKeyRef.current != null &&
      editingKey !== prevEditingKeyRef.current;

    wasEditingRef.current = true;
    prevEditingKeyRef.current = editingKey;

    const el = formRef.current;
    if (!el) return;

    if (enteringEdit || switchingItem) {
      el.classList.remove('crud-form-attention');
      void el.offsetWidth;
      el.classList.add('crud-form-attention');
    }

    const narrow = window.matchMedia('(max-width: 1023px)');
    if (narrow.matches && (enteringEdit || switchingItem)) {
      el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [editingActive, editingKey]);

  return (
    <>
      <div className={`${CRUD_LAYOUT_GRID_CLASS} ${className}`}>
        <div ref={formRef} className={CRUD_STICKY_PANEL_CLASS}>
          {form}
        </div>
        <div className="min-w-0">{list}</div>
      </div>
      {after}
    </>
  );
}

/** Highlight class for the list row matching the active edit target. */
export function crudListItemClass(isActive: boolean, base = ''): string {
  const active =
    'rounded-xl px-3 -mx-3 bg-indigo-50/70 dark:bg-indigo-500/[0.08] ring-1 ring-indigo-200/80 dark:ring-indigo-500/25';
  return [base, isActive ? active : ''].filter(Boolean).join(' ');
}

/** Subtle emphasis on the form card while editing. */
export function crudFormCardClass(isEditing: boolean, extra = ''): string {
  const editRing = isEditing
    ? 'ring-2 ring-indigo-500/25 dark:ring-indigo-400/20'
    : '';
  return ['!p-4 sm:!p-5', editRing, extra].filter(Boolean).join(' ');
}
