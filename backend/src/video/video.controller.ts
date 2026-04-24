import {
  Controller,
  Get,
  Param,
  Req,
  Res,
  NotFoundException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { PrismaService } from '../prisma/prisma.service';
import { GoogleDriveService } from './google-drive.service';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { LessonAccessService } from '../demo/lesson-access.service';

@Controller('video')
export class VideoController {
  private readonly logger = new Logger(VideoController.name);

  constructor(
    private prisma: PrismaService,
    private drive: GoogleDriveService,
    private access: LessonAccessService,
  ) {}

  @Get(':lessonId/stream')
  async stream(
    @Param('lessonId') lessonId: string,
    @CurrentUser('id') userId: string,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    const lesson = await this.prisma.lesson.findUnique({
      where: { id: lessonId },
      include: { module: { include: { course: true } } },
    });
    if (!lesson) throw new NotFoundException('Lesson not found');

    const access = await this.access.checkLessonAccess(userId, lessonId);
    if (!access.allowed) {
      throw new ForbiddenException('No tienes acceso a esta lección');
    }

    if (!lesson.driveFileId || lesson.driveFileId === 'placeholder-drive-file-id') {
      throw new NotFoundException('Video not configured for this lesson');
    }

    const range = req.headers.range;
    try {
      const driveRes = await this.drive.streamFile(lesson.driveFileId, range);

      const h = driveRes.headers as any;
      const getHeader = (name: string): string | undefined => {
        if (typeof h?.get === 'function') return h.get(name) ?? undefined;
        return h?.[name] ?? h?.[name.toLowerCase()];
      };

      const contentType = getHeader('content-type') || 'video/mp4';
      res.setHeader('Content-Type', contentType);

      const contentLength = getHeader('content-length');
      if (contentLength) res.setHeader('Content-Length', contentLength);

      const contentRange = getHeader('content-range');
      if (contentRange) res.setHeader('Content-Range', contentRange);

      res.setHeader('Accept-Ranges', getHeader('accept-ranges') || 'bytes');
      res.setHeader('Cache-Control', 'private, max-age=3600');

      res.status(range ? 206 : 200);
      driveRes.data.pipe(res);
      driveRes.data.on('error', (err) => {
        this.logger.error(`Stream error for lesson ${lessonId}: ${err.message}`);
        if (!res.headersSent) res.status(500).end();
      });
    } catch (err: any) {
      this.logger.error(`Drive error for lesson ${lessonId}: ${err?.message}`);
      throw new NotFoundException('Video unavailable');
    }
  }
}
