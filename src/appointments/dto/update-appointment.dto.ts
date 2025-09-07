import { ApiProperty, PartialType } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional } from 'class-validator';

import { CreateAppointmentRequestDto } from './create-appointment-request.dto';

import { CreateAppointmentDto } from '@/service-orders/dto/create-service-order.dto';

export class UpdateAppointmentDto extends PartialType(CreateAppointmentRequestDto) {}

export class CustomerConfirmQuotiongRequestDto {
  @ApiProperty({
    description: 'Thanh toán bằng tiền mặt?',
  })
  @IsNotEmpty()
  isPaidInCash: boolean;
}

export class CustomerUpdateAppointmentRequestDto extends CreateAppointmentDto {
  @ApiProperty({ example: '0856738926' })
  @IsOptional()
  customerPhone: string;
}

export class CustomerUpdateAppointmentResponseDto extends CreateAppointmentDto {
  @ApiProperty({
    description: 'Id Appointment',
  })
  @IsNotEmpty()
  id: number;
}
