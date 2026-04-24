import { type LucideIcon } from 'lucide-react';

interface StatsCardProps {
  icon: LucideIcon;
  label: string;
  value: string | number;
  accent?: 'primary' | 'green' | 'yellow' | 'red';
}

const accents = {
  primary: 'bg-primary-100 text-primary-600 dark:bg-primary-900/30 dark:text-primary-400',
  green: 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400',
  yellow: 'bg-yellow-100 text-yellow-600 dark:bg-yellow-900/30 dark:text-yellow-400',
  red: 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400',
};

export function StatsCard({ icon: Icon, label, value, accent = 'primary' }: StatsCardProps) {
  return (
    <div className="rounded-xl border border-surface-200 bg-white p-5 dark:border-surface-800 dark:bg-surface-900">
      <div className="flex items-start justify-between">
        <div>
          <div className="text-sm text-surface-500">{label}</div>
          <div className="mt-1 text-2xl font-bold text-surface-900 dark:text-surface-50">{value}</div>
        </div>
        <div className={`rounded-lg p-2.5 ${accents[accent]}`}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  );
}
