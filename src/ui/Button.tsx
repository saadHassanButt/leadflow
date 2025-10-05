'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { colors, buttonVariants, animations } from './design-tokens';
import { cn } from '@/lib/utils';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  loading?: boolean;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  fullWidth?: boolean;
  children: React.ReactNode;
}

const sizeClasses = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-4 py-2 text-base',
  lg: 'px-6 py-3 text-lg',
  xl: 'px-8 py-4 text-xl',
};

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({
    variant = 'primary',
    size = 'md',
    loading = false,
    icon,
    iconPosition = 'left',
    fullWidth = false,
    className,
    children,
    disabled,
    ...props
  }, ref) => {
    const variantStyles = buttonVariants[variant];
    const sizeClass = sizeClasses[size];
    
    const baseClasses = cn(
      // Base styles
      'relative inline-flex items-center justify-center gap-2 font-medium rounded-lg',
      'transition-all duration-300 ease-out',
      'focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500',
      'disabled:opacity-50 disabled:cursor-not-allowed',
      'overflow-hidden',
      
      // Size
      sizeClass,
      
      // Full width
      fullWidth && 'w-full',
      
      // Variant styles
      variant === 'primary' && 'bg-primary-500 text-neutral-100 hover:bg-primary-600 active:bg-primary-700',
      variant === 'secondary' && 'bg-dark-800 text-neutral-100 hover:bg-dark-700 active:bg-dark-600',
      variant === 'outline' && 'bg-transparent text-primary-500 border border-primary-500 hover:bg-primary-50 active:bg-primary-100',
      variant === 'ghost' && 'bg-transparent text-neutral-600 hover:bg-neutral-100 active:bg-neutral-200',
      
      className
    );

    return (
      <motion.button
        ref={ref}
        className={baseClasses}
        disabled={disabled || loading}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        transition={{ duration: 0.2 }}
        {...props}
      >
        {/* Loading spinner */}
        {loading && (
          <motion.div
            className="w-4 h-4 border-2 border-current border-t-transparent rounded-full"
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          />
        )}
        
        {/* Left icon */}
        {icon && iconPosition === 'left' && !loading && (
          <span className="flex-shrink-0">{icon}</span>
        )}
        
        {/* Button content */}
        <span className={loading ? 'opacity-0' : 'opacity-100'}>
          {children}
        </span>
        
        {/* Right icon */}
        {icon && iconPosition === 'right' && !loading && (
          <span className="flex-shrink-0">{icon}</span>
        )}
        
        {/* Hover effect overlay */}
        <motion.div
          className="absolute inset-0 bg-white/10 rounded-lg"
          initial={{ opacity: 0 }}
          whileHover={{ opacity: 1 }}
          transition={{ duration: 0.2 }}
        />
      </motion.button>
    );
  }
);

Button.displayName = 'Button';
