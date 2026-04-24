import { Controller, Get } from '@nestjs/common';
import { Public } from '../common/decorators/public.decorator';
import { SiteSettingsService } from './site-settings.service';

@Controller()
export class PublicSettingsController {
  constructor(private settings: SiteSettingsService) {}

  @Public()
  @Get('promo-ribbon')
  async getRibbon() {
    const s = await this.settings.get();
    return {
      enabled: s.promoRibbonEnabled,
      text: s.promoRibbonText,
      secondaryText: s.promoRibbonSecondaryText,
      showCountdown: s.promoRibbonShowCountdown,
      endsAt: s.plansPromoEndsAt, // unificado: cinta usa la fecha del modo oferta
      ctaText: s.promoRibbonCtaText,
      ctaUrl: s.promoRibbonCtaUrl,
    };
  }

  @Public()
  @Get('plans-promo')
  async getPlansPromo() {
    const s = await this.settings.get();
    return {
      enabled: s.plansPromoEnabled,
      endsAt: s.plansPromoEndsAt,
    };
  }
}
