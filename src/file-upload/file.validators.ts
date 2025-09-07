import { FileTypeValidator, FileValidator, Injectable, MaxFileSizeValidator, ParseFilePipe } from '@nestjs/common';

export const fileValidators = [
  new MaxFileSizeValidator({ maxSize: 1024 * 1024 * 3 }), // 3MB
  new FileTypeValidator({ fileType: /(jpg|jpeg|png)$/ }),
];

export const filePipe = new ParseFilePipe({
  validators: fileValidators,
});

@Injectable()
export class ImageDimensionValidator extends FileValidator<{ width: number; height: number }> {
  async isValid(file: Express.Multer.File): Promise<boolean> {
    if (!file.mimetype.startsWith('image/')) return true;

    const dimensions = await this.getImageDimensions(file.buffer);

    return dimensions.width >= this.validationOptions.width && dimensions.height >= this.validationOptions.height;
  }

  private getImageDimensions(buffer: Buffer): Promise<{ width: number; height: number }> {
    return new Promise((resolve, reject) => {
      // Chuyển buffer thành data URL
      const dataUrl = `data:image/jpeg;base64,${buffer.toString('base64')}`;

      const image = new Image();

      image.onload = () => {
        resolve({ width: image.width, height: image.height });
      };
      image.onerror = (err) => {
        reject(new Error('Failed to load image'));
      };
      image.src = dataUrl; // Sử dụng data URL thay vì buffer trực tiếp
    });
  }

  buildErrorMessage(): string {
    return `Image must be at least ${this.validationOptions.width}x${this.validationOptions.height} pixels`;
  }
}

// // Sử dụng trong validator
// export const multipleFilesValidator = () => {
//   return (
//     new ParseFilePipeBuilder()
//       // ... các validator khác
//       .addValidator(new ImageDimensionValidator({ width: 300, height: 300 }))
//       .build()
//   );
// };

// Custom validator cho số lượng file tối đa
export class MaxFilesCountValidator extends FileValidator<{ maxCount: number }> {
  isValid(files: Express.Multer.File[] | Express.Multer.File): boolean {
    // Xử lý cả trường hợp nhận 1 file hoặc mảng files
    const fileArray = Array.isArray(files) ? files : [files];

    return fileArray.length <= this.validationOptions.maxCount;
  }

  buildErrorMessage(): string {
    return `Tối đa ${this.validationOptions.maxCount} file được phép upload`;
  }
}

// Factory function tạo pipe validation
export const multipleFilesValidator = (
  maxCount: number = 5,
  maxSize: number = 1024 * 1024 * 5, // 10MB mỗi file
  fileTypes: RegExp = /(jpg|jpeg|png)$/,
) => {
  return new ParseFilePipe({
    validators: [
      new MaxFilesCountValidator({ maxCount }),
      new MaxFileSizeValidator({ maxSize }),
      new FileTypeValidator({ fileType: fileTypes }),
    ],
    fileIsRequired: true,
  });
};
