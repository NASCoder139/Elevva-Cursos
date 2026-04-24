import type { HTMLAttributes, ReactNode } from 'react';
import clsx from 'clsx';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  hover?: boolean;
}

export function Card({ children, hover = false, className, ...props }: CardProps) {
  return (
    <div
      className={clsx(
        'bg-white dark:bg-surface-900 rounded-xl border border-surface-200 dark:border-surface-800',
        hover && 'hover:border-primary-500/50 hover:shadow-lg transition-all duration-300 cursor-pointer',
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}
