import { Body, Controller, Patch } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

import { UpdateUserNotificationDto } from './dto/update-notification.dto';
import { NotificationsService } from './notifications.service';

import { Permissions } from '@/auth/decorators/permissions.decorator';
import { Permission } from '@/auth/decorators/permissions.enum';

@ApiTags('Notifications-Customer')
@Controller('notifications')
export class CustomerNotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @ApiOperation({
    summary: 'Cập nhật thông báo khi người dùng bấm vào thông báo từ bảng thông báo thành đã xem',
  })
  @Patch(':id/read')
  @Permissions(Permission.UpdateUserNotification)
  userReadNotification(@Body() updateNotificationDto: UpdateUserNotificationDto) {
    return this.notificationsService.updateUserNotificationStatus(updateNotificationDto);
  }
}
