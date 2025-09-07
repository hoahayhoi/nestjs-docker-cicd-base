import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { MailerService } from '@nestjs-modules/mailer';
import { PaginatorTypes } from '@nodeteam/nestjs-prisma-pagination';
import { Prisma, RoleEnum, User } from '@prisma/client';
import { Cache } from 'cache-manager';

import { CreateUserAddressDto, DeleteUserAddressDto } from './dto/add-address.dto';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { PartialUpdate, UpdateUserPayload } from './interfaces/common.interface';

import { CreateAuthDto } from '@/auth/dto/create-auth.dto';
import { DecodedToken } from '@/auth/interfaces/common.interface';
import { hashPasswordHelper } from '@/common/helpers/util';
import { createPaginator, PaginationDto } from '@/common/pagination/paginationDto';
import { DatabaseService } from '@/database/database.service';

// const paginate: PaginatorTypes.PaginateFunction = paginator({
//   page: 1,
//   perPage: 10,
// });

@Injectable()
export class UsersService {
  constructor(
    private prisma: DatabaseService,
    private readonly mailerService: MailerService,
    private jwtService: JwtService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  async getUserByEmail(userWhereUniqueInput: { email: string }): Promise<User | null> {
    return await this.prisma.user.findUnique({
      where: userWhereUniqueInput,
    });
  }

  async getUserByPhone(userWhereUniqueInput: { phone: string }): Promise<User | null> {
    return await this.prisma.user.findUnique({
      where: userWhereUniqueInput,
    });
  }

  async getUserById(userWhereUniqueInput: { id: number }): Promise<User | null> {
    if (!userWhereUniqueInput.id) return null; // Kiểm tra nếu id không hợp lệ

    return await this.prisma.user.findUnique({
      where: { id: userWhereUniqueInput.id },
    });
  }

  async users(dto: PaginationDto): Promise<PaginatorTypes.PaginatedResult<User>> {
    const { page, perPage, where, orderKey, orderValue } = dto;

    // Chuyển đổi `where` từ string thành Prisma.UserWhereInput
    const prismaWhere: Prisma.UserWhereInput | undefined = where
      ? { fullName: { contains: where, mode: 'insensitive' } } // Tìm user theo tên
      : undefined;

    // Chọn các trường cần trả về
    const selectFields: Prisma.UserSelect = {
      id: true,
      fullName: true,
      email: true,
      avatar: true,
      phone: true,
    };

    const paginate = createPaginator(1, 10);

    return paginate(
      this.prisma.user,
      {
        where: prismaWhere,
        orderBy: orderKey ? { [orderKey]: orderValue } : { fullName: 'asc' },
        select: selectFields,
      },
      {
        page,
        perPage,
      },
    );
  }

  async createUser(data: CreateUserDto): Promise<Partial<User>> {
    const { password } = data;
    //hash password
    const hashPassword: string | undefined = await hashPasswordHelper(password);

    if (!hashPassword) {
      throw new BadRequestException('Mật khẩu không hợp lệ');
    }

    data.password = hashPassword;

    return await this.prisma.user.create({
      data: {
        ...data,
        fullName: data.fullName || '',
      },
      select: {
        id: true,
        phone: true,
        fullName: true,
      },
    });
  }

  async updateUser(id: number, data: UpdateUserDto): Promise<Partial<User>> {
    return await this.prisma.user.update({
      where: { id },
      data,
      select: {
        id: true,
        email: true,
        fullName: true,
        avatar: true,
      },
    });
  }

  // async updatePartial(id: number, data: Partial<User>): Promise<{ message: string }> {
  //   const filteredData: Partial<User> = Object.keys(data)
  //     .filter((key) => data[key] !== undefined)
  //     .reduce((obj, key) => {
  //       (obj as any)[key] = data[key];

  //       return obj;
  //     }, {});

  //   const user = await this.prisma.user.update({
  //     where: { id },
  //     data: filteredData,
  //   });

  //   return { message: `Cập nhật thành công user: ${user.id}` };
  // }

  async updatePartial(
    id: number,
    data: Prisma.UserUpdateInput, // Sử dụng chính xác kiểu Prisma generate
  ): Promise<{ message: string }> {
    const filteredData = Object.fromEntries(
      Object.entries(data).filter(([_, v]) => v !== undefined),
    ) as Prisma.UserUpdateInput;

    const user = await this.prisma.user.update({
      where: { id },
      data: filteredData,
    });

    return { message: `Updated user ${user.id}` };
  }

  // async updatePartial(id: number, data: PartialUpdate<UpdateUserPayload>): Promise<{ message: string }> {
  //   const filteredData = this.filterUndefined(data);

  //   const user = await this.prisma.user.update({
  //     where: { id },
  //     data: filteredData,
  //   });

  //   return { message: `Updated user ${user.id}` };
  // }

  // private filterUndefined<T extends object>(data: T): Partial<T> {
  //   return Object.fromEntries(Object.entries(data).filter(([_, v]) => v !== undefined)) as Partial<T>;
  // }

  async deleteUser(id: number): Promise<{ message: string }> {
    const user = await this.prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      throw new NotFoundException(`Người dùng với ID ${id} không tồn tại.`);
    }

    await this.prisma.user.delete({
      where: { id },
    });

    return { message: 'Xoá người dùng thành công!' };
  }

