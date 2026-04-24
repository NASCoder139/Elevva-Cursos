import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { CoursesService } from './courses.service';
import { CourseFilterDto } from './dto/course-filter.dto';
import { Public } from '../common/decorators/public.decorator';
import { OptionalJwtAuthGuard } from '../common/guards/optional-jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('courses')
export class CoursesController {
  constructor(private readonly coursesService: CoursesService) {}

  @Public()
  @UseGuards(OptionalJwtAuthGuard)
  @Get()
  findAll(@Query() filters: CourseFilterDto, @CurrentUser('id') userId?: string) {
    return this.coursesService.findAll(filters, userId);
  }

  @Public()
  @Get('featured')
  findFeatured() {
    return this.coursesService.findFeatured();
  }

  @Public()
  @UseGuards(OptionalJwtAuthGuard)
  @Get(':slug')
  findBySlug(@Param('slug') slug: string, @CurrentUser('id') userId?: string) {
    return this.coursesService.findBySlug(slug, userId);
  }
}
