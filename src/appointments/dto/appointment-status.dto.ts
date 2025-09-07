import { ApiProperty } from '@nestjs/swagger';
import { AppointmentStatusEnum } from '@prisma/client';

export class AppointmentStatusDto {
  @ApiProperty({
    description: 'The current status of the appointment',
    enum: AppointmentStatusEnum,
  })
  currentStatus: AppointmentStatusEnum;

  @ApiProperty({
    description: 'The scheduled date of the appointment',
    type: Date,
  })
  scheduledDate: Date;

  @ApiProperty({
    description: 'The scheduled time of the appointment',
    example: '14:30',
  })
  scheduledTime: string;

  @ApiProperty({
    description: 'Notes from the employee',
    required: false,
  })
  employeeNote?: string;

  @ApiProperty({
    description: 'Notes from the customer',
    required: false,
  })
  customerNote?: string;

  @ApiProperty({
    description: 'Reason for cancellation if applicable',
    required: false,
  })
  cancelReason?: string;
}
