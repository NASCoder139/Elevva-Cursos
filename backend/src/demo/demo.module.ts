import { Module } from '@nestjs/common';
import { DemoController } from './demo.controller';
import { DemoService } from './demo.service';
import { LessonAccessService } from './lesson-access.service';

@Module({
  controllers: [DemoController],
  providers: [DemoService, LessonAccessService],
  exports: [DemoService, LessonAccessService],
})
export class DemoModule {}
