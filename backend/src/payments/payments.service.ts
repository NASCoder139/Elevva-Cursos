import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import { MailService } from '../mail/mail.service';
import { MercadoPagoService } from './mercadopago.service';
import { PayPalService } from './paypal.service';
import { PlansService } from './plans.service';
import { CouponsService } from '../coupons/coupons.service';
import {
  PLAN_LABELS,
  PlanKey,
  ProviderKey,
  planFrequency,
  planToPaymentType,
} from './plans';

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);

  constructor(
    private prisma: PrismaService,
    private mp: MercadoPagoService,
    private paypal: PayPalService,
    private config: ConfigService,
    private mail: MailService,
    private plansSvc: PlansService,
    private couponsSvc: CouponsService,
  ) {}

  private get frontendUrl() {
    return this.config.get<string>('FRONTEND_URL', 'http://localhost:5173');
  }

  private get backendUrl() {
    return this.config.get<string>('BACKEND_URL', 'http://localhost:3000');
  }

  private get successUrl() { return `${this.frontendUrl}/payment/result`; }
  private get cancelUrl() { return `${this.frontendUrl}/payment/result?status=cancelled`; }

  async checkoutCourse(
    userId: string,
    courseId: string,
    providerInput: ProviderKey = 'MERCADOPAGO',
    couponCode?: string,
  ) {
    const provider: ProviderKey = providerInput || 'MERCADOPAGO';
    const course = await this.prisma.course.findUnique({ where: { id: courseId } });
    if (!course) throw new NotFoundException('Curso no encontrado');
    if (!course.price || Number(course.price) <= 0) {
      throw new BadRequestException('Este curso no está disponible para compra única');
    }

    const existing = await this.prisma.purchase.findFirst({ where: { userId, courseId } });
    if (existing) throw new BadRequestException('Ya compraste este curso');

    const user = await this.prisma.user.findUnique({ where: { id: userId }, select: { email: true } });
    const baseAmount = Number(course.price);

    const applied = couponCode
      ? await this.couponsSvc.validate(couponCode, 'COURSE', baseAmount)
      : null;
    const amount = applied ? applied.finalAmount : baseAmount;
    const currency = 'USD';

    const payment = await this.prisma.payment.create({
      data: {
        userId,
        provider: provider as any,
        type: 'ONE_TIME_COURSE',
        amount,
        currency,
        status: 'PENDING',
        couponCode: applied?.code,
        discountAmount: applied?.discountAmount,
        mpDetail: { courseId: course.id, baseAmount, couponId: applied?.couponId } as any,
      },
    });

    if (provider === 'PAYPAL') {
      const order = await this.paypal.createOrder({
        amount,
        description: course.title,
        externalReference: payment.id,
        returnUrl: `${this.successUrl}?provider=paypal&paymentId=${payment.id}`,
        cancelUrl: this.cancelUrl,
      });
      await this.prisma.payment.update({
        where: { id: payment.id },
        data: { paypalOrderId: order.id },
      });
      return { paymentId: payment.id, providerRef: order.id, initPoint: order.approveUrl, provider };
    }

    const pref = await this.mp.createPreference({
      title: course.title,
      unitPrice: amount,
      externalReference: payment.id,
      successUrl: this.successUrl,
      failureUrl: this.successUrl,
      pendingUrl: this.successUrl,
      notificationUrl: `${this.backendUrl}/api/payments/webhook`,
      payerEmail: user?.email,
    });
    return { paymentId: payment.id, preferenceId: pref.id, initPoint: pref.init_point, provider };
  }

  async checkoutCategory(
    userId: string,
    categoryId: string,
    providerInput: ProviderKey = 'MERCADOPAGO',
    couponCode?: string,
  ) {
    const provider: ProviderKey = providerInput || 'MERCADOPAGO';
    const category = await this.prisma.category.findUnique({ where: { id: categoryId } });
    if (!category) throw new NotFoundException('Categoría no encontrada');
    if (!category.price || Number(category.price) <= 0) {
      throw new BadRequestException('Esta categoría no está disponible para compra única');
    }

    const existing = await this.prisma.purchase.findFirst({ where: { userId, categoryId } });
    if (existing) throw new BadRequestException('Ya compraste esta categoría');

    const user = await this.prisma.user.findUnique({ where: { id: userId }, select: { email: true } });
    const baseAmount = Number(category.price);

    const applied = couponCode
      ? await this.couponsSvc.validate(couponCode, 'CATEGORY', baseAmount)
      : null;
    const amount = applied ? applied.finalAmount : baseAmount;
    const currency = 'USD';

    const payment = await this.prisma.payment.create({
      data: {
        userId,
        provider: provider as any,
        type: 'ONE_TIME_CATEGORY',
        amount,
        currency,
        status: 'PENDING',
        couponCode: applied?.code,
        discountAmount: applied?.discountAmount,
        mpDetail: { categoryId: category.id, baseAmount, couponId: applied?.couponId } as any,
      },
    });

    if (provider === 'PAYPAL') {
      const order = await this.paypal.createOrder({
        amount,
        description: `Categoría: ${category.name}`,
        externalReference: payment.id,
        returnUrl: `${this.successUrl}?provider=paypal&paymentId=${payment.id}`,
        cancelUrl: this.cancelUrl,
      });
      await this.prisma.payment.update({
        where: { id: payment.id },
        data: { paypalOrderId: order.id },
      });
      return { paymentId: payment.id, providerRef: order.id, initPoint: order.approveUrl, provider };
    }

    const pref = await this.mp.createPreference({
      title: `Categoría: ${category.name}`,
      unitPrice: amount,
      externalReference: payment.id,
      successUrl: this.successUrl,
      failureUrl: this.successUrl,
      pendingUrl: this.successUrl,
      notificationUrl: `${this.backendUrl}/api/payments/webhook`,
      payerEmail: user?.email,
    });
    return { paymentId: payment.id, preferenceId: pref.id, initPoint: pref.init_point, provider };
  }

  async subscribe(
    userId: string,
    plan: PlanKey,
    providerInput: ProviderKey = 'MERCADOPAGO',
    couponCode?: string,
  ) {
    const provider: ProviderKey = providerInput || 'MERCADOPAGO';
    const existing = await this.prisma.subscription.findUnique({ where: { userId } });
    if (existing && existing.status === 'ACTIVE') {
      throw new BadRequestException('Ya tenés una suscripción activa');
    }

    const user = await this.prisma.user.findUnique({ where: { id: userId }, select: { email: true } });
    if (!user) throw new NotFoundException('Usuario no encontrado');

    const baseAmount = await this.plansSvc.priceFor(plan);
    const applied = couponCode
      ? await this.couponsSvc.validate(couponCode, 'PLAN', baseAmount)
      : null;
    const amount = applied ? applied.finalAmount : baseAmount;
    const paymentType = planToPaymentType(plan);

    const sub = existing
      ? await this.prisma.subscription.update({
          where: { userId },
          data: { plan: paymentType, status: 'PENDING', provider: provider as any },
        })
      : await this.prisma.subscription.create({
          data: { userId, plan: paymentType, status: 'PENDING', provider: provider as any },
        });

    if (provider === 'PAYPAL') {
      const productId = await this.paypal.ensureProduct();
      const planId = await this.paypal.createPlan({ productId, planKey: plan, amount });
      const ppSub = await this.paypal.createSubscription({
        planId,
        externalReference: sub.id,
        returnUrl: `${this.successUrl}?provider=paypal&subscriptionId=${sub.id}`,
        cancelUrl: this.cancelUrl,
        payerEmail: user.email,
      });
      await this.prisma.subscription.update({
        where: { id: sub.id },
        data: { paypalSubscriptionId: String(ppSub.id) },
      });
      return { subscriptionId: sub.id, providerRef: ppSub.id, initPoint: ppSub.approveUrl, provider };
    }

    const pre = await this.mp.createPreapproval({
      reason: PLAN_LABELS[plan],
      amount,
      frequency: planFrequency(plan),
      frequencyType: 'months',
      payerEmail: user.email,
      backUrl: this.successUrl,
      externalReference: sub.id,
    });

    if (pre.id) {
      await this.prisma.subscription.update({
        where: { userId },
        data: { mpPreapprovalId: String(pre.id) },
      });
    }

    return { subscriptionId: sub.id, preapprovalId: pre.id, initPoint: pre.init_point, provider };
  }

  // ── MP Webhook ──────────────────────────────────────────────────────────

  async handleWebhook(query: Record<string, string>, body: any) {
    const topic = body?.type || body?.topic || query.type || query.topic;
    const dataId = body?.data?.id || query['data.id'] || query.id;

    this.logger.log(`MP Webhook topic=${topic} id=${dataId}`);

    if (!dataId) return { ok: true };

    if (topic === 'payment') {
      await this.syncPayment(String(dataId));
    } else if (topic === 'preapproval' || topic === 'subscription_preapproval') {
      await this.syncPreapproval(String(dataId));
    }

    return { ok: true };
  }

  async syncPayment(mpPaymentId: string) {
    const mpPayment = await this.mp.getPayment(mpPaymentId);
    if (!mpPayment) return;

    const externalReference = (mpPayment as any).external_reference as string | undefined;
    const status = (mpPayment as any).status as string;

    if (!externalReference) return;

    const payment = await this.prisma.payment.findUnique({ where: { id: externalReference } });
    if (!payment) return;

    const mappedStatus = this.mapMpStatus(status);

    const prevMeta = (payment.mpDetail as any) || {};
    await this.prisma.payment.update({
      where: { id: payment.id },
      data: {
        mpPaymentId: String(mpPaymentId),
        mpStatus: status,
        status: mappedStatus,
        mpDetail: { ...prevMeta, mp: mpPayment } as any,
      },
    });

    if (mappedStatus === 'APPROVED') {
      await this.grantAccessForPayment(payment.id);
    }
  }

  async syncPreapproval(preapprovalId: string) {
    const pre = await this.mp.getPreapproval(preapprovalId);
    if (!pre) return;

    const externalReference = (pre as any).external_reference as string | undefined;
    const status = (pre as any).status as string;

    const sub = externalReference
      ? await this.prisma.subscription.findUnique({ where: { id: externalReference } })
      : await this.prisma.subscription.findUnique({ where: { mpPreapprovalId: preapprovalId } });
    if (!sub) return;

    const mapped =
      status === 'authorized'
        ? 'ACTIVE'
        : status === 'paused'
          ? 'PAUSED'
          : status === 'cancelled'
            ? 'CANCELLED'
            : 'PENDING';

    await this.applySubscriptionStatus(sub.id, sub.userId, mapped, sub.plan as 'SUBSCRIPTION_MONTHLY' | 'SUBSCRIPTION_ANNUAL',{ mpPreapprovalId: String(preapprovalId) });
  }

  // ── PayPal Webhook ──────────────────────────────────────────────────────

  async handlePaypalWebhook(body: any) {
    const eventType = body?.event_type as string;
    const resource = body?.resource || {};
    this.logger.log(`PayPal Webhook event=${eventType}`);

    try {
      if (eventType === 'CHECKOUT.ORDER.APPROVED') {
        const orderId = resource.id;
        if (orderId) await this.capturePaypalOrder(orderId);
      } else if (eventType === 'PAYMENT.CAPTURE.COMPLETED') {
        const orderId = resource.supplementary_data?.related_ids?.order_id || resource.custom_id || resource.invoice_id;
        if (orderId) await this.syncPaypalOrderByOrderId(String(orderId));
      } else if (
        eventType === 'BILLING.SUBSCRIPTION.ACTIVATED' ||
        eventType === 'BILLING.SUBSCRIPTION.CREATED' ||
        eventType === 'BILLING.SUBSCRIPTION.UPDATED' ||
        eventType === 'BILLING.SUBSCRIPTION.CANCELLED' ||
        eventType === 'BILLING.SUBSCRIPTION.EXPIRED' ||
        eventType === 'BILLING.SUBSCRIPTION.SUSPENDED'
      ) {
        const subId = resource.id;
        if (subId) await this.syncPaypalSubscription(String(subId));
      }
    } catch (err) {
      this.logger.error(`PayPal webhook handler error: ${(err as Error).message}`);
    }

    return { ok: true };
  }

  async capturePaypalOrder(orderId: string) {
    const payment = await this.prisma.payment.findUnique({ where: { paypalOrderId: orderId } });
    if (!payment) return;

    try {
      await this.paypal.captureOrder(orderId);
    } catch (err) {
      this.logger.warn(`Capture falló ${orderId}: ${(err as Error).message}`);
    }
    await this.syncPaypalOrderByOrderId(orderId);
  }

  async syncPaypalOrderByOrderId(orderId: string) {
    const payment = await this.prisma.payment.findUnique({ where: { paypalOrderId: orderId } });
    if (!payment) return;
    const order = await this.paypal.getOrder(orderId);
    if (!order) return;

    const status = order.status as string;
    const mapped =
      status === 'COMPLETED' || status === 'APPROVED'
        ? 'APPROVED'
        : status === 'VOIDED'
          ? 'REFUNDED'
          : status === 'PAYER_ACTION_REQUIRED'
            ? 'PENDING'
            : 'PENDING';

    const prev = (payment.mpDetail as any) || {};
    await this.prisma.payment.update({
      where: { id: payment.id },
      data: {
        status: mapped,
        mpStatus: status,
        mpDetail: { ...prev, paypal: order } as any,
      },
    });

    if (mapped === 'APPROVED') {
      await this.grantAccessForPayment(payment.id);
    }
  }

  async syncPaypalSubscription(paypalSubId: string) {
    const sub = await this.prisma.subscription.findUnique({ where: { paypalSubscriptionId: paypalSubId } });
    if (!sub) return;
    const info = await this.paypal.getSubscription(paypalSubId);
    if (!info) return;

    const status = info.status as string;
    const mapped =
      status === 'ACTIVE'
        ? 'ACTIVE'
        : status === 'SUSPENDED'
          ? 'PAUSED'
          : status === 'CANCELLED' || status === 'EXPIRED'
            ? 'CANCELLED'
            : 'PENDING';

    await this.applySubscriptionStatus(sub.id, sub.userId, mapped, sub.plan as 'SUBSCRIPTION_MONTHLY' | 'SUBSCRIPTION_ANNUAL',{ paypalSubscriptionId: paypalSubId });
  }

  // ── Common helpers ──────────────────────────────────────────────────────

  private mapMpStatus(status: string) {
    return status === 'approved'
      ? 'APPROVED'
      : status === 'rejected'
        ? 'REJECTED'
        : status === 'refunded'
          ? 'REFUNDED'
          : status === 'in_process'
            ? 'IN_PROCESS'
            : 'PENDING';
  }

  private async applySubscriptionStatus(
    subId: string,
    userId: string,
    mapped: 'ACTIVE' | 'PAUSED' | 'CANCELLED' | 'PENDING',
    plan: 'SUBSCRIPTION_MONTHLY' | 'SUBSCRIPTION_ANNUAL',
    extra: { mpPreapprovalId?: string; paypalSubscriptionId?: string } = {},
  ) {
    const current = await this.prisma.subscription.findUnique({ where: { id: subId } });
    if (!current) return;

    const now = new Date();
    const monthsAhead = plan === 'SUBSCRIPTION_ANNUAL' ? 12 : 1;
    const periodEnd = new Date(now);
    periodEnd.setMonth(periodEnd.getMonth() + monthsAhead);

    await this.prisma.subscription.update({
      where: { id: subId },
      data: {
        ...extra,
        status: mapped,
        currentPeriodStart: mapped === 'ACTIVE' ? now : current.currentPeriodStart,
        currentPeriodEnd: mapped === 'ACTIVE' ? periodEnd : current.currentPeriodEnd,
        cancelledAt: mapped === 'CANCELLED' ? now : current.cancelledAt,
      },
    });

    if (mapped === 'ACTIVE' && current.status !== 'ACTIVE') {
      const user = await this.prisma.user.findUnique({ where: { id: userId }, select: { email: true, firstName: true } });
      if (user) this.mail.send(user.email, 'subscriptionActivated', { firstName: user.firstName }).catch(() => {});
    }
  }

  @Cron(CronExpression.EVERY_HOUR)
  async syncActiveSubscriptions() {
    const subs = await this.prisma.subscription.findMany({
      where: {
        status: { in: ['ACTIVE', 'PENDING', 'PAUSED'] },
        OR: [
          { mpPreapprovalId: { not: null } },
          { paypalSubscriptionId: { not: null } },
        ],
      },
      select: { mpPreapprovalId: true, paypalSubscriptionId: true, provider: true },
    });
    for (const s of subs) {
      try {
        if (s.provider === 'PAYPAL' && s.paypalSubscriptionId) {
          await this.syncPaypalSubscription(s.paypalSubscriptionId);
        } else if (s.mpPreapprovalId) {
          await this.syncPreapproval(s.mpPreapprovalId);
        }
      } catch (err) {
        this.logger.warn(`Sync falló: ${(err as Error).message}`);
      }
    }
  }

  private async notifyPaymentApproved(userId: string, amount: number) {
    const user = await this.prisma.user.findUnique({ where: { id: userId }, select: { email: true, firstName: true } });
    if (user) this.mail.send(user.email, 'paymentApproved', { firstName: user.firstName, amount: amount.toLocaleString('es-AR') }).catch(() => {});
  }

  private async grantAccessForPayment(paymentId: string) {
    const payment = await this.prisma.payment.findUnique({ where: { id: paymentId } });
    if (!payment) return;

    const alreadyPurchased = await this.prisma.purchase.findUnique({ where: { paymentId } });
    if (alreadyPurchased) return;

    if (payment.type === 'ONE_TIME_COURSE' || payment.type === 'ONE_TIME_CATEGORY') {
      const detail = (payment.mpDetail as any) || {};
      const courseId = detail.courseId as string | undefined;
      const categoryId = detail.categoryId as string | undefined;

      if (payment.type === 'ONE_TIME_COURSE' && !courseId) return;
      if (payment.type === 'ONE_TIME_CATEGORY' && !categoryId) return;

      await this.prisma.purchase.create({
        data: {
          userId: payment.userId,
          courseId: courseId || null,
          categoryId: categoryId || null,
          paymentId: payment.id,
        },
      });
      if (payment.couponCode) await this.couponsSvc.incrementUsage(payment.couponCode);
      this.notifyPaymentApproved(payment.userId, Number(payment.amount));
    }
  }

  async syncPaypalSubscriptionById(subscriptionId: string) {
    const sub = await this.prisma.subscription.findUnique({ where: { id: subscriptionId } });
    if (!sub) throw new NotFoundException('Suscripción no encontrada');

    if (sub.paypalSubscriptionId) {
      // Sync with PayPal API
      try {
        await this.syncPaypalSubscription(sub.paypalSubscriptionId);
      } catch (err) {
        this.logger.warn(`PayPal sync failed: ${(err as Error).message}`);
      }
    }

    // Re-read updated subscription
    const updated = await this.prisma.subscription.findUnique({ where: { id: subscriptionId } });
    if (!updated) throw new NotFoundException('Suscripción no encontrada');

    const final = await this.prisma.subscription.findUnique({ where: { id: subscriptionId } });
    return { id: final!.id, status: final!.status, plan: final!.plan };
  }

  async capturePaypalByPaymentId(paymentId: string) {
    const payment = await this.prisma.payment.findUnique({ where: { id: paymentId } });
    if (!payment) throw new NotFoundException('Pago no encontrado');
    if (!payment.paypalOrderId) throw new BadRequestException('No es un pago de PayPal');
    if (payment.status === 'APPROVED') return { id: payment.id, status: 'APPROVED' };

    try {
      await this.paypal.captureOrder(payment.paypalOrderId);
    } catch (err) {
      this.logger.warn(`Capture falló: ${(err as Error).message}`);
    }
    await this.syncPaypalOrderByOrderId(payment.paypalOrderId);
    const updated = await this.prisma.payment.findUnique({ where: { id: paymentId } });
    return { id: updated!.id, status: updated!.status, amount: updated!.amount, currency: updated!.currency };
  }

  async simulateApprove(paymentId: string) {
    const payment = await this.prisma.payment.findUnique({ where: { id: paymentId } });
    if (!payment) throw new NotFoundException('Pago no encontrado');

    await this.prisma.payment.update({
      where: { id: paymentId },
      data: { status: 'APPROVED', mpStatus: 'approved', mpPaymentId: `sim-${Date.now()}` },
    });
    await this.grantAccessForPayment(paymentId);

    return this.prisma.payment.findUnique({ where: { id: paymentId } });
  }

  async simulateActivateSubscription(subscriptionId: string) {
    const sub = await this.prisma.subscription.findUnique({ where: { id: subscriptionId } });
    if (!sub) throw new NotFoundException('Suscripción no encontrada');

    const now = new Date();
    const monthsAhead = sub.plan === 'SUBSCRIPTION_ANNUAL' ? 12 : 1;
    const end = new Date(now);
    end.setMonth(end.getMonth() + monthsAhead);

    return this.prisma.subscription.update({
      where: { id: subscriptionId },
      data: { status: 'ACTIVE', currentPeriodStart: now, currentPeriodEnd: end },
    });
  }

  async getPayment(userId: string, paymentId: string) {
    const payment = await this.prisma.payment.findFirst({ where: { id: paymentId, userId } });
    if (!payment) throw new NotFoundException('Pago no encontrado');
    return {
      id: payment.id,
      status: payment.status,
      type: payment.type,
      amount: payment.amount,
      currency: payment.currency,
      provider: payment.provider,
      createdAt: payment.createdAt,
    };
  }
}
