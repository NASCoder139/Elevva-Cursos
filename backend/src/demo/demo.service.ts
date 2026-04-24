import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

const DEMO_DURATION_MS = 30 * 60 * 1000;

@Injectable()
export class DemoService {
  constructor(private prisma: PrismaService) {}

  async getStatus(userId: string) {
    let session = await this.prisma.demoSession.findUnique({ where: { userId } });
    if (!session) {
      session = await this.prisma.demoSession.create({
        data: { userId, status: 'AVAILABLE' },
      });
    }

    const now = Date.now();
    if (session.status === 'ACTIVE' && session.expiresAt && session.expiresAt.getTime() <= now) {
      session = await this.prisma.demoSession.update({
        where: { userId },
        data: { status: 'EXPIRED' },
      });
    }

    const remainingMs =
      session.status === 'ACTIVE' && session.expiresAt
        ? Math.max(0, session.expiresAt.getTime() - now)
        : 0;

    return {
      status: session.status,
      activatedAt: session.activatedAt,
      expiresAt: session.expiresAt,
      remainingSeconds: Math.floor(remainingMs / 1000),
    };
  }

  async activate(userId: string) {
    const session = await this.prisma.demoSession.findUnique({ where: { userId } });
    if (!session) throw new NotFoundException('Demo session not found');
    if (session.status === 'ACTIVE') {
      throw new BadRequestException('Demo ya está activa');
    }
    if (session.status === 'EXPIRED') {
      throw new BadRequestException('Demo ya fue utilizada');
    }

    const activatedAt = new Date();
    const expiresAt = new Date(activatedAt.getTime() + DEMO_DURATION_MS);

    const updated = await this.prisma.demoSession.update({
      where: { userId },
      data: { status: 'ACTIVE', activatedAt, expiresAt },
    });

    return {
      status: updated.status,
      activatedAt: updated.activatedAt,
      expiresAt: updated.expiresAt,
      remainingSeconds: Math.floor(DEMO_DURATION_MS / 1000),
    };
  }

  async isDemoActive(userId: string): Promise<boolean> {
    const session = await this.prisma.demoSession.findUnique({ where: { userId } });
    if (!session || session.status !== 'ACTIVE' || !session.expiresAt) return false;
    if (session.expiresAt.getTime() <= Date.now()) {
      await this.prisma.demoSession.update({
        where: { userId },
        data: { status: 'EXPIRED' },
      });
      return false;
    }
    return true;
  }
}
