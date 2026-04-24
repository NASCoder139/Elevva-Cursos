import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async findById(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        avatarUrl: true,
        role: true,
        isEmailVerified: true,
        createdAt: true,
      },
    });
    if (!user) throw new NotFoundException('Usuario no encontrado');
    return user;
  }

  async findByEmail(email: string) {
    return this.prisma.user.findUnique({ where: { email } });
  }

  async getProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        avatarUrl: true,
        role: true,
        isEmailVerified: true,
        createdAt: true,
        interests: { include: { interest: true } },
      },
    });
    if (!user) throw new NotFoundException('Usuario no encontrado');
    return {
      ...user,
      interests: user.interests.map((ui) => ui.interest),
    };
  }

  async updateProfile(userId: string, data: { firstName?: string; lastName?: string }) {
    return this.prisma.user.update({
      where: { id: userId },
      data,
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        avatarUrl: true,
        role: true,
        isEmailVerified: true,
        createdAt: true,
      },
    });
  }

  async changePassword(userId: string, currentPassword: string, newPassword: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException();
    const isValid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!isValid) throw new BadRequestException('Contraseña actual incorrecta');
    const hash = await bcrypt.hash(newPassword, 12);
    await this.prisma.user.update({ where: { id: userId }, data: { passwordHash: hash } });
    return { message: 'Contraseña actualizada' };
  }

  async updateInterests(userId: string, interestIds: string[]) {
    await this.prisma.$transaction([
      this.prisma.userInterest.deleteMany({ where: { userId } }),
      ...interestIds.map((interestId) =>
        this.prisma.userInterest.create({ data: { userId, interestId } }),
      ),
    ]);
    return this.getProfile(userId);
  }

  async getInterests() {
    return this.prisma.interest.findMany({ orderBy: { name: 'asc' } });
  }

  async getAccess(userId: string) {
    // Check if user is admin — full access
    const user = await this.prisma.user.findUnique({ where: { id: userId }, select: { role: true } });
    const isAdmin = user?.role === 'ADMIN';

    // Check active subscription
    const sub = await this.prisma.subscription.findUnique({ where: { userId } });
    const now = new Date();
    const hasSubscription = isAdmin ||
      (sub?.status === 'ACTIVE' && (!sub.currentPeriodEnd || sub.currentPeriodEnd > now)) ||
      (sub?.status === 'CANCELLED' && !!sub.currentPeriodEnd && sub.currentPeriodEnd > now);

    // Get individual purchases
    const purchases = await this.prisma.purchase.findMany({
      where: { userId },
      select: { courseId: true, categoryId: true },
    });

    const purchasedCourseIds = purchases
      .filter((p) => p.courseId)
      .map((p) => p.courseId as string);

    const purchasedCategoryIds = purchases
      .filter((p) => p.categoryId)
      .map((p) => p.categoryId as string);

    // Get course IDs from purchased categories
    let categoryCourseIds: string[] = [];
    if (purchasedCategoryIds.length > 0) {
      const categoryCourses = await this.prisma.course.findMany({
        where: { categoryId: { in: purchasedCategoryIds }, isPublished: true },
        select: { id: true },
      });
      categoryCourseIds = categoryCourses.map((c) => c.id);
    }

    // All accessible course IDs (deduped)
    const accessibleCourseIds = [...new Set([...purchasedCourseIds, ...categoryCourseIds])];

    // Get the actual courses with details for "Mis Cursos"
    let myCourses: any[] = [];
    if (hasSubscription) {
      myCourses = await this.prisma.course.findMany({
        where: { isPublished: true },
        include: { category: true },
        orderBy: { createdAt: 'desc' },
      });
    } else if (accessibleCourseIds.length > 0) {
      myCourses = await this.prisma.course.findMany({
        where: { id: { in: accessibleCourseIds }, isPublished: true },
        include: { category: true },
        orderBy: { createdAt: 'desc' },
      });
    }

    return {
      hasSubscription,
      subscriptionPlan: sub?.plan ?? (isAdmin ? 'ADMIN' : null),
      purchasedCourseIds,
      purchasedCategoryIds,
      accessibleCourseIds: hasSubscription ? 'ALL' : accessibleCourseIds,
      myCourses,
    };
  }
}
