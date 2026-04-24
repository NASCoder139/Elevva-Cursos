import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Public } from '../common/decorators/public.decorator';
import { SubscribeDto, CheckoutDto } from './dto/subscribe.dto';

@Controller('payments')
export class PaymentsController {
  constructor(private payments: PaymentsService) {}

  @Post('checkout/course/:id')
  checkoutCourse(
    @CurrentUser('id') userId: string,
    @Param('id') courseId: string,
    @Body() dto: CheckoutDto = {},
  ) {
    return this.payments.checkoutCourse(userId, courseId, dto.provider || 'MERCADOPAGO', dto.couponCode);
  }

  @Post('checkout/category/:id')
  checkoutCategory(
    @CurrentUser('id') userId: string,
    @Param('id') categoryId: string,
    @Body() dto: CheckoutDto = {},
  ) {
    return this.payments.checkoutCategory(userId, categoryId, dto.provider || 'MERCADOPAGO', dto.couponCode);
  }

  @Post('subscribe')
  subscribe(@CurrentUser('id') userId: string, @Body() dto: SubscribeDto) {
    return this.payments.subscribe(userId, dto.plan, dto.provider || 'MERCADOPAGO', dto.couponCode);
  }

  @Public()
  @Post('webhook')
  webhook(@Query() query: Record<string, string>, @Body() body: any) {
    return this.payments.handleWebhook(query, body);
  }

  @Public()
  @Post('paypal/webhook')
  paypalWebhook(@Body() body: any) {
    return this.payments.handlePaypalWebhook(body);
  }

  @Post('paypal/capture/:id')
  capturePaypal(@CurrentUser('id') userId: string, @Param('id') paymentId: string) {
    return this.payments.capturePaypalByPaymentId(paymentId);
  }

  @Post('paypal/sync-subscription/:id')
  syncPaypalSub(@CurrentUser('id') userId: string, @Param('id') subscriptionId: string) {
    return this.payments.syncPaypalSubscriptionById(subscriptionId);
  }

  @Get(':id')
  getPayment(@CurrentUser('id') userId: string, @Param('id') id: string) {
    return this.payments.getPayment(userId, id);
  }

  @Post('simulate/approve/:id')
  simulateApprove(@Param('id') id: string) {
    return this.payments.simulateApprove(id);
  }

  @Post('simulate/subscription/:id')
  simulateSubscription(@Param('id') id: string) {
    return this.payments.simulateActivateSubscription(id);
  }
}
