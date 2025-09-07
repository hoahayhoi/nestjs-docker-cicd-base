import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { ArrayNotEmpty, IsArray, IsInt, IsNotEmpty, IsNumber, IsString, Min, ValidateNested } from 'class-validator';

export class UpdateServiceOrderDetailQuoteRequestDto {
  @ApiProperty({
    example: 123,
    description: 'Id của Appointment thuộc ServiceOrderDetail này',
  })
  @IsNumber()
  appointmentId: number;

  @ApiProperty({
    example: 500000,
    description: 'Giá gốc của dịch vụ',
    minimum: 0,
  })
  @IsNumber()
  @Min(0)
  basePrice: number;

  @ApiProperty({
    example: 200000,
    description: 'Chi phí bổ sung cho dịch vụ',
    minimum: 0,
  })
  @IsNumber()
  @Min(0)
  additionalPrice: number;

  @ApiProperty({
    example: 'Hư công tơ',
    description: 'Chẩn đoán của kỹ thuật viên(chỉ bắt buộc khi newStatus là quoted)',
    required: false,
  })
  @IsNotEmpty()
  @IsString()
  diagnosis: string;

  @ApiProperty({
    example: ['https://example.com/image1.jpg', 'https://example.com/image2.jpg'],
    description: 'Các hình ảnh trước khi sửa chữa(sau khi phỏng đoán)',
    required: true,
  })
  @IsNotEmpty()
  @IsArray()
  images: string[];
}

export class SparePartItemDto {
  @ApiProperty({
    description: 'ID của phụ tùng',
    minimum: 1,
    example: 1,
  })
  @IsInt()
  @Min(1)
  sparePartId: number;

  @ApiProperty({
    description: 'Số lượng phụ tùng',
    minimum: 1,
    example: 5,
  })
  @IsInt()
  @Min(1)
  quantity: number;
}

export class AddSpartPartsDto {
  @ApiProperty({
    description: 'Danh sách phụ tùng cần thêm',
    type: [SparePartItemDto],
    example: [
      { sparePartId: 1, quantity: 2 },
      { sparePartId: 2, quantity: 3 },
    ],
  })
  @IsArray()
  @ArrayNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => SparePartItemDto)
  spareParts: SparePartItemDto[];
}
