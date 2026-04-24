import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { google, drive_v3 } from 'googleapis';
import { GaxiosResponse } from 'gaxios';
import * as path from 'path';
import { Readable } from 'stream';

@Injectable()
export class GoogleDriveService implements OnModuleInit {
  private readonly logger = new Logger(GoogleDriveService.name);
  private drive!: drive_v3.Drive;

  constructor(private configService: ConfigService) {}

  onModuleInit() {
    const keyPath = this.configService.get<string>('GOOGLE_SERVICE_ACCOUNT_KEY_PATH');
    if (!keyPath) {
      this.logger.warn('GOOGLE_SERVICE_ACCOUNT_KEY_PATH not set — Drive API disabled');
      return;
    }
    const absolute = path.isAbsolute(keyPath) ? keyPath : path.resolve(process.cwd(), keyPath);
    const auth = new google.auth.GoogleAuth({
      keyFile: absolute,
      scopes: ['https://www.googleapis.com/auth/drive.readonly'],
    });
    this.drive = google.drive({ version: 'v3', auth });
    this.logger.log(`Drive API initialized (key: ${absolute})`);
  }

  /**
   * List children of a folder. Folders first, then files, sorted by name.
   */
  async listFolder(folderId: string): Promise<drive_v3.Schema$File[]> {
    const files: drive_v3.Schema$File[] = [];
    let pageToken: string | undefined;
    do {
      const res = await this.drive.files.list({
        q: `'${folderId}' in parents and trashed = false`,
        fields: 'nextPageToken, files(id, name, mimeType, size, videoMediaMetadata, thumbnailLink)',
        pageSize: 1000,
        pageToken,
        orderBy: 'name',
      });
      files.push(...(res.data.files || []));
      pageToken = res.data.nextPageToken || undefined;
    } while (pageToken);
    return files;
  }

  async getFileMetadata(fileId: string): Promise<drive_v3.Schema$File> {
    const res = await this.drive.files.get({
      fileId,
      fields: 'id, name, mimeType, size, videoMediaMetadata',
    });
    return res.data;
  }

  /**
   * Stream a file as a pipe-able Readable. Supports Range header for seek.
   * Returns the gaxios response so the caller can forward headers (content-length, content-range).
   */
  async streamFile(fileId: string, range?: string): Promise<GaxiosResponse<Readable>> {
    const headers: Record<string, string> = {};
    if (range) headers['Range'] = range;

    const res = await this.drive.files.get(
      { fileId, alt: 'media' },
      { responseType: 'stream', headers },
    );
    return res as unknown as GaxiosResponse<Readable>;
  }

  isFolder(file: drive_v3.Schema$File): boolean {
    return file.mimeType === 'application/vnd.google-apps.folder';
  }

  isVideo(file: drive_v3.Schema$File): boolean {
    return !!file.mimeType && file.mimeType.startsWith('video/');
  }
}
