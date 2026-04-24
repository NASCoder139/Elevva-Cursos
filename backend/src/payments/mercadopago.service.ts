import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MercadoPagoConfig, Payment, Preference, PreApproval } from 'mercadopago';

@Injectable()
export class MercadoPagoService {
  private readonly logger = new Logger(MercadoPagoService.name);
  private client: MercadoPagoConfig | null = null;
  private preference: Preference | null = null;
  private payment: Payment | null = null;
  private preapproval: PreApproval | null = null;

  readonly currency: string;

  constructor(private config: ConfigService) {
    this.currency = this.config.get<string>('MP_CURRENCY', 'CLP');
    const token = this.config.get<string>('MP_ACCESS_TOKEN');
    if (token) {
      this.client = new MercadoPagoConfig({ accessToken: token });
      this.preference = new Preference(this.client);
      this.payment = new Payment(this.client);
      this.preapproval = new PreApproval(this.client);
    } else {
      this.logger.warn('MP_ACCESS_TOKEN no configurado — MercadoPago en modo simulado');
    }
  }

  get isConfigured(): boolean {
    return this.client !== null;
  }

  get isSandbox(): boolean {
    const token = this.config.get<string>('MP_ACCESS_TOKEN', '');
    return token.startsWith('TEST-');
  }

  async createPreference(body: {
    title: string;
    unitPrice: number;
    quantity?: number;
    externalReference: string;
    successUrl: string;
    failureUrl: string;
    pendingUrl: string;
    payerEmail?: string;
    notificationUrl?: string;
  }) {
    if (!this.preference) {
      return { id: `mock-${Date.now()}`, init_point: `${body.successUrl}?mock=1&external_reference=${body.externalReference}` };
    }
    const isLocal = body.successUrl?.includes('localhost');
    const res = await this.preference.create({
      body: {
        items: [
          {
            id: body.externalReference,
            title: body.title,
            quantity: body.quantity || 1,
            unit_price: body.unitPrice,
            currency_id: this.currency,
          },
        ],
        external_reference: body.externalReference,
        back_urls: {
          success: body.successUrl,
          failure: body.failureUrl,
          pending: body.pendingUrl,
        },
        ...(isLocal ? {} : { auto_return: 'approved' as const }),
        ...(isLocal ? {} : { notification_url: body.notificationUrl }),
        payer: body.payerEmail ? { email: body.payerEmail } : undefined,
      },
    });
    const initPoint = this.isSandbox ? res.sandbox_init_point : res.init_point;
    return { id: res.id, init_point: initPoint };
  }

  async createPreapproval(body: {
    reason: string;
    amount: number;
    frequency: number;
    frequencyType: 'months';
    payerEmail: string;
    backUrl: string;
    externalReference: string;
  }) {
    if (!this.preapproval) {
      return { id: `mock-preapproval-${Date.now()}`, init_point: `${body.backUrl}?mock=1&external_reference=${body.externalReference}` };
    }
    const isLocal = body.backUrl.includes('localhost');
    const backUrl = isLocal
      ? body.backUrl.replace(/http:\/\/localhost:\d+/, 'https://miaccess.com')
      : body.backUrl;
    const testEmail = this.config.get<string>('MP_TEST_PAYER_EMAIL', 'admin@miaccess.com');
    const payerEmail = isLocal ? testEmail : body.payerEmail;
    const res = await this.preapproval.create({
      body: {
        reason: body.reason,
        external_reference: body.externalReference,
        payer_email: payerEmail,
        back_url: backUrl,
        auto_recurring: {
          frequency: body.frequency,
          frequency_type: body.frequencyType,
          transaction_amount: body.amount,
          currency_id: this.currency,
        },
        status: 'pending',
      },
    });
    const initPoint = this.isSandbox ? (res as any).sandbox_init_point : res.init_point;
    return { id: res.id, init_point: initPoint || res.init_point };
  }

  async getPayment(paymentId: string) {
    if (!this.payment) return null;
    return this.payment.get({ id: paymentId });
  }

  async getPreapproval(id: string) {
    if (!this.preapproval) return null;
    return this.preapproval.get({ id });
  }
}
