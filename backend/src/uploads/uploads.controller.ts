import {
  Controller,
  Post,
  UploadedFile,
  UseInterceptors,
  Req,
  UseGuards,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { UploadsService } from './uploads.service';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Controller('uploads')
export class UploadsController {
  constructor(
    private uploads: UploadsService,
    private prisma: PrismaService,
  ) {}

  @Post('avatar')
  @UseInterceptors(FileInterceptor('file'))
  async avatar(@UploadedFile() file: Express.Multer.File, @Req() req: any) {
    const result = await this.uploads.save('avatars', file);
    await this.prisma.user.update({
      where: { id: req.user.sub },
      data: { avatarUrl: result.url },
    });
    return result;
  }

  @Post('thumbnail')
  @Roles(Role.ADMIN)
  @UseInterceptors(FileInterceptor('file'))
  async thumbnail(@UploadedFile() file: Express.Multer.File) {
    return this.uploads.save('thumbnails', file);
  }
}
