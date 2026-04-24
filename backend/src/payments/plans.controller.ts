import { Controller, Get } from '@nestjs/common';
import { Public } from '../common/decorators/public.decorator';
import { PlansService } from './plans.service';

@Controller('plans')
export class PlansController {
  constructor(private plans: PlansService) {}

  @Public()
  @Get()
  async list() {
    const all = await this.plans.list();
    return all.filter((p) => p.isActive);
  }
}
