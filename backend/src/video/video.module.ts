import { Module } from '@nestjs/common';
import { VideoController } from './video.controller';
import { GoogleDriveService } from './google-drive.service';
import { BunnyService } from './bunny.service';
import { DemoModule } from '../demo/demo.module';

@Module({
  imports: [DemoModule],
  controllers: [VideoController],
  providers: [GoogleDriveService, BunnyService],
  exports: [GoogleDriveService, BunnyService],
})
export class VideoModule {}
