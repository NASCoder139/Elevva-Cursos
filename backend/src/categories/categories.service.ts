import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CategoriesService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    const categories = await this.prisma.category.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' },
      include: {
        _count: {
          select: { courses: { where: { isPublished: true } } },
        },
      },
    });
    return categories.map((c) => ({
      id: c.id,
      name: c.name,
      slug: c.slug,
      description: c.description,
      imageUrl: c.imageUrl,
      price: c.price,
      comparePrice: c.comparePrice,
      courseCount: c._count.courses,
    }));
  }

  async findBySlug(slug: string) {
    const category = await this.prisma.category.findUnique({
      where: { slug },
      include: {
        courses: {
          where: { isPublished: true },
          orderBy: [{ isFeatured: 'desc' }, { sortOrder: 'asc' }],
          include: {
            category: { select: { id: true, name: true, slug: true } },
            _count: { select: { modules: true } },
          },
        },
      },
    });
    if (!category || !category.isActive) {
      throw new NotFoundException('Category not found');
    }
    return category;
  }
}
