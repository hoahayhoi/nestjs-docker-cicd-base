import { ApiProperty } from '@nestjs/swagger';
import { WarrantyStatus } from '@prisma/client';
import { IsInt, IsOptional, IsString, IsIn, Min } from 'class-validator';

export class CreateServiceOrderDetailDto {
  @IsInt()
  orderId: number;

  @IsInt()
  serviceId: number;

  @IsString()
  @IsIn(['pending', 'in_progress', 'completed', 'cancelled']) // Nếu bạn dùng enum status
  @IsOptional()
  status?: string;

  @IsInt()
  @Min(0)
  @IsOptional()
  rating?: number;

  @IsInt()
  @Min(0)
  @IsOptional()
  basePrice?: number;

  @IsInt()
  @Min(0)
  @IsOptional()
  additionalPrice?: number;

  @IsInt()
  @Min(0)
  @IsOptional()
  finalPrice?: number;
}

export class OrderDetailDto {
  @ApiProperty({
    description: 'ID of the service order detail',
    example: 1,
  })
  id: number;

  @ApiProperty({
    description: 'Name of the service',
    example: 'iPhone Screen Replacement',
  })
  serviceName: string;

  @ApiProperty({
    description: 'URL of the service image',
    example: 'https://example.com/image.jpg',
    required: false,
  })
  serviceImage?: string;
}

export class WarrantyInfoDto {
  @ApiProperty({
    description: 'Start date of the warranty',
    example: '2023-01-01T00:00:00.000Z',
    type: 'string',
    format: 'date-time',
  })
  startDate: Date;

  @ApiProperty({
    description: 'End date of the warranty',
    example: '2023-12-31T23:59:59.000Z',
    type: 'string',
    format: 'date-time',
  })
  endDate: Date;

  @ApiProperty({
    description: 'Remaining days of warranty',
    example: 100,
    minimum: 0,
  })
  remainingDays: number;

  @ApiProperty({
    description: 'Status of the warranty',
    enum: WarrantyStatus,
    example: WarrantyStatus.Active,
  })
  status: WarrantyStatus;

  @ApiProperty({
    description: 'Number of warranty claims made',
    example: 2,
    minimum: 0,
  })
  claimCount: number;
}

export class ServiceWarrantyResponseDto {
  @ApiProperty({
    description: 'ID of the warranty',
    example: 1,
  })
  warrantyId: number;

  @ApiProperty({
    description: 'Order detail information',
    type: OrderDetailDto,
  })
  orderDetail: OrderDetailDto;

  @ApiProperty({
    description: 'Warranty information',
    type: WarrantyInfoDto,
  })
  warrantyInfo: WarrantyInfoDto;
}
