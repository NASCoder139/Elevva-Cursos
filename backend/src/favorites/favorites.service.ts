import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class FavoritesService {
  constructor(private prisma: PrismaService) {}

  async list(userId: string) {
    const favorites = await this.prisma.favorite.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: {
        course: {
          include: {
            category: { select: { id: true, name: true, slug: true } },
            _count: { select: { modules: true } },
          },
        },
      },
    });
    return favorites.map((f) => ({ ...f.course, isFavorited: true }));
  }

  async add(userId: string, courseId: string) {
    const course = await this.prisma.course.findUnique({ where: { id: courseId } });
    if (!course) throw new NotFoundException('Course not found');

    await this.prisma.favorite.upsert({
      where: { userId_courseId: { userId, courseId } },
      update: {},
      create: { userId, courseId },
    });
    return { success: true };
  }

  async remove(userId: string, courseId: string) {
    await this.prisma.favorite
      .delete({ where: { userId_courseId: { userId, courseId } } })
      .catch(() => null);
    return { success: true };
  }
}
