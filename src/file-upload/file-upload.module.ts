import { Module } from '@nestjs/common';

import { FileUploadController } from './file-upload.controller';

import { FileStorageModule } from '@/file-storage/file-storage.module';

@Module({
  imports: [FileStorageModule],
  controllers: [FileUploadController],
})
export class FileUploadModule {}
