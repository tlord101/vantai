import { motion } from 'framer-motion';
import { ReactNode } from 'react';

interface GlassCardProps {
  children: ReactNode;
  className?: string;
  animate?: boolean;
}

export const GlassCard = ({ children, className = '', animate = true }: GlassCardProps) => {
  const Component = animate ? motion.div : 'div';
  
  const animationProps = animate ? {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.5 },
  } : {};

  return (
    <Component
      className={`glass-effect rounded-2xl p-4 shadow-xl ${className}`}
      {...animationProps}
    >
      {children}
    </Component>
  );
};
