import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export interface UpdatePlansPromoDto {
  plansPromoEnabled?: boolean;
  plansPromoEndsAt?: string | Date | null;
}

export interface UpdatePromoRibbonDto {
  promoRibbonEnabled?: boolean;
  promoRibbonText?: string;
  promoRibbonSecondaryText?: string | null;
  promoRibbonShowCountdown?: boolean;
  promoRibbonCtaText?: string | null;
  promoRibbonCtaUrl?: string | null;
}

const SINGLETON_ID = 'site-settings-singleton';

@Injectable()
export class SiteSettingsService {
  constructor(private prisma: PrismaService) {}

  async get() {
    const existing = await this.prisma.siteSettings.findFirst();
    if (existing) return existing;
    return this.prisma.siteSettings.create({ data: { id: SINGLETON_ID } });
  }

  async updatePlansPromo(dto: UpdatePlansPromoDto) {
    const current = await this.get();
    const data: any = { ...dto };
    if (dto.plansPromoEndsAt !== undefined) {
      data.plansPromoEndsAt = dto.plansPromoEndsAt ? new Date(dto.plansPromoEndsAt) : null;
    }
    return this.prisma.siteSettings.update({ where: { id: current.id }, data });
  }

  async updatePromoRibbon(dto: UpdatePromoRibbonDto) {
    const current = await this.get();
    return this.prisma.siteSettings.update({ where: { id: current.id }, data: dto });
  }
}