  async isEmailExist(userWhereUniqueInput: { email: string }) {
    const user = await this.prisma.user.findUnique({
      where: userWhereUniqueInput,
    });

    if (user) return true;

    return false;
  }

  /**
   * Xử lý đăng ký tài khoản người dùng.
   *
   * @param data - Dữ liệu đăng ký bao gồm email, số điện thoại, mật khẩu, jwtToken và họ tên.
   *
   * @throws {BadRequestException} Nếu cả email và số điện thoại đều không được cung cấp.
   * @throws {BadRequestException} Nếu email đã tồn tại trong hệ thống.
   * @throws {BadRequestException} Nếu số điện thoại đã tồn tại trong hệ thống.
   * @throws {BadRequestException} Nếu jwtToken không được cung cấp hoặc không hợp lệ.
   * @throws {BadRequestException} Nếu email hoặc số điện thoại không khớp với thông tin trong jwtToken.
   *
   * @returns Một đối tượng chứa thông tin người dùng vừa được tạo và thông báo thành công.
   */
  async handleRegister(data: CreateAuthDto) {
    const { phone, password, jwtToken, fullName } = data;

    // Kiểm tra nếu cả email và phone đều không có
    if (!phone) {
      throw new BadRequestException('Bạn phải cung cấp số điện thoại');
    }

    if (phone) {
      const isPhoneExist = await this.isPhoneExist({ phone });

      if (isPhoneExist) {
        throw new BadRequestException(`Số điện thoại đã tồn tại: ${phone}. Vui lòng sử dụng số khác.`);
      }
    }

    // Kiểm tra jwtToken
    if (!jwtToken) {
      throw new BadRequestException('jwtToken không được để trống');
    }
    // Giải mã jwtToken để lấy thông tin người dùng
    let decodedToken: DecodedToken;

    try {
      decodedToken = await this.jwtService.verifyAsync(jwtToken);
      if (!decodedToken) {
        throw new BadRequestException('jwtToken không hợp lệ');
      }
      if (phone && decodedToken.username !== phone) {
        throw new BadRequestException('Số điện thoại không hợp lệ');
      }
    } catch (error) {
      console.error('Lỗi khi giải mã jwtToken:', error);
      throw new BadRequestException('jwtToken không hợp lệ.');
    }

    // Tạo tài khoản người dùng
    const user = await this.createUser({
      phone: phone,
      password: password,
      fullName: fullName,
      isActive: true,
      role: RoleEnum.customer,
    });

    // Trả về phản hồi
    return {
      user: user,
      message: `Tạo tài khoản thành công!`,
    };
  }

  /**
   * Tạo một địa chỉ mới cho người dùng.
   *
   * @param data - Dữ liệu để tạo địa chỉ mới, bao gồm:
   *   - `id`: ID của người dùng.
   *   - `address`: Địa chỉ mới cần thêm.
   *   - `phone`: Số điện thoại liên kết với địa chỉ.
   *
   * @throws {BadRequestException} Nếu người dùng đã có tối đa 3 địa chỉ.
   * @throws {BadRequestException} Nếu địa chỉ và số điện thoại đã tồn tại.
   *
   * @returns Một đối tượng chứa thông báo thành công khi thêm địa chỉ.
   */
  async createUserAddress(data: CreateUserAddressDto) {
    // Lấy danh sách địa chỉ của user từ database
    const userAddresses = await this.getUserAddresses(data.id);

    // Kiểm tra nếu đã có 3 địa chỉ thì không cho thêm mới
    if (userAddresses.length >= 3) {
      throw new BadRequestException('Người dùng chỉ có thể có tối đa 3 địa chỉ.');
    }
    // Kiểm tra xem địa chỉ mới có bị trùng với địa chỉ đã có không
    const isDuplicate = userAddresses.some(
      (address) => address.address === data.address && address.phoneNumber === data.phone,
    );

    if (isDuplicate) {
      throw new BadRequestException(`Địa chỉ và số điện thoại đã tồn tại!.`);
    }

    await this.prisma.userAddress.create({
      data: {
        userId: data.id,
        phoneNumber: data.phone,
        address: data.address,
      },
    });

    return { message: 'Thêm địa chỉ thành công!' };
  }

  /**
   * Xóa một địa chỉ của người dùng.
   *
   * @param data - Dữ liệu cần thiết để xóa địa chỉ, bao gồm:
   *   - `id`: ID của địa chỉ cần xóa.
   *   - `userId`: ID của người dùng để xác minh quyền sở hữu địa chỉ.
   * @throws {BadRequestException} Nếu địa chỉ không tồn tại hoặc không thuộc về người dùng.
   * @returns Một đối tượng chứa thông báo xác nhận xóa địa chỉ thành công.
   */
  async deleteUserAddress(data: DeleteUserAddressDto) {
    // Kiểm tra xem địa chỉ có tồn tại và thuộc về user không
    const address = await this.prisma.userAddress.findUnique({
      where: { id: data.id },
    });

    if (!address || address.id !== data.userId) {
      throw new BadRequestException('Địa chỉ không tồn tại hoặc không thuộc về người dùng.');
    }

    // Xoá địa chỉ
    await this.prisma.userAddress.delete({
      where: { id: data.id },
    });

    return { message: 'Đã xoá địa chỉ thành công!' };
  }

