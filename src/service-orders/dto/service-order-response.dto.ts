import { ApiProperty, PickType } from '@nestjs/swagger';

import { ServicesDto } from '@/services/dto/services.dto';

export class AppointmentInServiceOrderDto {
  @ApiProperty({ description: 'ID của lịch hẹn', example: 1 })
  id: number;

  @ApiProperty({ description: 'ID chi tiết đơn dịch vụ', example: 1 })
  serviceOrderDetailId: number;

  @ApiProperty({ description: 'Ngày hẹn (YYYY-MM-DD)', example: '2023-12-31' })
  scheduledDate: Date;

  @ApiProperty({ description: 'Giờ hẹn (HH:mm)', example: '14:30' })
  scheduledTime: string;

  @ApiProperty({ description: 'Trạng thái hiện tại', example: 'booked' })
  currentStatus: string;
}

export class ServiceDetailInOrderDto {
  @ApiProperty({ description: 'ID chi tiết dịch vụ', example: 1 })
  id: number;

  @ApiProperty({ description: 'ID dịch vụ', example: 1 })
  serviceId: number;

  @ApiProperty({ description: 'Trạng thái dịch vụ', example: 'completed' })
  status: string;

  @ApiProperty({ description: 'Giá cuối cùng', example: 500000 })
  finalPrice: number;
}

export class ServiceOrderResponseDto {
  @ApiProperty({ description: 'ID đơn hàng dịch vụ', example: 1 })
  id: number;

  @ApiProperty({ description: 'Trạng thái đơn hàng', example: 'processing' })
  status: string;

  @ApiProperty({ description: 'Ngày đặt hàng (YYYY-MM-DD)', example: '2023-12-01' })
  orderDate: string;

  @ApiProperty({ description: 'Tổng số tiền', example: 1500000 })
  totalAmount: number;

  @ApiProperty({ description: 'ID khách hàng', example: 1 })
  customerId: number;

  @ApiProperty({
    description: 'Thông tin lịch hẹn (nếu có)',
    type: AppointmentInServiceOrderDto,
    required: false,
  })
  appointment?: AppointmentInServiceOrderDto;

  @ApiProperty({
    description: 'Danh sách chi tiết dịch vụ',
    type: [ServiceDetailInOrderDto],
  })
  serviceDetails: ServiceDetailInOrderDto[];

  @ApiProperty({
    description: 'Danh sách chi tiết dịch vụ',
    type: [ServiceDetailInOrderDto],
  })
  invalidServiceDetails: ServiceDetailInOrderDto[];
}

export class ServiceOrderDetailItemDto extends PickType(ServicesDto, ['name', 'description', 'images'] as const) {
  @ApiProperty({ description: 'ID chi tiết đơn hàng dịch vụ', example: 1 })
  id: number;

  @ApiProperty({
    description: 'Giá cuối cùng của chi tiết đơn hàng',
  })
  finalPrice: number | null;
}

export class ServiceOrderItemHistoryResponseDto extends PickType(ServiceOrderResponseDto, [
  'id',
  'status',
  'totalAmount',
]) {
  @ApiProperty({
    description: 'Danh sách dịch vụ trong đơn hàng',
    type: [ServiceOrderDetailItemDto],
  })
  serviceOrderDetails: ServiceOrderDetailItemDto[];
}
