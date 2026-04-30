import { Module } from '@nestjs/common';
import { LessonsService } from './lessons.service';
import { LessonsController } from './lessons.controller';
import { DemoModule } from '../demo/demo.module';
import { VideoModule } from '../video/video.module';

@Module({
  imports: [DemoModule, VideoModule],
  controllers: [LessonsController],
  providers: [LessonsService],
  exports: [LessonsService],
})
export class LessonsModule {}
