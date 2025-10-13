'use client';

import React from 'react';
import { motion, HTMLMotionProps } from 'framer-motion';
import { cn } from '@/lib/utils';

export interface InputProps extends Omit<HTMLMotionProps<'input'>, 'ref'> {
  label?: string;
  error?: string;
  helperText?: string;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  variant?: 'default' | 'dark';
  fullWidth?: boolean;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({
    label,
    error,
    helperText,
    icon,
    iconPosition = 'left',
    variant = 'default',
    fullWidth = false,
    className,
    ...props
  }, ref) => {
    
    const inputClasses = cn(
      // Base styles
      'w-full px-4 py-3 rounded-lg border transition-all duration-300',
      'focus:outline-none focus:ring-2 focus:ring-offset-2',
      'disabled:opacity-50 disabled:cursor-not-allowed',
      'placeholder:text-neutral-400',
      
      // Icon padding
      icon && iconPosition === 'left' && 'pl-12',
      icon && iconPosition === 'right' && 'pr-12',
      
      // Full width
      fullWidth && 'w-full',
      
      // Variant styles
      variant === 'default' && [
        'bg-neutral-100 border-neutral-300 text-dark-900',
        'focus:ring-primary-500 focus:border-primary-500',
        error && 'border-error-500 focus:ring-error-500',
      ],
      variant === 'dark' && [
        'bg-dark-800 border-dark-600 text-neutral-100',
        'focus:ring-primary-500 focus:border-primary-500',
        error && 'border-error-500 focus:ring-error-500',
      ],
      
      className
    );

    return (
      <div className={cn('space-y-2', fullWidth && 'w-full')}>
        {/* Label */}
        {label && (
          <label className="block text-sm font-medium text-dark-900">
            {label}
          </label>
        )}
        
        {/* Input container */}
        <div className="relative">
          {/* Left icon */}
          {icon && iconPosition === 'left' && (
            <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-neutral-400">
              {icon}
            </div>
          )}
          
          {/* Input */}
          <motion.input
            ref={ref}
            className={inputClasses}
            whileFocus={{ scale: 1.01 }}
            transition={{ duration: 0.2 }}
            {...props}
          />
          
          {/* Right icon */}
          {icon && iconPosition === 'right' && (
            <div className="absolute right-4 top-1/2 transform -translate-y-1/2 text-neutral-400">
              {icon}
            </div>
          )}
        </div>
        
        {/* Error message */}
        {error && (
          <motion.p
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-sm text-error-500"
          >
            {error}
          </motion.p>
        )}
        
        {/* Helper text */}
        {helperText && !error && (
          <p className="text-sm text-neutral-500">
            {helperText}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';
