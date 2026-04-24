import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { DemoService } from './demo.service';

export type AccessReason = 'ADMIN' | 'SUBSCRIPTION' | 'PURCHASE_COURSE' | 'PURCHASE_CATEGORY' | 'DEMO' | 'FREE_PREVIEW';

export interface AccessResult {
  allowed: boolean;
  reason: AccessReason | null;
}

@Injectable()
export class LessonAccessService {
  constructor(
    private prisma: PrismaService,
    private demo: DemoService,
  ) {}

  async checkLessonAccess(userId: string | null | undefined, lessonId: string): Promise<AccessResult> {
    const lesson = await this.prisma.lesson.findUnique({
      where: { id: lessonId },
      include: { module: { include: { course: true } } },
    });
    if (!lesson) return { allowed: false, reason: null };
    if (lesson.isFreePreview) return { allowed: true, reason: 'FREE_PREVIEW' };
    if (!userId) return { allowed: false, reason: null };

    const user = await this.prisma.user.findUnique({ where: { id: userId }, select: { role: true } });
    if (user?.role === 'ADMIN') return { allowed: true, reason: 'ADMIN' };

    const courseId = lesson.module.courseId;
    const categoryId = lesson.module.course.categoryId;

    const sub = await this.prisma.subscription.findUnique({ where: { userId } });
    if (sub && sub.currentPeriodEnd && sub.currentPeriodEnd > new Date()) {
      if (sub.status === 'ACTIVE' || sub.status === 'CANCELLED') {
        return { allowed: true, reason: 'SUBSCRIPTION' };
      }
    }
    if (sub && sub.status === 'ACTIVE' && !sub.currentPeriodEnd) {
      return { allowed: true, reason: 'SUBSCRIPTION' };
    }

    const coursePurchase = await this.prisma.purchase.findFirst({
      where: { userId, courseId },
    });
    if (coursePurchase) return { allowed: true, reason: 'PURCHASE_COURSE' };

    if (categoryId) {
      const catPurchase = await this.prisma.purchase.findFirst({
        where: { userId, categoryId },
      });
      if (catPurchase) return { allowed: true, reason: 'PURCHASE_CATEGORY' };
    }

    if (await this.demo.isDemoActive(userId)) {
      return { allowed: true, reason: 'DEMO' };
    }

    return { allowed: false, reason: null };
  }
}
