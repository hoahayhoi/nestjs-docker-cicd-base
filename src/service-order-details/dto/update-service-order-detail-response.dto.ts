import { ApiProperty, PickType } from '@nestjs/swagger';

export class UpdateServiceOrderDetailResponseDto {
  @ApiProperty({
    example: 123,
    description: 'ID chi tiết đơn dịch vụ',
  })
  serviceOrderDetailId: number;

  @ApiProperty({
    example: 123,
    description: 'ID lịch hẹn',
  })
  appointmentId: number;

  @ApiProperty({
    example: 500000,
    description: 'Giá gốc của dịch vụ',
  })
  basePrice: number;

  @ApiProperty({
    example: 200000,
    description: 'Chi phí bổ sung cho dịch vụ',
  })
  additionalPrice: number;

  @ApiProperty({
    example: 700000,
    description: 'Tổng chi phí sau khi tính tất cả',
  })
  finalPrice: number;

  @ApiProperty({
    description: 'Số hình ảnh đã lưu',
  })
  imageCount: number;
  @ApiProperty({
    description: 'Thông tin các hình ảnh đã lưu',
  })
  images: { id: number; url: string }[];
}

export class AddSparePartsResponseDto extends PickType(UpdateServiceOrderDetailResponseDto, [
  'serviceOrderDetailId',
  'appointmentId',
]) {
  @ApiProperty({
    example: 700000,
    description: 'Tổng chi phí linh kiện đã thêm',
  })
  totalSparePartPrice: number;

  @ApiProperty({
    example: 10,
    description: 'Tổng số linh kiện đã thêm',
  })
  sparePartCount: number;
}
