import { ApiProperty } from '@nestjs/swagger';
import { AppointmentStatusEnum } from '@prisma/client';

export class StatusUpdateResponseDto {
  @ApiProperty({
    description: 'ID của appointment',
  })
  id: number;

  @ApiProperty({
    description: 'Trạng thái mới của appointment',
    enum: AppointmentStatusEnum,
  })
  currentStatus: AppointmentStatusEnum;

  @ApiProperty({
    description: 'Thời gian cập nhật',
  })
  updatedAt: Date;
}
