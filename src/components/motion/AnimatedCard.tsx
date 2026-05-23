import { motion } from 'framer-motion';
import type { ReactNode } from 'react';
import { useMotion } from '../../hooks/useMotion';

interface Props {
  children: ReactNode;
  className?: string;
  padding?: 'default' | 'none';
  hoverLift?: boolean;
  delay?: number;
  'data-tour'?: string;
}

export function AnimatedCard({
  children,
  className = '',
  padding = 'default',
  hoverLift = false,
  delay = 0,
  'data-tour': dataTour,
}: Props) {
  const motionProps = useMotion();

  return (
    <motion.div
      className={`surface-card ${padding === 'default' ? 'p-6 sm:p-7' : ''} ${className}`}
      data-tour={dataTour}
      initial={motionProps.fadeIn.initial}
      animate={motionProps.fadeIn.animate}
      transition={{
        ...(motionProps.fadeIn.transition ?? { duration: 0 }),
        delay,
      }}
      {...(hoverLift ? motionProps.lift : {})}
    >
      {children}
    </motion.div>
  );
}
