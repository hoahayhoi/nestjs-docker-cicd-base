import { Controller } from '@nestjs/common';

import { GoogleDriveStorageService } from './google-drive-storage.service';

@Controller('file-storage')
export class FileStorageController {
  constructor(private readonly fileStorageService: GoogleDriveStorageService) {}
}
