import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { PaymentMethodEnum, ServiceOrderStatusEnum } from '@prisma/client';
import { IsEnum } from 'class-validator';

import { CreateServiceOrderDto } from './create-service-order.dto';

export class UpdateServiceOrderDto extends PartialType(CreateServiceOrderDto) {}

export class UpdateServiceOrderPaymentStatusRequest {
  // @ApiProperty({
  //   description: 'ID của technician thực hiện cập nhật',
  //   example: 5,
  //   type: Number,
  // })
  // technicianId: number;

  @ApiPropertyOptional({
    description: 'Phương thức thanh toán (cash / bank_transfer)',
    example: 'cash',
  })
  @IsEnum(PaymentMethodEnum)
  paymentMethod?: PaymentMethodEnum;
}

export class ServiceOrderPaymentStatusResponse {
  @ApiProperty({
    description: 'ID đơn hàng',
    example: 1,
    type: Number,
  })
  id: number;

  @ApiProperty({
    description: 'Trạng thái mới của đơn hàng',
    example: 'paid',
  })
  @IsEnum(ServiceOrderStatusEnum)
  status: ServiceOrderStatusEnum;

  @ApiProperty({
    description: 'Phương thức thanh toán',
    example: 'cash',
  })
  @IsEnum(PaymentMethodEnum)
  paymentMethod: PaymentMethodEnum | undefined;

  @ApiProperty({
    description: 'Ngày giờ cập nhật',
    example: '2023-05-15T10:00:00Z',
    type: String,
    format: 'date-time',
  })
  updatedAt: Date | undefined;

  @ApiProperty({
    description: 'ID người cập nhật',
    example: 5,
    type: Number,
  })
  updatedBy: number | undefined;
}
