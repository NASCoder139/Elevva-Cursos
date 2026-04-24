export const formatDuration = (seconds: number): string => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  if (minutes > 0) {
    return `${minutes}m ${secs}s`;
  }
  return `${secs}s`;
};

export const formatDurationMinutes = (minutes: number): string => {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hours > 0) {
    return `${hours}h ${mins > 0 ? `${mins}m` : ''}`;
  }
  return `${mins}m`;
};

export const formatPrice = (amount: number, currency = 'ARS'): string => {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
  }).format(amount / 100);
};

export const formatUSD = (amount: number | string | null | undefined): string => {
  const n = amount == null ? 0 : typeof amount === 'string' ? Number(amount) : amount;
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format(isNaN(n) ? 0 : n);
};

export const hasDiscount = (
  price: number | string | null | undefined,
  comparePrice: number | string | null | undefined,
): boolean => {
  if (price == null || comparePrice == null) return false;
  const p = typeof price === 'string' ? Number(price) : price;
  const c = typeof comparePrice === 'string' ? Number(comparePrice) : comparePrice;
  return Number.isFinite(p) && Number.isFinite(c) && c > p && p > 0;
};

export const formatDate = (dateString: string): string => {
  return new Intl.DateTimeFormat('es-AR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(new Date(dateString));
};

export const formatPercent = (value: number): string => {
  return `${Math.round(value)}%`;
};

export const formatBytes = (bytes: number | string | null | undefined): string => {
  if (bytes == null) return '';
  const n = typeof bytes === 'string' ? Number(bytes) : bytes;
  if (!Number.isFinite(n) || n <= 0) return '';
  const units = ['B', 'KB', 'MB', 'GB'];
  let i = 0;
  let v = n;
  while (v >= 1024 && i < units.length - 1) {
    v /= 1024;
    i++;
  }
  return `${v.toFixed(v >= 10 || i === 0 ? 0 : 1)} ${units[i]}`;
};
