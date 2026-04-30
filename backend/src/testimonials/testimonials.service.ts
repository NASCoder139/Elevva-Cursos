import { Injectable, BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UsersService } from '../users/users.service';
import { CreateTestimonialDto } from './dto/create-testimonial.dto';

@Injectable()
export class TestimonialsService {
  constructor(private prisma: PrismaService, private users: UsersService) {}

  async listApproved() {
    const items = await this.prisma.testimonial.findMany({
      where: { isApproved: true },
      orderBy: { createdAt: 'desc' },
      take: 50,
      include: {
        user: { select: { firstName: true, lastName: true, country: true, avatarUrl: true } },
      },
    });
    return items.map((t) => ({
      id: t.id,
      content: t.content,
      rating: t.rating,
      createdAt: t.createdAt,
      author: {
        firstName: t.user.firstName,
        lastName: t.user.lastName,
        country: t.user.country,
        avatarUrl: t.user.avatarUrl,
      },
    }));
  }

  async findMine(userId: string) {
    return this.prisma.testimonial.findUnique({ where: { userId } });
  }

  async findOwner(id: string): Promise<string | null> {
    const t = await this.prisma.testimonial.findUnique({ where: { id }, select: { userId: true } });
    return t?.userId ?? null;
  }

  async checkEligibility(userId: string) {
    const eligible = await this.userHasAccess(userId);
    const existing = await this.prisma.testimonial.findUnique({ where: { userId } });
    return { eligible, hasTestimonial: !!existing };
  }

  async create(userId: string, dto: CreateTestimonialDto) {
    const eligible = await this.userHasAccess(userId);
    if (!eligible) {
      throw new ForbiddenException('Solo los alumnos con compras o suscripción pueden dejar testimonios');
    }

    const existing = await this.prisma.testimonial.findUnique({ where: { userId } });
    if (existing) {
      throw new BadRequestException('Ya tienes un testimonio publicado. Bórralo si quieres cambiarlo.');
    }

    return this.prisma.testimonial.create({
      data: {
        userId,
        content: dto.content,
        rating: dto.rating,
      },
    });
  }

  async remove(id: string) {
    const exists = await this.prisma.testimonial.findUnique({ where: { id } });
    if (!exists) throw new NotFoundException('Testimonio no encontrado');
    await this.prisma.testimonial.delete({ where: { id } });
    return { id, deleted: true };
  }

  private async userHasAccess(userId: string): Promise<boolean> {
    // Reusamos getAccess() — la misma fuente de verdad que el dashboard del alumno.
    // Si en /my-courses tiene cursos visibles, es porque tiene acceso vigente
    // (admin, suscripción activa, suscripción cancelada con periodo en curso,
    // suscripción pausada con periodo vigente, o compras individuales/categoría).
    try {
      const access = await this.users.getAccess(userId);
      if (access.hasSubscription) return true;
      if (Array.isArray(access.accessibleCourseIds) && access.accessibleCourseIds.length > 0) return true;
      if (access.myCourses && access.myCourses.length > 0) return true;
      return false;
    } catch {
      return false;
    }
  }
}
