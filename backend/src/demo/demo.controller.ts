import { Controller, Get, Post } from '@nestjs/common';
import { DemoService } from './demo.service';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('demo')
export class DemoController {
  constructor(private demo: DemoService) {}

  @Get('status')
  status(@CurrentUser('id') userId: string) {
    return this.demo.getStatus(userId);
  }

  @Post('activate')
  activate(@CurrentUser('id') userId: string) {
    return this.demo.activate(userId);
  }
}
