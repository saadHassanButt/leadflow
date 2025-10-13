'use client';

import React, { useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { cn } from '@/lib/utils';

export interface ParallaxSectionProps {
  children: React.ReactNode;
  speed?: number;
  direction?: 'up' | 'down' | 'left' | 'right';
  className?: string;
  offset?: [string, string];
}

export const ParallaxSection: React.FC<ParallaxSectionProps> = ({
  children,
  speed = 0.5,
  direction = 'up',
  className,
  offset = ['start end', 'end start'],
}) => {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: offset as ["start end", "end start"],
  });


  const y = useTransform(scrollYProgress, [0, 1], [0, 100 * speed]);
  const x = useTransform(scrollYProgress, [0, 1], [0, 100 * speed]);

  const transform = {
    up: y,
    down: useTransform(y, (value) => -value),
    left: x,
    right: useTransform(x, (value) => -value),
  }[direction];

  return (
    <motion.div
      ref={ref}
      className={cn('relative', className)}
      style={{
        transform: direction === 'up' || direction === 'down' 
          ? `translateY(${transform}px)` 
          : `translateX(${transform}px)`,
      }}
    >
      {children}
    </motion.div>
  );
};

// Parallax container for multiple elements
export interface ParallaxContainerProps {
  children: React.ReactNode;
  className?: string;
}

export const ParallaxContainer: React.FC<ParallaxContainerProps> = ({
  children,
  className,
}) => {
  return (
    <div className={cn('relative overflow-hidden', className)}>
      {children}
    </div>
  );
};

// Parallax text component
export interface ParallaxTextProps {
  children: React.ReactNode;
  speed?: number;
  className?: string;
}

export const ParallaxText: React.FC<ParallaxTextProps> = ({
  children,
  speed = 0.5,
  className,
}) => {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start end', 'end start'],
  });

  const y = useTransform(scrollYProgress, [0, 1], [0, -100 * speed]);

  return (
    <motion.div
      ref={ref}
      className={cn('relative', className)}
      style={{ y }}
    >
      {children}
    </motion.div>
  );
};
