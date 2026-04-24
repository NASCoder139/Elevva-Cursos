import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CourseFilterDto } from './dto/course-filter.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class CoursesService {
  constructor(private prisma: PrismaService) {}

  async findAll(filters: CourseFilterDto, userId?: string) {
    const page = filters.page || 1;
    const limit = filters.limit || 20;
    const skip = (page - 1) * limit;

    const where: Prisma.CourseWhereInput = { isPublished: true };

    // En el dashboard de alumnos (/app/catalog, /shop) se ocultan los cursos
    // marcados como no visibles. La tienda pública y "Mis cursos" siguen sin filtrar por este flag.
    if (filters.studentView) {
      where.isVisibleToStudents = true;
    }

    if (filters.category) {
      where.category = { slug: filters.category };
    }
    if (filters.search) {
      where.OR = [
        { title: { contains: filters.search, mode: 'insensitive' } },
        { description: { contains: filters.search, mode: 'insensitive' } },
      ];
    }
    if (filters.tag) {
      where.tags = { some: { tag: { slug: filters.tag } } };
    }

    let orderBy: Prisma.CourseOrderByWithRelationInput | Prisma.CourseOrderByWithRelationInput[] = { createdAt: 'desc' };
    if (filters.sort === 'title') orderBy = { title: 'asc' };
    if (filters.sort === 'popular') orderBy = [{ isFeatured: 'desc' }, { sortOrder: 'asc' }];

    const [total, courses] = await Promise.all([
      this.prisma.course.count({ where }),
      this.prisma.course.findMany({
        where,
        orderBy,
        skip,
        take: limit,
        include: {
          category: { select: { id: true, name: true, slug: true } },
          _count: { select: { modules: true, favorites: true } },
          ...(userId && {
            favorites: { where: { userId }, select: { id: true } },
          }),
        },
      }),
    ]);

    const data = courses.map((c: any) => ({
      ...c,
      isFavorited: userId ? c.favorites?.length > 0 : false,
      favorites: undefined,
    }));

    return {
      data,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async findFeatured() {
    return this.prisma.course.findMany({
      where: { isPublished: true, isFeatured: true },
      orderBy: { sortOrder: 'asc' },
      take: 8,
      include: {
        category: { select: { id: true, name: true, slug: true } },
        _count: { select: { modules: true } },
      },
    });
  }

  async findBySlug(slug: string, userId?: string) {
    const course = await this.prisma.course.findUnique({
      where: { slug },
      include: {
        category: true,
        tags: { include: { tag: true } },
        modules: {
          orderBy: { sortOrder: 'asc' },
          include: {
            lessons: {
              orderBy: { sortOrder: 'asc' },
              select: {
                id: true,
                title: true,
                description: true,
                durationSeconds: true,
                sortOrder: true,
                isFreePreview: true,
                moduleId: true,
              },
            },
            resources: {
              orderBy: { sortOrder: 'asc' },
              select: {
                id: true,
                title: true,
                fileName: true,
                type: true,
                mimeType: true,
                sizeBytes: true,
              },
            },
          },
        },
      },
    });
    if (!course || !course.isPublished) {
      throw new NotFoundException('Course not found');
    }

    let isFavorited = false;
    let progressPercent = 0;
    let completedLessons = 0;
    let totalLessons = 0;
    for (const m of course.modules) totalLessons += m.lessons.length;

    const completedSet = new Set<string>();

    if (userId) {
      const [fav, progress] = await Promise.all([
        this.prisma.favorite.findUnique({
          where: { userId_courseId: { userId, courseId: course.id } },
        }),
        this.prisma.lessonProgress.findMany({
          where: {
            userId,
            lesson: { module: { courseId: course.id } },
            isCompleted: true,
          },
          select: { lessonId: true },
        }),
      ]);
      isFavorited = !!fav;
      for (const p of progress) completedSet.add(p.lessonId);
      completedLessons = completedSet.size;
      progressPercent = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;
    }

    // Attach isCompleted to each lesson, serialize BigInt sizeBytes
    const modulesWithProgress = course.modules.map((m) => ({
      ...m,
      lessons: m.lessons.map((l) => ({
        ...l,
        isCompleted: completedSet.has(l.id),
      })),
      resources: m.resources.map((r) => ({
        ...r,
        sizeBytes: r.sizeBytes.toString(),
      })),
    }));

    return {
      ...course,
      modules: modulesWithProgress,
      tags: course.tags.map((ct) => ct.tag),
      isFavorited,
      progressPercent,
      completedLessons,
      totalLessons,
    };
  }
}