  /**
   * Lấy danh sách tất cả các địa chỉ của một người dùng từ cơ sở dữ liệu.
   *
   * @param userId - ID của người dùng cần lấy danh sách địa chỉ.
   * @returns Một danh sách các địa chỉ của người dùng.
   * @throws {NotFoundException} Nếu người dùng không có địa chỉ nào.
   */
  async getUserAddresses(userId: number) {
    // Lấy danh sách tất cả các địa chỉ của user từ database
    const userAddresses = await this.prisma.userAddress.findMany({
      where: { userId: userId },
    });

    // Nếu user không có địa chỉ nào, có thể trả về thông báo hoặc danh sách rỗng
    if (!userAddresses.length) {
      throw new NotFoundException('Người dùng chưa có địa chỉ nào.');
    }

    return userAddresses;
  }

  async isPhoneExist(userWhereUniqueInput: { phone: string }) {
    const user = await this.prisma.user.findUnique({
      where: userWhereUniqueInput,
    });

    if (user) return true;

    return false;
  }

  /**
   * Thêm mới hoặc cập nhật thông tin thiết bị của người dùng.
   *
   * @param deviceData - Dữ liệu thiết bị cần thêm hoặc cập nhật.
   * @param deviceData.userId - ID của người dùng sở hữu thiết bị.
   * @param deviceData.token - Token của thiết bị (định danh duy nhất).
   * @param deviceData.type - Loại thiết bị ('ANDROID', 'IOS', hoặc 'WEB').
   * @param deviceData.osVersion - (Tuỳ chọn) Phiên bản hệ điều hành của thiết bị.
   * @param deviceData.appVersion - (Tuỳ chọn) Phiên bản ứng dụng trên thiết bị.
   *
   * @throws {Error} Nếu thiếu token hoặc loại thiết bị.
   * @throws {Error} Nếu số lượng thiết bị của người dùng vượt quá giới hạn cho phép.
   *
   * @returns Thông tin thiết bị sau khi được thêm mới hoặc cập nhật.
   */
  async upsertDevice(deviceData: {
    userId: number;
    token: string;
    type: 'ANDROID' | 'IOS' | 'WEB';
    osVersion?: string;
    appVersion?: string;
  }) {
    // 1. Validate dữ liệu đầu vào
    if (!deviceData.token || !deviceData.type) {
      throw new Error('Device token and type are required');
    }

    // 2. Kiểm tra số lượng thiết bị tối đa (ví dụ: 5 thiết bị/user)
    const MAX_DEVICES = 5;
    const deviceCount = await this.prisma.devices.count({
      where: { userId: deviceData.userId },
    });

    if (deviceCount >= MAX_DEVICES) {
      // Xoá thiết bị cũ nhất nếu vượt quá giới hạn
      const oldestDevice = await this.prisma.devices.findFirst({
        where: { userId: deviceData.userId },
        orderBy: { created_at: 'asc' },
      });

      if (oldestDevice) {
        await this.prisma.devices.delete({
          where: { device_id: oldestDevice.device_id },
        });
      }
    }

    // 3. Upsert device
    return this.prisma.devices.upsert({
      where: {
        device_token: deviceData.token,
      },
      update: {
        userId: deviceData.userId,
        device_type: deviceData.type,
        os_version: deviceData.osVersion,
        app_version: deviceData.appVersion,
        status: 'ACTIVE',
        last_activity: new Date(),
      },
      create: {
        userId: deviceData.userId,
        device_token: deviceData.token,
        device_type: deviceData.type,
        os_version: deviceData.osVersion,
        app_version: deviceData.appVersion,
        status: 'ACTIVE',
        last_activity: new Date(),
      },
    });
  }

  /**
   * Lấy tấc cả các device token của user(thiết bị còn active)
   * @param userId
   * @returns
   * @description
   * - Nếu không có device nào thì trả về mảng rỗng
   * - Nếu có device thì trả về mảng các device token
   * - Nếu có lỗi thì trả về null
   * - Nếu không tìm thấy user thì trả về null
   * - Nếu tìm thấy user nhưng không có device nào thì trả về mảng rỗng
   */
  async getDeviceTokens(userId: number): Promise<string[]> {
    // Kiểm tra xem user có tồn tại không
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
      },
    });

    if (!user) {
      throw new NotFoundException(`Người dùng với ID ${userId} không tồn tại.`);
    }

    const devices = await this.prisma.devices.findMany({
      where: {
        userId: userId,
        status: 'ACTIVE',
      },
      select: {
        device_token: true,
      },
    });

    if (!devices) {
      return [];
    }

    return devices.map((device) => device.device_token);
  }
}
