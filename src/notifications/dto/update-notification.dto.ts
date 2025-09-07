import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber } from 'class-validator';

export class UpdateUserNotificationDto {
  @ApiProperty({ example: 1 })
  @IsNotEmpty()
  @IsNumber()
  notification_id: number;

  @ApiProperty({ example: 2 })
  @IsNotEmpty()
  @IsNumber()
  user_id: number;

  @ApiProperty({ example: 3 })
  @IsNotEmpty()
  @IsNumber()
  device_id: number; // ID thiết bị để xác định chính xác
}
