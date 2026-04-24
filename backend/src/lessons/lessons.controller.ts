import { Controller, Get, Param } from '@nestjs/common';
import { LessonsService } from './lessons.service';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('lessons')
export class LessonsController {
  constructor(private readonly lessonsService: LessonsService) {}

  @Get(':id')
  findById(@Param('id') id: string, @CurrentUser('id') userId: string) {
    return this.lessonsService.findById(id, userId);
  }
}
