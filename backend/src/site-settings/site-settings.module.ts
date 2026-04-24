import { Module } from '@nestjs/common';
import { SiteSettingsService } from './site-settings.service';
import { PublicSettingsController } from './site-settings.controller';

@Module({
  controllers: [PublicSettingsController],
  providers: [SiteSettingsService],
  exports: [SiteSettingsService],
})
export class SiteSettingsModule {}
