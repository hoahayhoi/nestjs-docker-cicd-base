import { ApiProperty, PickType } from '@nestjs/swagger';
import { AppointmentCancelBy } from '@prisma/client';
import { IsEnum, IsInt, IsISO8601, IsNotEmpty } from 'class-validator';

import { CreateAppointmentRequestDto } from './create-appointment-request.dto';

export class CustomerCancelAppointmentRequestDTO extends PickType(CreateAppointmentRequestDto, ['cancelReason']) {}

export class CustomerCancelAppointmentResponseDTO extends PickType(CreateAppointmentRequestDto, [
  'currentStatus',
  'cancelReason',
  'cancelBy',
  'rescheduleCount',
]) {
  @ApiProperty({
    description: 'ID của lịch hẹn',
    example: 1,
    required: true,
  })
  @IsNotEmpty()
  @IsInt()
  appointmentId: number;

  @ApiProperty({
    description: 'Ai là người hủy lịch hẹn',
    enum: AppointmentCancelBy,
    example: AppointmentCancelBy.customer,
    required: true,
  })
  @IsNotEmpty()
  @IsEnum(AppointmentCancelBy)
  cancelBy: AppointmentCancelBy;

  @ApiProperty({
    description: 'Số lần đổi lịch',
    example: 0,
    default: 0,
    required: true,
  })
  @IsNotEmpty()
  @IsInt()
  rescheduleCount: number;

  @ApiProperty({
    description: 'Thời gian cập nhật cuối cùng (ISO 8601 format)',
    example: '2023-12-31T23:59:59.999Z',
    required: true,
  })
  @IsNotEmpty()
  @IsISO8601({ strict: true })
  updatedAt: string;
}

export class CustomerConfirmAppointmentResponseDTO extends PickType(CreateAppointmentRequestDto, [
  'currentStatus',
  'rescheduleCount',
]) {
  @ApiProperty({
    description: 'ID của lịch hẹn',
    example: 1,
    required: true,
  })
  @IsNotEmpty()
  @IsInt()
  appointmentId: number;

  @ApiProperty({
    description: 'Thời gian cập nhật cuối cùng (ISO 8601 format)',
    example: '2023-12-31T23:59:59.999Z',
    required: true,
  })
  @IsNotEmpty()
  @IsISO8601({ strict: true })
  updatedAt: string;
}
