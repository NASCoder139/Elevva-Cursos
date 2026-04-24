import { type InputHTMLAttributes, forwardRef } from 'react';
import clsx from 'clsx';
import type { LucideIcon } from 'lucide-react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: LucideIcon;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, icon: Icon, className, ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1">
            {label}
          </label>
        )}
        <div className="relative">
          {Icon && (
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Icon className="h-5 w-5 text-surface-400" />
            </div>
          )}
          <input
            ref={ref}
            className={clsx(
              'w-full rounded-lg border bg-white px-4 py-2.5 text-surface-900 placeholder-surface-400 transition-colors',
              'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent',
              'dark:bg-surface-900 dark:border-surface-700 dark:text-surface-100 dark:placeholder-surface-500',
              error
                ? 'border-red-500 focus:ring-red-500'
                : 'border-surface-300 dark:border-surface-600',
              Icon && 'pl-10',
              className,
            )}
            {...props}
          />
        </div>
        {error && <p className="mt-1 text-sm text-red-500">{error}</p>}
      </div>
    );
  },
);

Input.displayName = 'Input';
