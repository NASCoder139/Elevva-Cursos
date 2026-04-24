export type PlanKey = 'MONTHLY' | 'ANNUAL';
export type ProviderKey = 'MERCADOPAGO' | 'PAYPAL';

export const PLAN_LABELS: Record<PlanKey, string> = {
  MONTHLY: 'Suscripción mensual',
  ANNUAL: 'Suscripción anual',
};

export function planToPaymentType(plan: PlanKey): 'SUBSCRIPTION_MONTHLY' | 'SUBSCRIPTION_ANNUAL' {
  return plan === 'MONTHLY' ? 'SUBSCRIPTION_MONTHLY' : 'SUBSCRIPTION_ANNUAL';
}

export function paymentTypeToPlan(type: 'SUBSCRIPTION_MONTHLY' | 'SUBSCRIPTION_ANNUAL'): PlanKey {
  return type === 'SUBSCRIPTION_MONTHLY' ? 'MONTHLY' : 'ANNUAL';
}

export function planFrequency(plan: PlanKey): number {
  return plan === 'MONTHLY' ? 1 : 12;
}
