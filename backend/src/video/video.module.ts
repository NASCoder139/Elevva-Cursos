import { Module } from '@nestjs/common';
import { VideoController } from './video.controller';
import { GoogleDriveService } from './google-drive.service';
import { DemoModule } from '../demo/demo.module';

@Module({
  imports: [DemoModule],
  controllers: [VideoController],
  providers: [GoogleDriveService],
  exports: [GoogleDriveService],
})
export class VideoModule {}
