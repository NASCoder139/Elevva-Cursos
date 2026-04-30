import { isChile } from './countries';

export const CHILE_IVA_RATE = 0.19;

export interface PriceBreakdown {
  net: number;
  tax: number;
  total: number;
  taxRate: number;
  applies: boolean;
}

/**
 * Devuelve el desglose de IVA para un precio bruto (con IVA incluido).
 * Solo aplica IVA chileno cuando el país del usuario es Chile.
 * Servicios digitales exportados están exentos de IVA en Chile (DL 825/74).
 */
export function breakdownPrice(total: number, country: string | null | undefined): PriceBreakdown {
  if (!isChile(country)) {
    return { net: total, tax: 0, total, taxRate: 0, applies: false };
  }
  const net = total / (1 + CHILE_IVA_RATE);
  const tax = total - net;
  return { net, tax, total, taxRate: CHILE_IVA_RATE, applies: true };
}
