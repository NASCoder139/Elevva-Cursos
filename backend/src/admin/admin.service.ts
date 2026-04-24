import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCourseDto, UpdateCourseDto } from './dto/course.dto';
import { CreateModuleDto, UpdateModuleDto } from './dto/module.dto';
import { CreateLessonDto, UpdateLessonDto } from './dto/lesson.dto';
import { CreateCategoryDto, UpdateCategoryDto } from './dto/category.dto';
import { UpdateUserDto } from './dto/user.dto';

@Injectable()
export class AdminService {
  constructor(private prisma: PrismaService) {}

  // ─── Stats ───────────────────────────────────────────────────────────────
  async getStats(days = 30) {
    const dateFrom = new Date();
    dateFrom.setDate(dateFrom.getDate() - days);

    const [
      totalUsers,
      totalCourses,
      publishedCourses,
      totalLessons,
      activeSubs,
      approvedPayments,
      revenueAgg,
      recentPayments,
      recentUsers,
    ] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.course.count(),
      this.prisma.course.count({ where: { isPublished: true } }),
      this.prisma.lesson.count(),
      this.prisma.subscription.count({ where: { status: 'ACTIVE' } }),
      this.prisma.payment.count({ where: { status: 'APPROVED', createdAt: { gte: dateFrom } } }),
      this.prisma.payment.aggregate({ _sum: { amount: true }, where: { status: 'APPROVED', createdAt: { gte: dateFrom } } }),
      this.prisma.payment.findMany({
        orderBy: { createdAt: 'desc' },
        take: 10,
        include: { user: { select: { email: true, firstName: true, lastName: true } } },
      }),
      this.prisma.user.findMany({
        orderBy: { createdAt: 'desc' },
        take: 10,
        select: { id: true, email: true, firstName: true, lastName: true, createdAt: true, role: true },
      }),
    ]);

    // Revenue chart by day
    const paymentsByDay = await this.prisma.payment.findMany({
      where: { status: 'APPROVED', createdAt: { gte: dateFrom } },
      select: { amount: true, createdAt: true },
    });

    const revenueByDay: Record<string, number> = {};
    for (let i = 0; i < days; i++) {
      const d = new Date();
      d.setDate(d.getDate() - (days - 1 - i));
      revenueByDay[d.toISOString().slice(0, 10)] = 0;
    }
    for (const p of paymentsByDay) {
      const key = p.createdAt.toISOString().slice(0, 10);
      revenueByDay[key] = (revenueByDay[key] || 0) + Number(p.amount);
    }
    const chart = Object.entries(revenueByDay)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, revenue]) => ({ date, revenue }));

    // Payments by provider (within date range)
    const [mpTotal, ppTotal, totalPayments, pendingPayments, rejectedPayments] = await Promise.all([
      this.prisma.payment.aggregate({ _sum: { amount: true }, where: { status: 'APPROVED', provider: 'MERCADOPAGO', createdAt: { gte: dateFrom } } }),
      this.prisma.payment.aggregate({ _sum: { amount: true }, where: { status: 'APPROVED', provider: 'PAYPAL', createdAt: { gte: dateFrom } } }),
      this.prisma.payment.count({ where: { createdAt: { gte: dateFrom } } }),
      this.prisma.payment.count({ where: { status: 'PENDING', createdAt: { gte: dateFrom } } }),
      this.prisma.payment.count({ where: { status: 'REJECTED', createdAt: { gte: dateFrom } } }),
    ]);

    // Users last 7 days
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const newUsersWeek = await this.prisma.user.count({ where: { createdAt: { gte: sevenDaysAgo } } });

    // Users by day (last 7 days)
    const usersLast7 = await this.prisma.user.findMany({
      where: { createdAt: { gte: sevenDaysAgo } },
      select: { createdAt: true },
    });
    const usersByDay: Record<string, number> = {};
    for (let i = 0; i < 7; i++) {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i));
      usersByDay[d.toISOString().slice(0, 10)] = 0;
    }
    for (const u of usersLast7) {
      const key = u.createdAt.toISOString().slice(0, 10);
      if (key in usersByDay) usersByDay[key]++;
    }
    const usersChart = Object.entries(usersByDay)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, count]) => {
        const d = new Date(date + 'T12:00:00');
        const dayNames = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
        return { date, day: dayNames[d.getDay()], count };
      });

    // ── Popular courses (by purchases + revenue) ──
    const purchasesWithCourse = await this.prisma.purchase.findMany({
      where: { courseId: { not: null }, createdAt: { gte: dateFrom } },
      select: {
        courseId: true,
        payment: { select: { amount: true, status: true } },
      },
    });
    const courseMap: Record<string, { enrollments: number; revenue: number }> = {};
    for (const p of purchasesWithCourse) {
      if (!p.courseId) continue;
      if (!courseMap[p.courseId]) courseMap[p.courseId] = { enrollments: 0, revenue: 0 };
      courseMap[p.courseId].enrollments++;
      if (p.payment.status === 'APPROVED') {
        courseMap[p.courseId].revenue += Number(p.payment.amount);
      }
    }
    // Also count subscriptions as enrollments via lesson progress
    const subEnrollments = await this.prisma.lessonProgress.findMany({
      where: { lastWatchedAt: { gte: dateFrom } },
      select: { lesson: { select: { module: { select: { courseId: true } } } } },
    });
    for (const lp of subEnrollments) {
      const cid = lp.lesson.module.courseId;
      if (!courseMap[cid]) courseMap[cid] = { enrollments: 0, revenue: 0 };
    }
    const courseIds = Object.keys(courseMap);
    const courses = courseIds.length > 0
      ? await this.prisma.course.findMany({
          where: { id: { in: courseIds } },
          select: { id: true, title: true, thumbnailUrl: true },
        })
      : [];
    const courseNameMap = Object.fromEntries(courses.map((c) => [c.id, c]));
    const popularCourses = Object.entries(courseMap)
      .map(([id, data]) => ({
        id,
        title: courseNameMap[id]?.title || 'Curso eliminado',
        thumbnailUrl: courseNameMap[id]?.thumbnailUrl || null,
        enrollments: data.enrollments,
        revenue: data.revenue,
      }))
      .sort((a, b) => b.enrollments - a.enrollments || b.revenue - a.revenue)
      .slice(0, 10);

    // ── Users by country ──
    const allUsers = await this.prisma.user.findMany({
      select: { country: true },
    });
    const countryMap: Record<string, number> = {};
    for (const u of allUsers) {
      const c = u.country || 'Sin definir';
      countryMap[c] = (countryMap[c] || 0) + 1;
    }
    const usersByCountry = Object.entries(countryMap)
      .map(([country, count]) => ({ country, count }))
      .sort((a, b) => b.count - a.count);

    return {
      totals: {
        users: totalUsers,
        courses: totalCourses,
        publishedCourses,
        lessons: totalLessons,
        activeSubs,
        approvedPayments,
        revenue: Number(revenueAgg._sum.amount || 0),
      },
      chart,
      paymentsByProvider: {
        mercadopago: Number(mpTotal._sum.amount || 0),
        paypal: Number(ppTotal._sum.amount || 0),
      },
      paymentStats: {
        total: totalPayments,
        approved: approvedPayments,
        pending: pendingPayments,
        rejected: rejectedPayments,
      },
      newUsersWeek,
      usersChart,
      recentPayments,
      recentUsers,
      popularCourses,
      usersByCountry,
    };
  }

  // ─── Courses ─────────────────────────────────────────────────────────────
  async listCourses(q?: string) {
    return this.prisma.course.findMany({
      where: q
        ? { OR: [{ title: { contains: q, mode: 'insensitive' } }, { slug: { contains: q, mode: 'insensitive' } }] }
        : undefined,
      orderBy: { createdAt: 'desc' },
      include: { category: { select: { id: true, name: true, slug: true } }, _count: { select: { modules: true } } },
    });
  }

  async getCourse(id: string) {
    const course = await this.prisma.course.findUnique({
      where: { id },
      include: {
        category: true,
        modules: {
          orderBy: { sortOrder: 'asc' },
          include: { lessons: { orderBy: { sortOrder: 'asc' } } },
        },
      },
    });
    if (!course) throw new NotFoundException('Curso no encontrado');
    return course;
  }

  async createCourse(dto: CreateCourseDto) {
    const exists = await this.prisma.course.findUnique({ where: { slug: dto.slug } });
    if (exists) throw new BadRequestException('Slug ya existe');
    return this.prisma.course.create({ data: dto });
  }

  async updateCourse(id: string, dto: UpdateCourseDto) {
    await this.getCourse(id);
    if (dto.slug) {
      const exists = await this.prisma.course.findFirst({ where: { slug: dto.slug, NOT: { id } } });
      if (exists) throw new BadRequestException('Slug ya existe');
    }
    return this.prisma.course.update({ where: { id }, data: dto });
  }

  async deleteCourse(id: string) {
    await this.getCourse(id);
    await this.prisma.course.delete({ where: { id } });
    return { ok: true };
  }

  private async recalcCourseAggregates(courseId: string) {
    const lessons = await this.prisma.lesson.findMany({
      where: { module: { courseId } },
      select: { durationSeconds: true },
    });
    const lessonCount = lessons.length;
    const totalSec = lessons.reduce((a, l) => a + (l.durationSeconds || 0), 0);
    const durationMins = Math.round(totalSec / 60);
    await this.prisma.course.update({ where: { id: courseId }, data: { lessonCount, durationMins } });
  }

  // ─── Modules ─────────────────────────────────────────────────────────────
  async createModule(dto: CreateModuleDto) {
    const course = await this.prisma.course.findUnique({ where: { id: dto.courseId } });
    if (!course) throw new NotFoundException('Curso no encontrado');
    const sortOrder = dto.sortOrder ?? (await this.prisma.module.count({ where: { courseId: dto.courseId } }));
    return this.prisma.module.create({ data: { ...dto, sortOrder } });
  }

  async updateModule(id: string, dto: UpdateModuleDto) {
    const mod = await this.prisma.module.findUnique({ where: { id } });
    if (!mod) throw new NotFoundException('Módulo no encontrado');
    return this.prisma.module.update({ where: { id }, data: dto });
  }

  async deleteModule(id: string) {
    const mod = await this.prisma.module.findUnique({ where: { id } });
    if (!mod) throw new NotFoundException('Módulo no encontrado');
    await this.prisma.module.delete({ where: { id } });
    await this.recalcCourseAggregates(mod.courseId);
    return { ok: true };
  }

  // ─── Lessons ─────────────────────────────────────────────────────────────
  async createLesson(dto: CreateLessonDto) {
    const mod = await this.prisma.module.findUnique({ where: { id: dto.moduleId } });
    if (!mod) throw new NotFoundException('Módulo no encontrado');
    const sortOrder = dto.sortOrder ?? (await this.prisma.lesson.count({ where: { moduleId: dto.moduleId } }));
    const lesson = await this.prisma.lesson.create({ data: { ...dto, sortOrder } });
    await this.recalcCourseAggregates(mod.courseId);
    return lesson;
  }

  async updateLesson(id: string, dto: UpdateLessonDto) {
    const lesson = await this.prisma.lesson.findUnique({ where: { id }, include: { module: true } });
    if (!lesson) throw new NotFoundException('Lección no encontrada');
    const updated = await this.prisma.lesson.update({ where: { id }, data: dto });
    if (dto.durationSeconds !== undefined) await this.recalcCourseAggregates(lesson.module.courseId);
    return updated;
  }

  async deleteLesson(id: string) {
    const lesson = await this.prisma.lesson.findUnique({ where: { id }, include: { module: true } });
    if (!lesson) throw new NotFoundException('Lección no encontrada');
    await this.prisma.lesson.delete({ where: { id } });
    await this.recalcCourseAggregates(lesson.module.courseId);
    return { ok: true };
  }

  // ─── Categories ──────────────────────────────────────────────────────────
  async listCategories() {
    return this.prisma.category.findMany({
      orderBy: { sortOrder: 'asc' },
      include: { _count: { select: { courses: true } } },
    });
  }

  async createCategory(dto: CreateCategoryDto) {
    const exists = await this.prisma.category.findFirst({
      where: { OR: [{ slug: dto.slug }, { name: dto.name }] },
    });
    if (exists) throw new BadRequestException('Nombre o slug ya existe');
    return this.prisma.category.create({ data: dto });
  }

  async updateCategory(id: string, dto: UpdateCategoryDto) {
    const cat = await this.prisma.category.findUnique({ where: { id } });
    if (!cat) throw new NotFoundException('Categoría no encontrada');
    return this.prisma.category.update({ where: { id }, data: dto });
  }

  async deleteCategory(id: string) {
    const count = await this.prisma.course.count({ where: { categoryId: id } });
    if (count > 0) throw new BadRequestException('No se puede eliminar: tiene cursos asociados');
    await this.prisma.category.delete({ where: { id } });
    return { ok: true };
  }

  // ─── Users ───────────────────────────────────────────────────────────────
  async listUsers(q?: string) {
    return this.prisma.user.findMany({
      where: q
        ? {
            OR: [
              { email: { contains: q, mode: 'insensitive' } },
              { firstName: { contains: q, mode: 'insensitive' } },
              { lastName: { contains: q, mode: 'insensitive' } },
            ],
          }
        : undefined,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        avatarUrl: true,
        country: true,
        role: true,
        isEmailVerified: true,
        createdAt: true,
        updatedAt: true,
        subscription: { select: { status: true, plan: true, currentPeriodEnd: true } },
        _count: { select: { purchases: true, favorites: true, payments: true } },
      },
    });
  }

  async getUserDetail(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: {
        subscription: true,
        payments: {
          orderBy: { createdAt: 'desc' },
          include: {
            purchase: {
              include: {
                course: { select: { id: true, title: true, thumbnailUrl: true } },
                category: { select: { id: true, name: true } },
              },
            },
          },
        },
      },
    });
    if (!user) throw new NotFoundException('Usuario no encontrado');

    const approved = user.payments.filter((p) => p.status === 'APPROVED');
    const totalSpent = approved.reduce((s, p) => s + Number(p.amount), 0);
    const courseCount = approved.filter(
      (p) => p.type === 'ONE_TIME_COURSE' || p.type === 'ONE_TIME_CATEGORY',
    ).length;
    const subscriptionCount = approved.filter(
      (p) => p.type === 'SUBSCRIPTION_MONTHLY' || p.type === 'SUBSCRIPTION_ANNUAL',
    ).length;
    const daysAsCustomer = Math.max(
      0,
      Math.floor((Date.now() - new Date(user.createdAt).getTime()) / (1000 * 60 * 60 * 24)),
    );

    const {
      passwordHash: _p,
      refreshTokenHash: _r,
      passwordResetToken: _t,
      passwordResetExpiry: _e,
      ...safe
    } = user;

    return {
      ...safe,
      stats: {
        totalSpent,
        courseCount,
        subscriptionCount,
        daysAsCustomer,
        paymentCount: user.payments.length,
        approvedCount: approved.length,
      },
    };
  }

  async updateUser(id: string, dto: UpdateUserDto) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException('Usuario no encontrado');
    return this.prisma.user.update({
      where: { id },
      data: dto,
      select: { id: true, email: true, firstName: true, lastName: true, role: true },
    });
  }

  async deleteUser(id: string) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException('Usuario no encontrado');

    await this.prisma.$transaction([
      this.prisma.userInterest.deleteMany({ where: { userId: id } }),
      this.prisma.lessonProgress.deleteMany({ where: { userId: id } }),
      this.prisma.favorite.deleteMany({ where: { userId: id } }),
      this.prisma.purchase.deleteMany({ where: { userId: id } }),
      this.prisma.payment.deleteMany({ where: { userId: id } }),
      this.prisma.subscription.deleteMany({ where: { userId: id } }),
      this.prisma.demoSession.deleteMany({ where: { userId: id } }),
      this.prisma.user.delete({ where: { id } }),
    ]);

    return { ok: true };
  }

  // ─── Payments ────────────────────────────────────────────────────────────
  async listPayments(status?: string) {
    return this.prisma.payment.findMany({
      where: status ? { status: status as any } : undefined,
      orderBy: { createdAt: 'desc' },
      take: 200,
      include: {
        user: { select: { email: true, firstName: true, lastName: true } },
        purchase: { include: { course: { select: { title: true } }, category: { select: { name: true } } } },
      },
    });
  }

  // ─── Interests & Tags ────────────────────────────────────────────────────
  async listInterests() {
    return this.prisma.interest.findMany({ orderBy: { name: 'asc' } });
  }

  async createInterest(name: string, slug: string, icon?: string) {
    return this.prisma.interest.create({ data: { name, slug, icon } });
  }

  async deleteInterest(id: string) {
    await this.prisma.userInterest.deleteMany({ where: { interestId: id } });
    await this.prisma.interest.delete({ where: { id } });
    return { ok: true };
  }

  async listTags() {
    return this.prisma.tag.findMany({ orderBy: { name: 'asc' } });
  }

  async createTag(name: string, slug: string) {
    return this.prisma.tag.create({ data: { name, slug } });
  }

  async deleteTag(id: string) {
    await this.prisma.courseTag.deleteMany({ where: { tagId: id } });
    await this.prisma.tag.delete({ where: { id } });
    return { ok: true };
  }
}
