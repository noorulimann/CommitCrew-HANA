'use client';

/**
 * Input Component
 * Reusable input field with label and error states
 */

import { forwardRef, InputHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, helperText, id, ...props }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');
    
    return (
      <div className="w-full">
        {label && (
          <label 
            htmlFor={inputId}
            className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1"
          >
            {label}
          </label>
        )}
        
        <input
          ref={ref}
          id={inputId}
          className={cn(
            'w-full px-4 py-2 rounded-lg border',
            'bg-white dark:bg-slate-900',
            'focus:outline-none focus:ring-2 focus:border-transparent',
            'disabled:opacity-50 disabled:cursor-not-allowed',
            'transition-colors duration-200',
            error
              ? 'border-red-500 focus:ring-red-500'
              : 'border-slate-300 dark:border-slate-600 focus:ring-primary-500',
            'dark:text-white',
            className
          )}
          {...props}
        />
        
        {(error || helperText) && (
          <p className={cn(
            'mt-1 text-sm',
            error ? 'text-red-500' : 'text-slate-500 dark:text-slate-400'
          )}>
            {error || helperText}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

export default Input;
