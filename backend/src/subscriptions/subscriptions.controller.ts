import { Controller, Get, Post } from '@nestjs/common';
import { SubscriptionsService } from './subscriptions.service';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('subscriptions')
export class SubscriptionsController {
  constructor(private subs: SubscriptionsService) {}

  @Get('current')
  current(@CurrentUser('id') userId: string) {
    return this.subs.getCurrent(userId);
  }

  @Post('cancel')
  cancel(@CurrentUser('id') userId: string) {
    return this.subs.cancel(userId);
  }
}
