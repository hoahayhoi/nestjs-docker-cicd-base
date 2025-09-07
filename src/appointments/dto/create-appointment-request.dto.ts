import { ApiProperty } from '@nestjs/swagger';
import { AppointmentStatusEnum, AppointmentCancelBy } from '@prisma/client';
import { IsOptional, IsNumber, IsNotEmpty, IsString, MaxLength, IsDateString, IsEnum } from 'class-validator';

export class CreateAppointmentRequestDto {
  @ApiProperty({
    description: 'Id khách hàng',
    required: false,
    example: 1,
  })
  @IsOptional()
  @IsNumber()
  userId?: number;

  @ApiProperty({
    description: 'Tên khách hàng',
    required: true,
    example: 'Nguyễn Văn A',
    maxLength: 100,
  })
  @IsNotEmpty()
  @IsString()
  @MaxLength(100)
  fullName: string;

  @ApiProperty({
    description: 'Số điện thoại khách hàng',
    required: true,
    example: '0987654321',
    maxLength: 20,
  })
  @IsNotEmpty()
  @IsString()
  @MaxLength(20)
  phone: string;

  @ApiProperty({
    description: 'Địa chỉ mail của khách hàng',
    required: false,
    example: 'example@email.com',
    maxLength: 255,
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  email?: string;

  @ApiProperty({
    description: 'Địa chỉ nhà của khách hàng',
    required: true,
    example: '123 Đường ABC, Quận 1, TP.HCM',
  })
  @IsNotEmpty()
  @IsString()
  address: string;

  @ApiProperty({
    description: 'Id đơn hàng dịch vụ',
    required: true,
    example: 1,
  })
  @IsNotEmpty()
  @IsNumber()
  serviceOrderId: number;

  @ApiProperty({
    description: 'Id chi tiết đơn hàng dịch vụ',
    required: true,
    example: 1,
  })
  @IsNotEmpty()
  @IsNumber()
  serviceOrderDetailId: number;

  @ApiProperty({
    description: 'Ngày thực hiện lịch hẹn (YYYY-MM-DD)',
    required: true,
    example: '2023-12-31',
  })
  @IsNotEmpty()
  @IsDateString()
  scheduledDate: string;

  @ApiProperty({
    description: 'Giờ cụ thể thực hiện lịch hẹn (HH:mm)',
    required: true,
    example: '14:30',
    maxLength: 10,
  })
  @IsNotEmpty()
  @IsString()
  @MaxLength(10)
  scheduledTime: string;

  @ApiProperty({
    description: 'Trạng thái cuộc hẹn',
    required: false,
    enum: AppointmentStatusEnum,
    default: AppointmentStatusEnum.booked,
  })
  @IsOptional()
  @IsEnum(AppointmentStatusEnum)
  currentStatus?: AppointmentStatusEnum;

  @ApiProperty({
    description: 'Ghi chú của khách hàng',
    required: false,
    example: 'Xin đến đúng giờ',
  })
  @IsOptional()
  @IsString()
  customerNote?: string;

  @ApiProperty({
    description: 'Ghi chú của nhân viên',
    required: false,
    example: 'Khách hàng yêu cầu kỹ thuật viên nam',
  })
  @IsOptional()
  @IsString()
  employeeNote?: string;

  @ApiProperty({
    description: 'Lý do hủy',
    required: false,
    example: 'Khách hàng bận đột xuất',
  })
  @IsOptional()
  @IsString()
  cancelReason?: string;

  @ApiProperty({
    description: 'Số lần đổi lịch',
    required: false,
    example: 0,
    default: 0,
  })
  @IsOptional()
  @IsNumber()
  rescheduleCount?: number;

  @ApiProperty({
    description: 'ID kỹ thuật viên',
    required: false,
    example: 1,
  })
  @IsOptional()
  @IsNumber()
  technicianId?: number;

  @ApiProperty({
    description: 'Chẩn đoán',
    required: false,
    example: 'Máy bị hỏng mainboard',
    default: '',
  })
  @IsOptional()
  @IsString()
  diagnosis?: string;

  @ApiProperty({
    description: 'Hủy bởi ai',
    required: false,
    enum: AppointmentCancelBy,
  })
  @IsOptional()
  @IsEnum(AppointmentCancelBy)
  cancelBy?: AppointmentCancelBy;
}
