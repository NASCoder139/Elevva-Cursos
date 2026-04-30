import { Body, Controller, Delete, Get, Param, Post, ForbiddenException } from '@nestjs/common';
import { TestimonialsService } from './testimonials.service';
import { CreateTestimonialDto } from './dto/create-testimonial.dto';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Public } from '../common/decorators/public.decorator';
import type { JwtPayload } from '../common/interfaces/jwt-payload.interface';

@Controller('testimonials')
export class TestimonialsController {
  constructor(private readonly service: TestimonialsService) {}

  @Get()
  @Public()
  list() {
    return this.service.listApproved();
  }

  @Get('me')
  myTestimonial(@CurrentUser('id') userId: string) {
    return this.service.findMine(userId);
  }

  @Get('eligibility')
  eligibility(@CurrentUser('id') userId: string) {
    return this.service.checkEligibility(userId);
  }

  @Post()
  create(@CurrentUser('id') userId: string, @Body() dto: CreateTestimonialDto) {
    return this.service.create(userId, dto);
  }

  @Delete(':id')
  async remove(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    if (user.role !== 'ADMIN') {
      const owner = await this.service.findOwner(id);
      if (owner !== user.sub) throw new ForbiddenException('No puedes eliminar este testimonio');
    }
    return this.service.remove(id);
  }
}
