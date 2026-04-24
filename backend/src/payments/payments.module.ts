import { Module } from '@nestjs/common';
import { PaymentsController } from './payments.controller';
import { PaymentsService } from './payments.service';
import { MercadoPagoService } from './mercadopago.service';
import { PayPalService } from './paypal.service';
import { PlansService } from './plans.service';
import { PlansController } from './plans.controller';
import { CouponsModule } from '../coupons/coupons.module';

@Module({
  imports: [CouponsModule],
  controllers: [PaymentsController, PlansController],
  providers: [PaymentsService, MercadoPagoService, PayPalService, PlansService],
  exports: [PaymentsService, MercadoPagoService, PayPalService, PlansService],
})
export class PaymentsModule {}
