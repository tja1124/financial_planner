import { useId, useState, type ReactNode } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronDown } from 'lucide-react';
import { AppIcon } from './icons';
import { useMotion } from '../hooks/useMotion';

interface Props {
  title: string;
  summary?: ReactNode;
  children: ReactNode;
  /** Expanded on desktop by default */
  defaultExpanded?: boolean;
  /** When true, starts collapsed on viewports under 768px */
  collapseOnMobile?: boolean;
  actions?: ReactNode;
  className?: string;
  bordered?: boolean;
}

function getInitialExpanded(
  defaultExpanded: boolean,
  collapseOnMobile: boolean,
): boolean {
  if (typeof window === 'undefined') return defaultExpanded;
  if (collapseOnMobile && window.matchMedia('(max-width: 767px)').matches) {
    return false;
  }
  return defaultExpanded;
}

export function CollapsibleSection({
  title,
  summary,
  children,
  defaultExpanded = true,
  collapseOnMobile = false,
  actions,
  className = '',
  bordered = true,
}: Props) {
  const panelId = useId();
  const motionProps = useMotion();
  const [expanded, setExpanded] = useState(() =>
    getInitialExpanded(defaultExpanded, collapseOnMobile),
  );

  const borderClass = bordered ? 'border-t border-[var(--border-subtle)] pt-4 mt-4' : '';

  return (
    <div className={`${borderClass} ${className}`}>
      <div className="flex items-start gap-2">
        <button
          type="button"
          className="flex-1 flex items-start gap-2.5 min-w-0 text-left cursor-pointer accent-ring rounded-lg -m-1 p-1"
          onClick={() => setExpanded((v) => !v)}
          aria-expanded={expanded}
          aria-controls={panelId}
        >
          <span
            className={`mt-0.5 shrink-0 text-muted transition-transform duration-200 ${
              expanded ? 'rotate-0' : '-rotate-90'
            }`}
          >
            <AppIcon icon={ChevronDown} size="sm" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-sm font-semibold text-primary leading-snug">{title}</span>
            {summary && (
              <span className="block text-xs text-muted mt-0.5 leading-relaxed">{summary}</span>
            )}
          </span>
        </button>
        {actions && (
          <div
            className="flex items-center gap-1.5 shrink-0"
            onClick={(e) => e.stopPropagation()}
            onKeyDown={(e) => e.stopPropagation()}
          >
            {actions}
          </div>
        )}
      </div>

      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            id={panelId}
            role="region"
            aria-label={title}
            initial={motionProps.instant ? false : { height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={motionProps.instant ? undefined : { height: 0, opacity: 0 }}
            transition={
              motionProps.instant
                ? { duration: 0 }
                : { duration: 0.22, ease: [0.25, 0.1, 0.25, 1] }
            }
            className="overflow-hidden"
          >
            <div className="pt-3">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
