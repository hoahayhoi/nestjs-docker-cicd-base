import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsDate, IsNotEmpty, IsOptional, IsString, Matches } from 'class-validator';

export class CreateAppointmentDto {
  @IsNotEmpty()
  @ApiProperty({ example: '2025-03-10T10:00:00.000Z' }) // Ngày đặt lịch theo ISO format
  @IsDate()
  @Type(() => Date)
  scheduledDate: Date; // Ngày đặt lịch

  @IsNotEmpty()
  @ApiProperty({ example: '10:30' }) // Giờ đặt lịch
  @Matches(/^([01]\d|2[0-3]):([0-5]\d)$/, {
    message: 'scheduledTime phải có định dạng HH:mm (ví dụ: 10:30)',
  })
  scheduledTime: string; // Giờ đặt lịch

  @IsNotEmpty()
  @ApiProperty({ example: '129 Quang Trung, P Thanh Cong, Quan 12, TP HCM' }) // Địa chỉ khách hàng
  @IsString()
  customerAddress: string;

  @ApiProperty({ example: 'Khách hàng muốn đến sớm hơn 15 phút' })
  @IsOptional()
  customerNote?: string; // Ghi chú của khách
}

export class ServiceOrderDetailDto {
  @IsNotEmpty()
  @ApiProperty({ example: 101 }) // Mã dịch vụ
  serviceId: number; // Mã dịch vụ

  @ApiProperty({
    example: {
      scheduledDate: '2025-03-10T10:00:00.000Z',
      scheduledTime: '10:30',
      customerNote: 'Khách hàng muốn đến sớm hơn 15 phút',
    },
  })
  appointment?: CreateAppointmentDto; // Nếu có đặt lịch
}

export class CreateServiceOrderDto {
  @ApiProperty({ example: 'Tran Minh Hoa' })
  @IsNotEmpty()
  customerFullName: string;

  @ApiProperty({ example: '0856738926' })
  @IsNotEmpty()
  customerPhone: string;

  @ApiProperty({ example: '129 Quang Trung, P Thanh Cong, Quan 12, TP HCM' })
  @IsNotEmpty()
  customerAddress: string;

  @ApiProperty({ example: 2, required: false })
  @IsOptional()
  staffId?: number;

  @IsNotEmpty()
  @ApiProperty({
    example: [
      {
        serviceId: 101,
        appointment: {
          scheduledDate: '2025-03-10T10:00:00.000Z',
          scheduledTime: '10:30',
          customerAddress: '129 Quang Trung, P Thanh Cong, Quan 12, TP HCM',
          customerNote: 'Khách hàng muốn đến sớm hơn 15 phút',
        },
      },
      {
        serviceId: 102,
      },
    ],
  })
  details: ServiceOrderDetailDto[];
}
