import { Injectable, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { promises as fs } from 'fs';
import * as path from 'path';
import { randomBytes } from 'crypto';

@Injectable()
export class UploadsService {
  private readonly baseDir = path.resolve(process.cwd(), 'uploads');

  constructor(private config: ConfigService) {}

  private get publicBaseUrl() {
    return this.config.get<string>('BACKEND_URL', 'http://localhost:3000');
  }

  async save(subdir: 'avatars' | 'thumbnails', file: Express.Multer.File) {
    if (!file) throw new BadRequestException('Archivo requerido');
    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowed.includes(file.mimetype)) {
      throw new BadRequestException('Formato de imagen no soportado');
    }
    if (file.size > 5 * 1024 * 1024) {
      throw new BadRequestException('Archivo demasiado grande (máx 5MB)');
    }

    const dir = path.join(this.baseDir, subdir);
    await fs.mkdir(dir, { recursive: true });

    const ext = path.extname(file.originalname).toLowerCase() || '.bin';
    const name = `${Date.now()}-${randomBytes(6).toString('hex')}${ext}`;
    const full = path.join(dir, name);
    await fs.writeFile(full, file.buffer);

    const url = `${this.publicBaseUrl}/uploads/${subdir}/${name}`;
    return { url, filename: name };
  }
}
