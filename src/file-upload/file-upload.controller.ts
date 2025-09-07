import { BadRequestException, Controller, Post, UploadedFile, UploadedFiles, UseInterceptors } from '@nestjs/common';
import { FileFieldsInterceptor, FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { ApiOperation, ApiConsumes, ApiBody } from '@nestjs/swagger';

import { filePipe, multipleFilesValidator } from './file.validators';

import { Public } from '@/common/decorator/customize';
import { GoogleDriveStorageService } from '@/file-storage/google-drive-storage.service';

@Controller('files')
export class FileUploadController {
  constructor(private readonly fileStorageService: GoogleDriveStorageService) {}

  @Post('upload')
  @Public()
  @UseInterceptors(FileInterceptor('file'))
  @ApiOperation({ summary: 'Upload file to Google Drive' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  async uploadFileAndPassValidation(@UploadedFile(filePipe) file: Express.Multer.File) {
    const fileId = await this.fileStorageService.uploadFile(file);
    const publicUrl = await this.fileStorageService.getPublicUrl(fileId);

    return {
      file: {
        id: fileId,
        originalName: file.originalname,
        size: file.size,
        mimeType: file.mimetype,
        url: publicUrl,
      },
    };
  }

  @Post('array-files')
  @Public()
  @UseInterceptors(FilesInterceptor('files'))
  @ApiOperation({ summary: 'Upload array files' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    description: 'Array of files',
    schema: {
      type: 'object',
      properties: {
        files: {
          type: 'array',
          items: {
            type: 'string',
            format: 'binary',
          },
        },
      },
    },
  })
  async uploadMultipleFiles(
    @UploadedFiles(multipleFilesValidator(5, 1024 * 1024 * 10))
    files: Express.Multer.File[],
  ) {
    if (!files || files.length === 0) {
      throw new BadRequestException('No files uploaded');
    }

    const uploadResults = await this.fileStorageService.uploadMultipleFiles(files);

    return {
      count: uploadResults.length,
      files: uploadResults,
    };
  }

  @Post('multiple-fields-upload')
  @Public()
  @UseInterceptors(
    FileFieldsInterceptor(
      [
        { name: 'images', maxCount: 3 },
        { name: 'avatars', maxCount: 2 },
      ],
      {
        limits: {
          fileSize: 10 * 1024 * 1024, // 10MB
          files: 5, // Tổng số file tối đa
        },
      },
    ), // Thêm options để validate sớm
  )
  @ApiOperation({ summary: 'Upload multiple fields(lưu ý số lượng file không đúng sẽ trả về unexpected fiedl name!)' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    description: 'Multiple file fields with same validation rules',
    schema: {
      type: 'object',
      properties: {
        images: {
          type: 'array',
          items: {
            type: 'string',
            format: 'binary',
          },
          description: 'Image files (max 3 files, 10MB each, jpg/png)',
        },
        avatars: {
          type: 'array',
          items: {
            type: 'string',
            format: 'binary',
          },
          description: 'Document files (max 2 files, 10MB each, pdf)',
        },
      },
    },
  })
  async uploadMultipleFieldsSameValidation(
    @UploadedFiles()
    files: {
      images?: Express.Multer.File[];
      avatars?: Express.Multer.File[];
    },
  ) {
    const allFiles = [...(files.images || []), ...(files.avatars || [])];

    if (allFiles.length === 0) {
      throw new BadRequestException('No files uploaded');
    }

    // Upload tất cả files cùng lúc
    const uploadResults = await this.fileStorageService.uploadMultipleFiles(allFiles);

    return {
      count: uploadResults.length,
      files: uploadResults,
    };
  }
}
