import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class SubscriptionsService {
  constructor(private prisma: PrismaService) {}

  async getCurrent(userId: string) {
    const sub = await this.prisma.subscription.findUnique({ where: { userId } });
    if (!sub) return null;
    const now = new Date();
    const periodValid = !!sub.currentPeriodEnd && sub.currentPeriodEnd > now;
    const isActive =
      (sub.status === 'ACTIVE' && (!sub.currentPeriodEnd || sub.currentPeriodEnd > now)) ||
      (sub.status === 'CANCELLED' && periodValid);
    return {
      id: sub.id,
      plan: sub.plan,
      status: sub.status,
      isActive,
      isCancelled: sub.status === 'CANCELLED',
      accessUntil: sub.status === 'CANCELLED' && periodValid ? sub.currentPeriodEnd : null,
      currentPeriodStart: sub.currentPeriodStart,
      currentPeriodEnd: sub.currentPeriodEnd,
      cancelledAt: sub.cancelledAt,
    };
  }

  async cancel(userId: string) {
    const sub = await this.prisma.subscription.findUnique({ where: { userId } });
    if (!sub) throw new NotFoundException('No tenés suscripción');
    return this.prisma.subscription.update({
      where: { userId },
      data: { status: 'CANCELLED', cancelledAt: new Date() },
    });
  }
}
