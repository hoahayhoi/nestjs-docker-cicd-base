import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';

import { CreateDeviceDto } from './dto/create-device.dto';
import { UpdateDeviceDto } from './dto/update-device.dto';

import { DatabaseService } from '@/database/database.service';

@Injectable()
export class DevicesService {
  constructor(private prisma: DatabaseService) {}

  /**
   * Lấy danh sách các thiết bị cua người dùng theo ID
   * @param userId ID của người dùng
   * @returns Danh sách các thiết bị
   */
  async getDevices(userId: number) {
    return await this.prisma.devices.findMany({
      where: {
        userId: userId,
      },
    });
  }

  /**
   * Lấy danh sách device token trong bảng `device`
   * @param userIds Danh sách ID người dùng
   * @returns Danh sách device token
   */
  // async getDeviceTokens(userIds: number[]) {
  //   return await this.prisma.device.findMany({
  //     where: {
  //       userID: {
  //         in: userIds,
  //       },
  //     },
  //     select: {
  //       device_token: true,
  //     },
  //   });
  // }

  create(createDeviceDto: CreateDeviceDto) {
    return 'This action adds a new device';
  }

  findAll() {
    return `This action returns all devices`;
  }

  findOne(id: number) {
    return `This action returns a #${id} device`;
  }

  update(id: number, updateDeviceDto: UpdateDeviceDto) {
    return `This action updates a #${id} device`;
  }

  remove(id: number) {
    return `This action removes a #${id} device`;
  }
}
