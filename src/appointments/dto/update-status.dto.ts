import { ApiProperty, PickType } from '@nestjs/swagger';
import { AppointmentStatusEnum } from '@prisma/client';
import { IsEnum, IsIn, IsNotEmpty, IsOptional, IsString } from 'class-validator';

import { StatusUpdateResponseDto } from './status-update-response.dto';

export class UpdateAppointmentStatusDto {
  @ApiProperty({
    description: 'Trạng thái mới của đơn hàng',
    enum: AppointmentStatusEnum,
  })
  @IsEnum(AppointmentStatusEnum)
  @IsNotEmpty()
  newStatus: AppointmentStatusEnum;

  @ApiProperty({
    description: 'Ghi chú khi thay đổi trạng thái',
    required: false,
  })
  @IsString()
  @IsOptional()
  note?: string;
}

export const TechnicianUpdateStatuses = {
  EN_ROUTE: AppointmentStatusEnum.en_route,
  ARRIVED: AppointmentStatusEnum.arrived,
  QUOTED: AppointmentStatusEnum.quoted,
  IN_PROGRESS: AppointmentStatusEnum.in_progress,
  TECHNICIAN_DONE: AppointmentStatusEnum.technician_done,
} as const;

export const TECHNICIAN_UPDATE_STATUS_VALUES = Object.values(TechnicianUpdateStatuses);

export class TechnicianUpdateStatusDto extends PickType(UpdateAppointmentStatusDto, ['note'] as const) {
  @ApiProperty({
    description: 'Trạng thái mới của đơn hàng',
    enum: TechnicianUpdateStatuses,
  })
  @IsIn(TECHNICIAN_UPDATE_STATUS_VALUES)
  @IsNotEmpty()
  newStatus: AppointmentStatusEnum;
}

export class TechnicianCompleteRepairDto extends PickType(TechnicianUpdateStatusDto, ['newStatus', 'note'] as const) {
  @ApiProperty({
    description: 'Các hình ảnh sau khi sửa chữa',
    required: true,
  })
  @IsNotEmpty()
  images: string[];
}

export class TechinicianStartRepairDto extends PickType(TechnicianUpdateStatusDto, ['newStatus', 'note'] as const) {
  @ApiProperty({
    description: 'Các hình ảnh trước khi sửa chữa',
    required: true,
  })
  @IsNotEmpty()
  images: string[];
}

export class TechnicianCompleteRepairResponseDto extends StatusUpdateResponseDto {
  @ApiProperty({
    description: 'Số hình ảnh đã lưu',
  })
  imageCount: number;
  @ApiProperty({
    description: 'Thông tin các hình ảnh đã lưu',
  })
  images: { id: number; url: string }[];
}
