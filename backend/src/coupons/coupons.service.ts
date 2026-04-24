import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CouponScope, DiscountType } from '@prisma/client';

export interface CreateCouponDto {
  code: string;
  description?: string;
  discountType: DiscountType;
  value: number;
  scope?: CouponScope;
  validFrom?: string | null;
  validUntil?: string | null;
  usageLimit?: number | null;
  isActive?: boolean;
}

export interface UpdateCouponDto extends Partial<CreateCouponDto> {}

export type CouponContext = 'COURSE' | 'CATEGORY' | 'PLAN';

export interface AppliedCoupon {
  code: string;
  discountAmount: number;
  finalAmount: number;
  couponId: string;
}

@Injectable()
export class CouponsService {
  constructor(private prisma: PrismaService) {}

  async list() {
    return this.prisma.coupon.findMany({ orderBy: { createdAt: 'desc' } });
  }

  async create(dto: CreateCouponDto) {
    const code = dto.code.trim().toUpperCase();
    const exists = await this.prisma.coupon.findUnique({ where: { code } });
    if (exists) throw new BadRequestException('Código ya existe');

    if (dto.value <= 0) throw new BadRequestException('El descuento debe ser mayor a 0');
    if (dto.discountType === 'PERCENT' && dto.value > 100) {
      throw new BadRequestException('Un descuento porcentual no puede superar 100%');
    }

    return this.prisma.coupon.create({
      data: {
        code,
        description: dto.description,
        discountType: dto.discountType,
        value: dto.value,
        scope: dto.scope ?? 'ALL',
        validFrom: dto.validFrom ? new Date(dto.validFrom) : null,
        validUntil: dto.validUntil ? new Date(dto.validUntil) : null,
        usageLimit: dto.usageLimit ?? null,
        isActive: dto.isActive ?? true,
      },
    });
  }

  async update(id: string, dto: UpdateCouponDto) {
    const existing = await this.prisma.coupon.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Cupón no encontrado');

    const data: any = { ...dto };
    if (dto.code) {
      const code = dto.code.trim().toUpperCase();
      const dupe = await this.prisma.coupon.findFirst({ where: { code, NOT: { id } } });
      if (dupe) throw new BadRequestException('Código ya existe');
      data.code = code;
    }
    if (dto.validFrom !== undefined) data.validFrom = dto.validFrom ? new Date(dto.validFrom) : null;
    if (dto.validUntil !== undefined) data.validUntil = dto.validUntil ? new Date(dto.validUntil) : null;
    if (dto.discountType === 'PERCENT' && dto.value !== undefined && dto.value > 100) {
      throw new BadRequestException('Un descuento porcentual no puede superar 100%');
    }

    return this.prisma.coupon.update({ where: { id }, data });
  }

  async remove(id: string) {
    const existing = await this.prisma.coupon.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Cupón no encontrado');
    await this.prisma.coupon.delete({ where: { id } });
    return { ok: true };
  }

  // ─── Validación pública ──────────────────────────────────────────────────

  private scopeMatches(scope: CouponScope, context: CouponContext): boolean {
    if (scope === 'ALL') return true;
    if (scope === 'COURSES' && context === 'COURSE') return true;
    if (scope === 'CATEGORIES' && context === 'CATEGORY') return true;
    if (scope === 'PLANS' && context === 'PLAN') return true;
    return false;
  }

  async validate(code: string, context: CouponContext, baseAmount: number): Promise<AppliedCoupon> {
    if (!code) throw new BadRequestException('Código requerido');
    const coupon = await this.prisma.coupon.findUnique({ where: { code: code.trim().toUpperCase() } });
    if (!coupon) throw new BadRequestException('Cupón inválido');
    if (!coupon.isActive) throw new BadRequestException('Cupón inactivo');

    const now = new Date();
    if (coupon.validFrom && coupon.validFrom > now) throw new BadRequestException('Cupón aún no es válido');
    if (coupon.validUntil && coupon.validUntil < now) throw new BadRequestException('Cupón vencido');
    if (coupon.usageLimit !== null && coupon.usedCount >= coupon.usageLimit) {
      throw new BadRequestException('Cupón agotado');
    }
    if (!this.scopeMatches(coupon.scope, context)) {
      throw new BadRequestException('Cupón no aplicable a este producto');
    }

    let discount = 0;
    if (coupon.discountType === 'PERCENT') {
      discount = (baseAmount * Number(coupon.value)) / 100;
    } else {
      discount = Number(coupon.value);
    }
    discount = Math.min(discount, baseAmount);
    const finalAmount = Math.max(0, baseAmount - discount);

    return {
      code: coupon.code,
      discountAmount: Number(discount.toFixed(2)),
      finalAmount: Number(finalAmount.toFixed(2)),
      couponId: coupon.id,
    };
  }

  async incrementUsage(code: string) {
    try {
      await this.prisma.coupon.update({
        where: { code: code.trim().toUpperCase() },
        data: { usedCount: { increment: 1 } },
      });
    } catch {
      // si el cupón fue borrado, ignorar
    }
  }
}
