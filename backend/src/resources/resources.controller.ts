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
import { GoogleDriveService } from '../video/google-drive.service';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { LessonAccessService } from '../demo/lesson-access.service';

@Controller('resources')
export class ResourcesController {
  private readonly logger = new Logger(ResourcesController.name);

  constructor(
    private prisma: PrismaService,
    private drive: GoogleDriveService,
    private access: LessonAccessService,
  ) {}

  @Get(':id/stream')
  async stream(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    await this.sendResource(id, userId, req, res, false);
  }

  @Get(':id/download')
  async download(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    await this.sendResource(id, userId, req, res, true);
  }

  private async sendResource(
    id: string,
    userId: string | undefined,
    req: Request,
    res: Response,
    forceDownload: boolean,
  ) {
    const resource = await this.prisma.resource.findUnique({
      where: { id },
      include: {
        module: {
          include: {
            lessons: { take: 1, orderBy: { sortOrder: 'asc' } },
            course: {
              select: {
                id: true,
                modules: {
                  orderBy: { sortOrder: 'asc' },
                  include: {
                    lessons: { take: 1, orderBy: { sortOrder: 'asc' }, select: { id: true } },
                  },
                },
              },
            },
          },
        },
      },
    });
    if (!resource) throw new NotFoundException('Resource not found');

    // Si el módulo del recurso tiene lecciones, validamos contra la primera.
    // Si no (p.ej. un módulo "Bonus" con solo PDFs), buscamos la primera lección
    // del curso para validar acceso al curso en general.
    let lessonIdForAccess = resource.module.lessons[0]?.id;
    if (!lessonIdForAccess) {
      for (const m of resource.module.course.modules) {
        if (m.lessons[0]) {
          lessonIdForAccess = m.lessons[0].id;
          break;
        }
      }
    }
    if (!lessonIdForAccess) {
      throw new ForbiddenException('Curso sin lecciones — no se puede validar acceso');
    }
    const access = await this.access.checkLessonAccess(userId, lessonIdForAccess);
    if (!access.allowed) {
      throw new ForbiddenException('No tienes acceso a este recurso');
    }

    try {
      const range = req.headers.range;
      const driveRes = await this.drive.streamFile(resource.driveFileId, range);

      const h = driveRes.headers as any;
      const getHeader = (name: string): string | undefined => {
        if (typeof h?.get === 'function') return h.get(name) ?? undefined;
        return h?.[name] ?? h?.[name.toLowerCase()];
      };

      res.setHeader('Content-Type', getHeader('content-type') || resource.mimeType);
      const contentLength = getHeader('content-length');
      if (contentLength) res.setHeader('Content-Length', contentLength);
      const contentRange = getHeader('content-range');
      if (contentRange) res.setHeader('Content-Range', contentRange);
      res.setHeader('Accept-Ranges', getHeader('accept-ranges') || 'bytes');
      res.setHeader('Cache-Control', 'private, max-age=3600');

      if (forceDownload) {
        const safe = resource.fileName.replace(/"/g, '');
        res.setHeader('Content-Disposition', `attachment; filename="${safe}"`);
      } else {
        res.setHeader('Content-Disposition', 'inline');
      }

      res.status(range ? 206 : 200);
      driveRes.data.pipe(res);
      driveRes.data.on('error', (err) => {
        this.logger.error(`Stream error for resource ${id}: ${err.message}`);
        if (!res.headersSent) res.status(500).end();
      });
    } catch (err: any) {
      this.logger.error(`Drive error for resource ${id}: ${err?.message}`);
      throw new NotFoundException('Recurso no disponible');
    }
  }
}
