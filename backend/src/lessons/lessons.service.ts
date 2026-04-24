import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { LessonAccessService } from '../demo/lesson-access.service';

@Injectable()
export class LessonsService {
  constructor(
    private prisma: PrismaService,
    private access: LessonAccessService,
  ) {}

  async findById(lessonId: string, userId: string) {
    const lesson = await this.prisma.lesson.findUnique({
      where: { id: lessonId },
      include: {
        module: {
          include: {
            course: {
              select: { id: true, title: true, slug: true, categoryId: true },
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
    if (!lesson) throw new NotFoundException('Lesson not found');

    const progress = await this.prisma.lessonProgress.findUnique({
      where: { userId_lessonId: { userId, lessonId } },
    });

    const access = await this.access.checkLessonAccess(userId, lessonId);

    return {
      ...lesson,
      module: {
        ...lesson.module,
        resources: lesson.module.resources.map((r) => ({
          ...r,
          sizeBytes: r.sizeBytes.toString(), // BigInt → string para JSON
        })),
      },
      progress: progress || { watchedSeconds: 0, isCompleted: false },
      hasAccess: access.allowed,
      accessReason: access.reason,
    };
  }
}
