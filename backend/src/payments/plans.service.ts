import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PlanKey, planToPaymentType } from './plans';

export interface UpdatePlanDto {
  label?: string;
  price?: number;
  comparePrice?: number | null;
  badge?: string | null;
  savings?: string | null;
  features?: string[];
  isActive?: boolean;
  sortOrder?: number;
}

@Injectable()
export class PlansService {
  constructor(private prisma: PrismaService) {}

  async list() {
    return this.prisma.plan.findMany({ orderBy: { sortOrder: 'asc' } });
  }

  async getByKey(plan: PlanKey) {
    const key = planToPaymentType(plan);
    const found = await this.prisma.plan.findUnique({ where: { key } });
    if (!found) throw new NotFoundException(`Plan ${plan} no configurado`);
    if (!found.isActive) throw new BadRequestException(`Plan ${plan} inactivo`);
    return found;
  }

  async getById(id: string) {
    const found = await this.prisma.plan.findUnique({ where: { id } });
    if (!found) throw new NotFoundException('Plan no encontrado');
    return found;
  }

  async priceFor(plan: PlanKey): Promise<number> {
    const p = await this.getByKey(plan);
    return Number(p.price);
  }

  async update(id: string, dto: UpdatePlanDto) {
    await this.getById(id);
    return this.prisma.plan.update({ where: { id }, data: dto });
  }

  async seedDefaults() {
    const defaults = [
      {
        key: 'SUBSCRIPTION_MONTHLY' as const,
        label: 'Mensual',
        price: 12,
        currency: 'USD',
        badge: 'Flexible',
        savings: null,
        features: [
          'Acceso completo a todos los cursos',
          'Nuevos cursos cada mes',
          'Soporte por email',
          'Cancelás cuando quieras',
        ],
        sortOrder: 0,
      },
      {
        key: 'SUBSCRIPTION_ANNUAL' as const,
        label: 'Anual',
        price: 120,
        currency: 'USD',
        badge: 'Ahorrás 2 meses',
        savings: '17%',
        features: [
          'Todo lo del plan mensual',
          'Equivalente a 2 meses gratis',
          'Acceso prioritario a webinars',
          'Mejor relación calidad / precio',
        ],
        sortOrder: 1,
      },
    ];
    for (const p of defaults) {
      await this.prisma.plan.upsert({
        where: { key: p.key },
        update: {},
        create: p,
      });
    }
    return this.list();
  }
}
