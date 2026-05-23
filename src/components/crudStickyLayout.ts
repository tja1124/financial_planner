/**
 * Shared sticky positioning for CRUD two-column layouts (Income, Expenses, Debt, Savings).
 * Applied via `.crud-sticky-form-panel` in index.css — lg+ only.
 */

/** Viewport offset: clears nav, sits in middle-upper area while scrolling. */
export const CRUD_STICKY_TOP = 'clamp(96px, 14vh, 180px)';

/** Space reserved below the sticky panel (footer / page padding). */
export const CRUD_STICKY_BOTTOM_GAP = '1.5rem';

/** CSS class for the sticky form wrapper (see index.css). */
export const CRUD_STICKY_PANEL_CLASS = 'crud-sticky-form-panel';

/** Grid class for the two-column CRUD layout. */
export const CRUD_LAYOUT_GRID_CLASS =
  'grid grid-cols-1 lg:grid-cols-[minmax(272px,300px)_1fr] gap-4 lg:gap-6 items-start';
