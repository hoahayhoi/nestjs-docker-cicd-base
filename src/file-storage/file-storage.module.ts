import { Module } from '@nestjs/common';

import { FileStorageController } from './file-storage.controller';
import { GoogleDriveStorageService } from './google-drive-storage.service';

@Module({
  controllers: [FileStorageController],
  providers: [GoogleDriveStorageService],
  exports: [GoogleDriveStorageService],
})
export class FileStorageModule {}
