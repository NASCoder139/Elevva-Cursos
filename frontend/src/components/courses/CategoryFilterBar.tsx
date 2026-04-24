import clsx from 'clsx';
import type { Category } from '../../types/course.types';

interface CategoryFilterBarProps {
  categories: Category[];
  activeSlug?: string;
  onChange: (slug: string | undefined) => void;
}

export default function CategoryFilterBar({ categories, activeSlug, onChange }: CategoryFilterBarProps) {
  const base =
    'whitespace-nowrap rounded-full px-4 py-2 text-sm font-medium transition';
  const active = 'bg-primary-600 text-white shadow';
  const inactive =
    'bg-surface-100 text-surface-700 hover:bg-surface-200 dark:bg-surface-800 dark:text-surface-300 dark:hover:bg-surface-700';

  return (
    <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin">
      <button
        type="button"
        className={clsx(base, !activeSlug ? active : inactive)}
        onClick={() => onChange(undefined)}
      >
        Todos
      </button>
      {categories.map((cat) => (
        <button
          type="button"
          key={cat.id}
          className={clsx(base, activeSlug === cat.slug ? active : inactive)}
          onClick={() => onChange(cat.slug)}
        >
          {cat.name}
        </button>
      ))}
    </div>
  );
}
