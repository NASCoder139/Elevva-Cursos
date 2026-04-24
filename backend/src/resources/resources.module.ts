import { Module } from '@nestjs/common';
import { ResourcesController } from './resources.controller';
import { VideoModule } from '../video/video.module';
import { DemoModule } from '../demo/demo.module';

@Module({
  imports: [VideoModule, DemoModule],
  controllers: [ResourcesController],
})
export class ResourcesModule {}
