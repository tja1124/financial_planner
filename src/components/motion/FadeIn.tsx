import { motion } from 'framer-motion';
import type { ReactNode } from 'react';
import { useMotion } from '../../hooks/useMotion';

export function FadeIn({
  children,
  className = '',
  delay = 0,
  slow,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
  slow?: boolean;
}) {
  const motionProps = useMotion();
  const base = slow ? motionProps.fadeInSlow : motionProps.fadeIn;
  return (
    <motion.div
      className={className}
      {...base}
      transition={{ ...base.transition, delay }}
    >
      {children}
    </motion.div>
  );
}
