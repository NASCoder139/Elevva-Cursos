import { Module } from '@nestjs/common';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { PaymentsModule } from '../payments/payments.module';
import { CouponsModule } from '../coupons/coupons.module';
import { SiteSettingsModule } from '../site-settings/site-settings.module';

@Module({
  imports: [PaymentsModule, CouponsModule, SiteSettingsModule],
  controllers: [AdminController],
  providers: [AdminService],
})
export class AdminModule {}
