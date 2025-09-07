import { ApiProperty } from '@nestjs/swagger';
import { AppointmentStatusEnum, ChangedBy } from '@prisma/client';

export class AppointmentStatusHistoryDto {
  @ApiProperty({
    description: 'The status of the appointment before the change',
    enum: AppointmentStatusEnum,
  })
  old_status: AppointmentStatusEnum | null;

  @ApiProperty({
    description: 'The status of the appointment after the change',
    enum: AppointmentStatusEnum,
  })
  new_status: AppointmentStatusEnum | null;

  @ApiProperty({
    description: 'The object that made the change',
    enum: ChangedBy,
  })
  changed_by: ChangedBy;

  @ApiProperty({
    description: 'Time of the change',
    type: Date,
  })
  created_at?: Date;
}
