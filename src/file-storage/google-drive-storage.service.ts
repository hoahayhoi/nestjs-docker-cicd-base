import { Readable } from 'stream';

import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { google, drive_v3 } from 'googleapis';

@Injectable()
export class GoogleDriveStorageService {
  private driveClient: drive_v3.Drive;
  private readonly folderId: string;

  constructor(private configService: ConfigService) {
    this.folderId = this.configService.get<string>('GOOGLE_DRIVE_FOLDER_ID') ?? '';

    const auth = new google.auth.GoogleAuth({
      credentials: {
        type: 'service_account',
        client_email: this.configService.get<string>('GOOGLE_SERVICE_ACCOUNT_EMAIL'),
        private_key: this.configService.get<string>('GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY')?.replace(/\\n/g, '\n'),
      },
      scopes: ['https://www.googleapis.com/auth/drive'],
    });

    this.driveClient = google.drive({
      version: 'v3',
      auth,
    });
  }

  async getPublicUrl(fileId: string): Promise<string> {
    // Thay đổi permission của file thành public
    await this.driveClient.permissions.create({
      fileId,
      requestBody: {
        role: 'reader',
        type: 'anyone',
      },
    });

    // Lấy URL public
    const result = await this.driveClient.files.get({
      fileId,
      fields: 'webViewLink, webContentLink',
    });

    return (result.data.webViewLink ?? 'fail-to-upload') || (result.data.webContentLink ?? 'fail-to-upload');
  }

  async uploadFile(file: Express.Multer.File): Promise<string> {
    const fileMetadata: drive_v3.Schema$File = {
      name: file.originalname,
      parents: [this.folderId],
    };

    const media = {
      mimeType: file.mimetype,
      body: Readable.from(file.buffer),
    };

    const response = await this.driveClient.files.create({
      requestBody: fileMetadata,
      media: media,
      fields: 'id',
    });

    return response.data.id ?? 'fail-to-upload';
  }

  async getFile(fileId: string): Promise<Buffer> {
    const response = await this.driveClient.files.get(
      {
        fileId,
        alt: 'media',
      },
      { responseType: 'stream' },
    );

    return new Promise((resolve, reject) => {
      const chunks: Buffer[] = [];

      response.data
        .on('data', (chunk: Buffer) => chunks.push(chunk))
        .on('end', () => resolve(Buffer.concat(chunks)))
        .on('error', reject);
    });
  }

  async deleteFile(fileId: string): Promise<void> {
    await this.driveClient.files.delete({
      fileId,
    });
  }

  async uploadMultipleFiles(files: Express.Multer.File[]) {
    const uploadResults = await Promise.all(
      files.map(async (file) => {
        const fileId = await this.uploadFile(file);
        const url = await this.getPublicUrl(fileId);

        return {
          id: fileId,
          url,
          originalName: file.originalname,
          size: file.size,
          mimeType: file.mimetype,
        };
      }),
    );

    return uploadResults;
  }
}
