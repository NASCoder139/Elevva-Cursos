import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ProgressService {
  constructor(private prisma: PrismaService) {}

  async updateProgress(userId: string, lessonId: string, watchedSeconds: number) {
    const lesson = await this.prisma.lesson.findUnique({
      where: { id: lessonId },
      select: { id: true, durationSeconds: true },
    });
    if (!lesson) throw new NotFoundException('Lesson not found');

    // Auto-completa si vio más del 90%
    const isCompleted =
      lesson.durationSeconds > 0 && watchedSeconds >= lesson.durationSeconds * 0.9;

    return this.prisma.lessonProgress.upsert({
      where: { userId_lessonId: { userId, lessonId } },
      update: {
        watchedSeconds,
        isCompleted,
        completedAt: isCompleted ? new Date() : null,
        lastWatchedAt: new Date(),
      },
      create: {
        userId,
        lessonId,
        watchedSeconds,
        isCompleted,
        completedAt: isCompleted ? new Date() : null,
        lastWatchedAt: new Date(),
      },
    });
  }

  async markComplete(userId: string, lessonId: string) {
    const lesson = await this.prisma.lesson.findUnique({
      where: { id: lessonId },
      select: { id: true, durationSeconds: true },
    });
    if (!lesson) throw new NotFoundException('Lesson not found');

    return this.prisma.lessonProgress.upsert({
      where: { userId_lessonId: { userId, lessonId } },
      update: {
        isCompleted: true,
        completedAt: new Date(),
        watchedSeconds: lesson.durationSeconds,
        lastWatchedAt: new Date(),
      },
      create: {
        userId,
        lessonId,
        watchedSeconds: lesson.durationSeconds,
        isCompleted: true,
        completedAt: new Date(),
        lastWatchedAt: new Date(),
      },
    });
  }

  async getLessonProgress(userId: string, lessonId: string) {
    const progress = await this.prisma.lessonProgress.findUnique({
      where: { userId_lessonId: { userId, lessonId } },
    });
    return progress || { watchedSeconds: 0, isCompleted: false };
  }

  async getCourseProgress(userId: string, courseId: string) {
    return this.prisma.lessonProgress.findMany({
      where: {
        userId,
        lesson: { module: { courseId } },
      },
      select: {
        lessonId: true,
        watchedSeconds: true,
        isCompleted: true,
        lastWatchedAt: true,
      },
    });
  }
}
