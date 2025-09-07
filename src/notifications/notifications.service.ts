import { Injectable } from '@nestjs/common';
import { UserNotificationStatus } from '@prisma/client';

import { CreateNotificationDto, SendNotificationDto, SendNotificationToUsersDto } from './dto/create-notification.dto';
import { UpdateUserNotificationDto } from './dto/update-notification.dto';
import { FcmService } from './fcm/fcm.service';

import { DatabaseService } from '@/database/database.service';
import { DevicesService } from '@/devices/devices.service';

@Injectable()
export class NotificationsService {
  constructor(
    private prisma: DatabaseService,
    private devicesService: DevicesService,
    private readonly fcmService: FcmService,
  ) {}

  /**
   * Tạo thông báo mới
   * @param createNotificationDto Thông tin thông báo
   */
  async create(createNotificationDto: CreateNotificationDto) {
    return await this.prisma.notifications.create({
      data: {
        entity_id: createNotificationDto.entity_id,
        entity_type: createNotificationDto.entity_type,
        type: createNotificationDto.type,
        title: createNotificationDto.title,
        content: createNotificationDto.message,
        image_url: createNotificationDto.image_url,
        action_url: createNotificationDto.action_url,
        sent_by: createNotificationDto.sent_by,
        status: createNotificationDto.status,
      },
    });
  }

  /**
   * Lấy thông báo theo ID
   * @param id ID thông báo
   */
  async getNotificationById(id: number) {
    return await this.prisma.notifications.findUnique({
      where: {
        notification_id: id,
      },
    });
  }

  /**
   * Gửi thông báo tới các thiết bị của các người dùng
   * @param dto Đối tượng chứa ID thông báo và danh sách ID người dùng
   */
  /**
   * Gửi thông báo đến danh sách người dùng cụ thể.
   *
   * @param dto - Đối tượng chứa thông tin cần thiết để gửi thông báo.
   * @param dto.notificationId - ID của thông báo cần gửi.
   * @param dto.userIds - Danh sách ID của người dùng sẽ nhận thông báo.
   *
   * @throws {Error} Nếu thông báo không tồn tại.
   * @throws {Error} Nếu không tìm thấy thiết bị nào cho một người dùng cụ thể.
   *
   * @returns Một Promise trả về kết quả cập nhật trạng thái của thông báo.
   *
   * - Nếu ít nhất một thiết bị nhận thông báo thành công, trạng thái thông báo sẽ được cập nhật thành "sent".
   * - Nếu không có thiết bị nào nhận thông báo thành công, trạng thái thông báo sẽ được cập nhật thành "failed".
   */
  async sendNotificationToUsers(dto: SendNotificationToUsersDto) {
    const notification = await this.getNotificationById(dto.notificationId);

    if (!notification) {
      throw new Error('Notification not found');
    }

    return await this.prisma.$transaction(async (prisma) => {
      let isSent = false;

      for (const userId of dto.userIds) {
        const devices = await this.devicesService.getDevices(userId);

        if (devices.length === 0) {
          throw new Error(`No devices found for user ${userId}`);
        }

        const activeDevices = devices.filter((device) => device.status === 'active');

        const sendResults = await Promise.all(
          activeDevices.map(async (device) => {
            const result = await this.sendNotificationToDevice({
              deviceToken: device.device_token,
              title: notification.title,
              content: notification.content,
            });

            await prisma.userNotification.create({
              data: {
                entity_id: notification.entity_id,
                entity_type: notification.entity_type,
                notification_id: dto.notificationId,
                user_id: userId,
                device_id: device.device_id,
                status:
                  result == undefined
                    ? UserNotificationStatus.delivered
                    : result.success
                      ? UserNotificationStatus.delivered
                      : UserNotificationStatus.failed,
              },
            });

            return result == undefined ? false : result.success;
          }),
        );

        if (sendResults.includes(true)) {
          isSent = true;
        }
      }

      return prisma.notifications.update({
        where: { notification_id: dto.notificationId },
        data: { status: isSent ? 'sent' : 'failed' },
      });
    });
  }

  /**
   * Gửi thông báo đến thiết bị
   * @param dto Đối tượng chứa token của thiết bị , title, nội dung thông báo
   */
  async sendNotificationToDevice(dto: SendNotificationDto) {
    const messaging = this.fcmService?.getMessaging();

    if (!messaging) {
      throw new Error('Firebase messaging service is not initialized');
    }

    const message = {
      notification: {
        title: dto.title,
        body: dto.content,
      },
      token: dto.deviceToken, // Token của thiết bị nhận thông báo
    };

    try {
      const response = await messaging.send(message);

      console.log('Notification sent successfully:', response);

      return { success: true, messageId: response };
    } catch (error) {
      console.error('Error sending notification:', error);
      if (error instanceof Error) {
        return { success: false, error: error.message };
      }
    }
  }

  /**
   * Cập nhật trạng thái của user notification khi người dùng xem thông báo
   * @param updateUserNotificationDto Là đối tượng chứa ID notification, ID người dùng, ID thiết bị
   */
  async updateUserNotificationStatus(dto: UpdateUserNotificationDto) {
    try {
      const { notification_id, user_id, device_id } = dto;

      const updated = await this.prisma.userNotification.updateMany({
        where: {
          notification_id,
          user_id,
          device_id, // Đảm bảo cập nhật đúng thiết bị
        },
        data: {
          status: 'read', // Đánh dấu thông báo đã đọc
          read_at: new Date(), // Lưu thời gian đọc
        },
      });

      return {
        message: updated.count > 0 ? 'Notification status updated' : 'No matching notification found',
        updatedCount: updated.count,
      };
    } catch (error) {
      console.error('Error updating user notification:', error);
      throw new Error('Failed to update notification status');
    }
  }

  // findAll() {
  //   return `This action returns all notifications`;
  // }

  // findOne(id: number) {
  //   return `This action returns a #${id} notification`;
  // }

  // update(id: number, updateNotificationDto: UpdateNotificationDto) {
  //   return `This action updates a #${id} notification`;
  // }

  // remove(id: number) {
  //   return `This action removes a #${id} notification`;
  // }
}
