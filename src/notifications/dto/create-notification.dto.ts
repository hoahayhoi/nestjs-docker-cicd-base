import { NotificationType, NotificationStatus, EntityType } from '@prisma/client';
import { IsString, IsOptional, IsInt, IsNotEmpty, IsDate } from 'class-validator';

export class CreateNotificationDto {
  @IsInt()
  entity_id: number; // ID của cuộc hẹn

  entity_type: EntityType;

  type: NotificationType;

  @IsString()
  title: string;

  @IsString()
  content: string; // Nội dung thông báo

  @IsString()
  message: string;

  @IsOptional()
  @IsString()
  image_url?: string;

  @IsOptional()
  @IsString()
  action_url?: string;

  @IsString() // default: 'system'
  @IsNotEmpty()
  sent_by: string; // Người gửi thông báo (system, user, admin ...)

  @IsNotEmpty()
  status?: NotificationStatus;

  // schedule_at DateTime
  @IsOptional()
  @IsDate()
  schedule_at?: Date; // Thời gian gửi thông báo (nếu có lịch trình gửi)
}

export class SendNotificationToUsersDto {
  notificationId: number;
  userIds: number[];
}

export class SendNotificationDto {
  @IsNotEmpty()
  @IsString()
  deviceToken: string; // Token của thiết bị nhận thông báo

  @IsNotEmpty()
  @IsString()
  title: string; // Tiêu đề thông báo

  @IsNotEmpty()
  @IsString()
  content: string; // Nội dung thông báo
}
