import { Controller, Get, Req, Logger } from '@nestjs/common';
import type { Request } from 'express';
import { Public } from '../common/decorators/public.decorator';

@Controller('geo')
export class GeoController {
  private readonly logger = new Logger(GeoController.name);

  @Get('detect')
  @Public()
  async detect(@Req() req: Request) {
    const ip = this.extractIp(req);
    const country = await this.lookup(ip);
    return { country, ip };
  }

  private extractIp(req: Request): string | undefined {
    const xff = req.headers['x-forwarded-for'];
    if (typeof xff === 'string' && xff.length > 0) return xff.split(',')[0].trim();
    return req.ip;
  }

  private async lookup(ip?: string): Promise<string | null> {
    try {
      const isLocal =
        !ip ||
        ip === '::1' ||
        ip === '127.0.0.1' ||
        ip.startsWith('192.168.') ||
        ip.startsWith('10.') ||
        ip.startsWith('::ffff:127.') ||
        ip.startsWith('::ffff:192.168.') ||
        ip.startsWith('::ffff:10.');
      const url = isLocal
        ? 'http://ip-api.com/json/?fields=status,country&lang=es'
        : `http://ip-api.com/json/${ip}?fields=status,country&lang=es`;
      const res = await fetch(url);
      const data = await res.json();
      this.logger.log(`GeoIP [${ip}] -> ${data.status}: ${data.country || 'N/A'}`);
      return data.status === 'success' ? data.country : null;
    } catch (err) {
      this.logger.warn(`GeoIP error for [${ip}]: ${err}`);
      return null;
    }
  }
}
