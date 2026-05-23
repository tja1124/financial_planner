import { motion } from 'framer-motion';
import type { ReactNode } from 'react';
import { useMotion } from '../../hooks/useMotion';

export function PageTransition({ children }: { children: ReactNode }) {
  const motionProps = useMotion();
  return (
    <motion.div key="page" {...motionProps.page}>
      {children}
    </motion.div>
  );
}
