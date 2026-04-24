import { formatUSD, hasDiscount } from '../../lib/formatters';

interface PriceTagProps {
  price: number | string | null | undefined;
  comparePrice?: number | string | null | undefined;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  emptyLabel?: string;
  align?: 'left' | 'right' | 'center';
  className?: string;
}

const sizeClass: Record<NonNullable<PriceTagProps['size']>, { current: string; compare: string }> = {
  sm: { current: 'text-sm font-semibold', compare: 'text-[11px]' },
  md: { current: 'text-base font-bold', compare: 'text-xs' },
  lg: { current: 'text-2xl font-bold', compare: 'text-sm' },
  xl: { current: 'text-4xl font-bold', compare: 'text-base' },
};

export function PriceTag({
  price,
  comparePrice,
  size = 'md',
  emptyLabel = 'Incluido',
  align = 'left',
  className = '',
}: PriceTagProps) {
  const sizes = sizeClass[size];
  const numeric = price == null ? 0 : typeof price === 'string' ? Number(price) : price;
  const discounted = hasDiscount(price, comparePrice);
  const justify = align === 'right' ? 'justify-end' : align === 'center' ? 'justify-center' : 'justify-start';

  if (!numeric || numeric === 0) {
    return <span className={`${sizes.current} text-surface-500 ${className}`}>{emptyLabel}</span>;
  }

  return (
    <span className={`inline-flex items-baseline gap-2 ${justify} ${className}`}>
      {discounted && (
        <span className={`${sizes.compare} text-surface-400 line-through`}>{formatUSD(comparePrice)}</span>
      )}
      <span className={`${sizes.current} ${discounted ? 'text-primary-600 dark:text-primary-400' : 'text-surface-900 dark:text-surface-50'}`}>
        {formatUSD(price)}
      </span>
    </span>
  );
}
