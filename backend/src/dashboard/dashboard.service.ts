import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DashboardService {
  constructor(private prisma: PrismaService) {}

  async getDashboard(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { interests: { include: { interest: true } } },
    });

    // Continue watching: últimos 6 cursos con progreso no completado
    const recentProgress = await this.prisma.lessonProgress.findMany({
      where: { userId },
      orderBy: { lastWatchedAt: 'desc' },
      take: 30,
      include: {
        lesson: {
          include: {
            module: {
              include: {
                course: {
                  include: {
                    category: { select: { id: true, name: true, slug: true } },
                  },
                },
              },
            },
          },
        },
      },
    });

    const seenCourseIds = new Set<string>();
    const continueWatching: any[] = [];
    for (const p of recentProgress) {
      const course = p.lesson.module.course;
      if (seenCourseIds.has(course.id)) continue;
      seenCourseIds.add(course.id);

      const [totalLessons, completedLessons] = await Promise.all([
        this.prisma.lesson.count({ where: { module: { courseId: course.id } } }),
        this.prisma.lessonProgress.count({
          where: { userId, isCompleted: true, lesson: { module: { courseId: course.id } } },
        }),
      ]);

      continueWatching.push({
        ...course,
        lastLessonId: p.lessonId,
        lastLessonTitle: p.lesson.title,
        progressPercent: totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0,
        completedLessons,
        totalLessons,
      });

      if (continueWatching.length >= 6) break;
    }

    // Recomendados: cursos publicados que el user no empezó, priorizando categorías de sus intereses (fallback: featured).
    const interestedCategoryIds: string[] = []; // Los intereses aún no linkean directo a categorías — dejamos vacío por ahora.

    const recommended = await this.prisma.course.findMany({
      where: {
        isPublished: true,
        id: { notIn: Array.from(seenCourseIds) },
        ...(interestedCategoryIds.length > 0 && { categoryId: { in: interestedCategoryIds } }),
      },
      orderBy: [{ isFeatured: 'desc' }, { sortOrder: 'asc' }],
      take: 8,
      include: {
        category: { select: { id: true, name: true, slug: true } },
        favorites: { where: { userId }, select: { id: true } },
      },
    });

    const recommendedData = recommended.map((c) => ({
      ...c,
      isFavorited: c.favorites.length > 0,
      favorites: undefined,
    }));

    // Stats
    const [totalCompletedLessons, totalFavorites] = await Promise.all([
      this.prisma.lessonProgress.count({ where: { userId, isCompleted: true } }),
      this.prisma.favorite.count({ where: { userId } }),
    ]);

    const totalMinutes = await this.prisma.lessonProgress.aggregate({
      where: { userId },
      _sum: { watchedSeconds: true },
    });

    // ── Daily activity for last 7 days ──
    const now = new Date();
    const sevenDaysAgo = new Date(now);
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
    sevenDaysAgo.setHours(0, 0, 0, 0);

    const recentActivity = await this.prisma.lessonProgress.findMany({
      where: {
        userId,
        lastWatchedAt: { gte: sevenDaysAgo },
      },
      select: {
        watchedSeconds: true,
        isCompleted: true,
        lastWatchedAt: true,
      },
    });

    // Group by date
    const dayNames = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
    const dailyMap = new Map<string, { minutes: number; lessonsCompleted: number }>();

    for (let i = 0; i < 7; i++) {
      const d = new Date(sevenDaysAgo);
      d.setDate(d.getDate() + i);
      const key = d.toISOString().slice(0, 10);
      dailyMap.set(key, { minutes: 0, lessonsCompleted: 0 });
    }

    for (const entry of recentActivity) {
      if (!entry.lastWatchedAt) continue;
      const key = entry.lastWatchedAt.toISOString().slice(0, 10);
      const existing = dailyMap.get(key);
      if (existing) {
        existing.minutes += Math.round(entry.watchedSeconds / 60);
        if (entry.isCompleted) existing.lessonsCompleted += 1;
      }
    }

    const dailyActivity = Array.from(dailyMap.entries()).map(([dateStr, val]) => {
      const date = new Date(dateStr + 'T12:00:00');
      return {
        date: dateStr,
        day: dayNames[date.getDay()],
        minutes: val.minutes,
        lessonsCompleted: val.lessonsCompleted,
      };
    });

    // Cumulative progress for the chart
    let cumulative = 0;
    const progressByDay = dailyActivity.map((d) => {
      cumulative += d.lessonsCompleted;
      return { ...d, cumulativeLessons: cumulative };
    });

    return {
      user: {
        firstName: user?.firstName,
        lastName: user?.lastName,
      },
      stats: {
        completedLessons: totalCompletedLessons,
        favorites: totalFavorites,
        watchedMinutes: Math.round((totalMinutes._sum.watchedSeconds || 0) / 60),
        coursesInProgress: continueWatching.length,
      },
      dailyActivity: progressByDay,
      continueWatching,
      recommended: recommendedData,
    };
  }
}
