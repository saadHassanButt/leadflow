'use client';

import React, { useEffect } from 'react';
import Lenis from 'lenis';

interface SmoothScrollProviderProps {
  children: React.ReactNode;
}

export const SmoothScrollProvider: React.FC<SmoothScrollProviderProps> = ({ children }) => {
  useEffect(() => {
    const lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      direction: 'vertical',
      gestureDirection: 'vertical',
      smooth: true,
      mouseMultiplier: 1,
      smoothTouch: false,
      touchMultiplier: 2,
      infinite: false,
      // Prevent smooth scrolling on specific elements
      prevent: (node) => {
        // Don't apply smooth scrolling to scrollable containers
        return node.classList.contains('scrollable') || 
               node.classList.contains('scrollable-y') || 
               node.classList.contains('scrollable-x') ||
               node.closest('.scrollable') ||
               node.closest('.scrollable-y') ||
               node.closest('.scrollable-x') ||
               node.closest('[data-lenis-prevent]') ||
               // Also prevent on overflow containers
               node.style.overflow === 'auto' ||
               node.style.overflowY === 'auto' ||
               node.style.overflowX === 'auto';
      },
    });

    function raf(time: number) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }

    requestAnimationFrame(raf);

    return () => {
      lenis.destroy();
    };
  }, []);

  return <>{children}</>;
};
