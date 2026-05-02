export const COUNTRIES = [
  'Chile',
  'Argentina',
  'Bolivia',
  'Brasil',
  'Canadá',
  'Colombia',
  'Costa Rica',
  'Cuba',
  'Ecuador',
  'El Salvador',
  'España',
  'Estados Unidos',
  'Francia',
  'Guatemala',
  'Honduras',
  'Italia',
  'México',
  'Nicaragua',
  'Panamá',
  'Paraguay',
  'Perú',
  'Portugal',
  'Puerto Rico',
  'Reino Unido',
  'República Dominicana',
  'Uruguay',
  'Venezuela',
  'Otro',
] as const;

export type Country = (typeof COUNTRIES)[number];

const CHILE_ALIASES = new Set(['chile', 'chl', 'cl']);

export function isChile(country: string | null | undefined): boolean {
  if (!country) return false;
  return CHILE_ALIASES.has(country.trim().toLowerCase());
}

/**
 * Override opcional del proveedor de pago (vía env var del frontend).
 * Útil mientras MP completa la verificación de la cuenta y todos los pagos
 * se canalizan por PayPal temporalmente.
 *
 * Valores válidos: 'MERCADOPAGO' | 'PAYPAL' | undefined
 */
export function getForcedPaymentProvider(): 'MERCADOPAGO' | 'PAYPAL' | null {
  const v = (import.meta.env.VITE_FORCE_PAYMENT_PROVIDER || '').toString().trim().toUpperCase();
  if (v === 'MERCADOPAGO' || v === 'PAYPAL') return v;
  return null;
}
