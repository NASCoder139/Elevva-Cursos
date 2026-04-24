import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

interface TokenCache {
  value: string;
  expiresAt: number;
}

@Injectable()
export class PayPalService {
  private readonly logger = new Logger(PayPalService.name);
  private token: TokenCache | null = null;

  readonly currency: string;
  readonly mode: 'sandbox' | 'live';
  readonly clientId: string;
  readonly clientSecret: string;
  readonly baseUrl: string;

  constructor(private config: ConfigService) {
    this.mode = (this.config.get<string>('PAYPAL_MODE', 'sandbox') as 'sandbox' | 'live');
    this.currency = this.config.get<string>('PAYPAL_CURRENCY', 'USD');
    this.clientId = this.config.get<string>('PAYPAL_CLIENT_ID', '');
    this.clientSecret = this.config.get<string>('PAYPAL_CLIENT_SECRET', '');
    this.baseUrl = this.mode === 'live' ? 'https://api-m.paypal.com' : 'https://api-m.sandbox.paypal.com';

    if (!this.clientId || !this.clientSecret) {
      this.logger.warn('PayPal credentials no configuradas — PayPal en modo simulado');
    }
  }

  get isConfigured(): boolean {
    return !!(this.clientId && this.clientSecret);
  }

  private async getAccessToken(): Promise<string> {
    if (this.token && this.token.expiresAt > Date.now() + 30_000) return this.token.value;

    const creds = Buffer.from(`${this.clientId}:${this.clientSecret}`).toString('base64');
    const res = await fetch(`${this.baseUrl}/v1/oauth2/token`, {
      method: 'POST',
      headers: {
        Authorization: `Basic ${creds}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: 'grant_type=client_credentials',
    });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`PayPal token error: ${res.status} ${text}`);
    }
    const json: any = await res.json();
    this.token = {
      value: json.access_token,
      expiresAt: Date.now() + json.expires_in * 1000,
    };
    return this.token.value;
  }

  private async request<T = any>(path: string, init: RequestInit = {}): Promise<T> {
    const token = await this.getAccessToken();
    const res = await fetch(`${this.baseUrl}${path}`, {
      ...init,
      headers: {
        ...(init.headers || {}),
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });
    const text = await res.text();
    const json = text ? JSON.parse(text) : {};
    if (!res.ok) {
      this.logger.error(`PayPal ${path} ${res.status}: ${text}`);
      throw new Error(`PayPal error ${res.status}: ${json?.message || res.statusText}`);
    }
    return json as T;
  }

  // ── Orders (one-time) ───────────────────────────────────────────────────

  async createOrder(params: {
    amount: number;
    description: string;
    externalReference: string;
    returnUrl: string;
    cancelUrl: string;
  }): Promise<{ id: string; approveUrl: string }> {
    if (!this.isConfigured) {
      return {
        id: `mock-paypal-${Date.now()}`,
        approveUrl: `${params.returnUrl}?mock=1&external_reference=${params.externalReference}`,
      };
    }

    const order = await this.request<any>('/v2/checkout/orders', {
      method: 'POST',
      body: JSON.stringify({
        intent: 'CAPTURE',
        purchase_units: [
          {
            reference_id: params.externalReference,
            description: params.description.slice(0, 127),
            amount: {
              currency_code: this.currency,
              value: params.amount.toFixed(2),
            },
          },
        ],
        application_context: {
          return_url: params.returnUrl,
          cancel_url: params.cancelUrl,
          shipping_preference: 'NO_SHIPPING',
          user_action: 'PAY_NOW',
        },
      }),
    });

    const approveUrl = order.links?.find((l: any) => l.rel === 'approve')?.href;
    return { id: order.id, approveUrl: approveUrl || params.returnUrl };
  }

  async getOrder(orderId: string): Promise<any> {
    if (!this.isConfigured) return null;
    return this.request(`/v2/checkout/orders/${orderId}`);
  }

  async captureOrder(orderId: string): Promise<any> {
    if (!this.isConfigured) return null;
    return this.request(`/v2/checkout/orders/${orderId}/capture`, { method: 'POST' });
  }

  // ── Billing Plans + Subscriptions ───────────────────────────────────────

  async ensureProduct(): Promise<string> {
    const res = await this.request<any>('/v1/catalogs/products', {
      method: 'POST',
      body: JSON.stringify({
        name: 'MIACCESS',
        description: 'Plataforma de cursos MIACCESS',
        type: 'SERVICE',
        category: 'EDUCATIONAL_AND_TEXTBOOKS',
      }),
    });
    return res.id;
  }

  async createPlan(params: {
    productId: string;
    planKey: 'MONTHLY' | 'ANNUAL';
    amount: number;
  }): Promise<string> {
    const intervalUnit = 'MONTH';
    const intervalCount = params.planKey === 'ANNUAL' ? 12 : 1;
    const res = await this.request<any>('/v1/billing/plans', {
      method: 'POST',
      body: JSON.stringify({
        product_id: params.productId,
        name: params.planKey === 'ANNUAL' ? 'Suscripción anual' : 'Suscripción mensual',
        status: 'ACTIVE',
        billing_cycles: [
          {
            frequency: { interval_unit: intervalUnit, interval_count: intervalCount },
            tenure_type: 'REGULAR',
            sequence: 1,
            total_cycles: 0,
            pricing_scheme: {
              fixed_price: { value: params.amount.toFixed(2), currency_code: this.currency },
            },
          },
        ],
        payment_preferences: {
          auto_bill_outstanding: true,
          setup_fee_failure_action: 'CONTINUE',
          payment_failure_threshold: 3,
        },
      }),
    });
    return res.id;
  }

  async createSubscription(params: {
    planId: string;
    externalReference: string;
    returnUrl: string;
    cancelUrl: string;
    payerEmail?: string;
  }): Promise<{ id: string; approveUrl: string }> {
    if (!this.isConfigured) {
      return {
        id: `mock-paypal-sub-${Date.now()}`,
        approveUrl: `${params.returnUrl}?mock=1&external_reference=${params.externalReference}`,
      };
    }
    const res = await this.request<any>('/v1/billing/subscriptions', {
      method: 'POST',
      body: JSON.stringify({
        plan_id: params.planId,
        custom_id: params.externalReference,
        subscriber: params.payerEmail ? { email_address: params.payerEmail } : undefined,
        application_context: {
          return_url: params.returnUrl,
          cancel_url: params.cancelUrl,
          user_action: 'SUBSCRIBE_NOW',
          shipping_preference: 'NO_SHIPPING',
        },
      }),
    });
    const approveUrl = res.links?.find((l: any) => l.rel === 'approve')?.href;
    return { id: res.id, approveUrl: approveUrl || params.returnUrl };
  }

  async getSubscription(subId: string): Promise<any> {
    if (!this.isConfigured) return null;
    return this.request(`/v1/billing/subscriptions/${subId}`);
  }

  async cancelSubscription(subId: string, reason = 'User requested cancellation'): Promise<void> {
    if (!this.isConfigured) return;
    await this.request(`/v1/billing/subscriptions/${subId}/cancel`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    });
  }
}
