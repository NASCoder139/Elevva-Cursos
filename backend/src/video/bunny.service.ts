import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Readable } from 'stream';

interface BunnyVideoInfo {
  guid: string;
  title: string;
  status: number;
  length: number;
  isPublic: boolean;
}

@Injectable()
export class BunnyService implements OnModuleInit {
  private readonly logger = new Logger(BunnyService.name);
  private libraryId: string | null = null;
  private apiKey: string | null = null;
  private cdnHostname: string | null = null;

  constructor(private config: ConfigService) {}

  onModuleInit() {
    this.libraryId = this.config.get<string>('BUNNY_LIBRARY_ID') || null;
    this.apiKey = this.config.get<string>('BUNNY_API_KEY') || null;
    this.cdnHostname = this.config.get<string>('BUNNY_CDN_HOSTNAME') || null;
    if (this.isConfigured) {
      this.logger.log(`Bunny Stream initialized (library: ${this.libraryId})`);
    } else {
      this.logger.warn('BUNNY_LIBRARY_ID / BUNNY_API_KEY no configurados — Bunny Stream deshabilitado');
    }
  }

  get isConfigured(): boolean {
    return !!(this.libraryId && this.apiKey);
  }

  /** URL del iframe embebible para reproducir el video. */
  getEmbedUrl(videoId: string, opts: { autoplay?: boolean } = {}): string {
    if (!this.libraryId) return '';
    const params = new URLSearchParams();
    if (opts.autoplay) params.set('autoplay', 'true');
    const qs = params.toString();
    return `https://iframe.mediadelivery.net/embed/${this.libraryId}/${videoId}${qs ? `?${qs}` : ''}`;
  }

  /** URL directa al HLS playlist (si después usás player custom). */
  getHlsUrl(videoId: string): string {
    if (!this.cdnHostname) return '';
    return `https://${this.cdnHostname}/${videoId}/playlist.m3u8`;
  }

  /** URL del thumbnail generado automáticamente por Bunny. */
  getThumbnailUrl(videoId: string): string {
    if (!this.cdnHostname) return '';
    return `https://${this.cdnHostname}/${videoId}/thumbnail.jpg`;
  }

  /** Crea un nuevo video en Bunny y devuelve su `guid`. */
  async createVideo(title: string): Promise<string> {
    if (!this.isConfigured) throw new Error('Bunny no configurado');
    const res = await fetch(`https://video.bunnycdn.com/library/${this.libraryId}/videos`, {
      method: 'POST',
      headers: {
        AccessKey: this.apiKey!,
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({ title }),
    });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Bunny createVideo ${res.status}: ${text}`);
    }
    const json = await res.json();
    return json.guid as string;
  }

  /** Sube los bytes de un video ya creado. Acepta un Readable stream. */
  async uploadVideo(videoId: string, stream: Readable, sizeBytes?: number): Promise<void> {
    if (!this.isConfigured) throw new Error('Bunny no configurado');
    const headers: Record<string, string> = {
      AccessKey: this.apiKey!,
      'Content-Type': 'application/octet-stream',
    };
    if (sizeBytes && sizeBytes > 0) headers['Content-Length'] = String(sizeBytes);

    const res = await fetch(`https://video.bunnycdn.com/library/${this.libraryId}/videos/${videoId}`, {
      method: 'PUT',
      headers,
      body: stream as any,
      // @ts-ignore — Node fetch acepta duplex para streams
      duplex: 'half',
    });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Bunny uploadVideo ${res.status}: ${text}`);
    }
  }

  async getVideo(videoId: string): Promise<BunnyVideoInfo | null> {
    if (!this.isConfigured) return null;
    const res = await fetch(`https://video.bunnycdn.com/library/${this.libraryId}/videos/${videoId}`, {
      headers: { AccessKey: this.apiKey!, Accept: 'application/json' },
    });
    if (res.status === 404) return null;
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Bunny getVideo ${res.status}: ${text}`);
    }
    return (await res.json()) as BunnyVideoInfo;
  }

  async deleteVideo(videoId: string): Promise<void> {
    if (!this.isConfigured) return;
    await fetch(`https://video.bunnycdn.com/library/${this.libraryId}/videos/${videoId}`, {
      method: 'DELETE',
      headers: { AccessKey: this.apiKey! },
    });
  }
}
