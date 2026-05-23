import { useEffect, useRef, type ReactNode } from 'react';

interface Props {
  form: ReactNode;
  list: ReactNode;
  /** Renders below the two-column grid (summary cards, charts, etc.) */
  after?: ReactNode;
  /** Scroll form into view on narrow screens when editing starts */
  editingActive?: boolean;
  className?: string;
}

/**
 * Desktop/tablet: sticky compact form (left) + primary list (right).
 * Mobile: stacked form then list.
 */
export function CrudPageLayout({
  form,
  list,
  after,
  editingActive = false,
  className = '',
}: Props) {
  const formRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!editingActive || !formRef.current) return;
    const narrow = window.matchMedia('(max-width: 1023px)');
    if (!narrow.matches) return;
    formRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, [editingActive]);

  return (
    <>
      <div
        className={`grid grid-cols-1 lg:grid-cols-[minmax(272px,300px)_1fr] gap-4 lg:gap-6 items-start ${className}`}
      >
        <div
          ref={formRef}
          className="lg:sticky lg:top-4 lg:self-start lg:max-h-[calc(100dvh-5.5rem)] lg:overflow-y-auto lg:overscroll-contain"
        >
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
