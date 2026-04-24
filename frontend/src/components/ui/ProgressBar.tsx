import clsx from 'clsx';

interface ProgressBarProps {
  value: number;
  max?: number;
  size?: 'sm' | 'md';
  className?: string;
  showLabel?: boolean;
}

export function ProgressBar({ value, max = 100, size = 'md', className, showLabel = false }: ProgressBarProps) {
  const percent = Math.min(Math.round((value / max) * 100), 100);
  return (
    <div className={clsx('w-full', className)}>
      {showLabel && (
        <div className="flex justify-between text-sm mb-1">
          <span className="text-surface-600 dark:text-surface-400">Progreso</span>
          <span className="text-surface-900 dark:text-surface-100 font-medium">{percent}%</span>
        </div>
      )}
      <div
        className={clsx(
          'w-full bg-surface-200 dark:bg-surface-700 rounded-full overflow-hidden',
          size === 'sm' ? 'h-1.5' : 'h-2.5',
        )}
      >
        <div
          className="bg-primary-600 h-full rounded-full transition-all duration-500"
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}
