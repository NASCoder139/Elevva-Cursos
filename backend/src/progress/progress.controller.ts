import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { ProgressService } from './progress.service';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { UpdateProgressDto } from './dto/update-progress.dto';

@Controller('progress')
export class ProgressController {
  constructor(private readonly progressService: ProgressService) {}

  @Get('lesson/:lessonId')
  getLesson(@CurrentUser('id') userId: string, @Param('lessonId') lessonId: string) {
    return this.progressService.getLessonProgress(userId, lessonId);
  }

  @Get('course/:courseId')
  getCourse(@CurrentUser('id') userId: string, @Param('courseId') courseId: string) {
    return this.progressService.getCourseProgress(userId, courseId);
  }

  @Post('lesson/:lessonId')
  update(
    @CurrentUser('id') userId: string,
    @Param('lessonId') lessonId: string,
    @Body() dto: UpdateProgressDto,
  ) {
    return this.progressService.updateProgress(userId, lessonId, dto.watchedSeconds);
  }

  @Post('lesson/:lessonId/complete')
  complete(@CurrentUser('id') userId: string, @Param('lessonId') lessonId: string) {
    return this.progressService.markComplete(userId, lessonId);
  }
}
