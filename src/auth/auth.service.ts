import * as crypto from 'crypto';

import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { BadRequestException, Inject, Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { MailerService } from '@nestjs-modules/mailer';
import { RoleEnum, User } from '@prisma/client';
import { Cache } from 'cache-manager';
import * as admin from 'firebase-admin';
import { OAuth2Client } from 'google-auth-library';

import { CreateAuthDto, VerifyAuthDto } from './dto/create-auth.dto';
import { ForgotPasswordEmailDto, ResetPasswordDto, VerifyForgotPasswordDto } from './dto/forgot-password.dto';
import { DeviceInfoDto } from './dto/login-request.dto';
import { DecodedToken } from './interfaces/common.interface';

import { comparePasswordHelper, generateRandomNumber, hashPasswordHelper } from '@/common/helpers/util';
import { DatabaseService } from '@/database/database.service';
import { TechniciansService } from '@/technicians/technicians.service';
import { UsersService } from '@/users/users.service';

@Injectable()
export class AuthService {
  private client: OAuth2Client;

  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private configService: ConfigService,
    private techniciansService: TechniciansService,
    private prisma: DatabaseService,
    private readonly mailerService: MailerService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {
    this.client = new OAuth2Client(this.configService.get<string>('GOOGLE_CLIENT_ID_MOBILE') || '');
  }

  async validateUserByPhone(username: string, pass: string): Promise<User | null> {
    const user = await this.usersService.getUserByPhone({ phone: username });

    if (!user || !user.password) return null;
    const isValidPassword = await comparePasswordHelper(pass, user.password);

    if (!isValidPassword) return null;

    return user;
  }

  /**
   * Đăng nhập người dùng và tạo JWT token.
   *
   * @param user - Thông tin người dùng, bao gồm các thuộc tính như `id`, `phone`, `role`, v.v.
   * @param deviceInfo - Thông tin thiết bị của người dùng, bao gồm `token`, `type`, `osVersion`, và `appVersion`.
   *
   * @returns Một đối tượng chứa thông tin người dùng và token truy cập (`access_token`).
   *
   * - Nếu vai trò của người dùng là `Technician` hoặc `Customer`, thông tin thiết bị sẽ được cập nhật.
   * - Token JWT được tạo dựa trên thông tin người dùng (username, id, role).
   */
  async login(user: User, deviceInfo: DeviceInfoDto) {
    // 1. Tạo JWT token
    let payload: DecodedToken;

    payload = {
      username: user.phone,
      sub: user.id,
    };

    if (user.role == RoleEnum.technician) {
      const technician = await this.techniciansService.findByUserId(user.id);

      payload = {
        username: user.phone,
        sub: user.id,
        sub2: technician?.id,
      };
    }

    // 2. nếu là technician hoặc customer mới cập nhật thôn tin thiết bị
    if (user.role == RoleEnum.technician || user.role == RoleEnum.customer) {
      await this.usersService.upsertDevice({
        userId: user.id,
        token: deviceInfo.token,
        type: deviceInfo.type,
        osVersion: deviceInfo.osVersion,
        appVersion: deviceInfo.appVersion,
      });
    }

    return {
      user: {
        id: user.id,
        email: user.email,
        phone: user.phone,
        name: user.fullName,
        avatar: user.avatar,
        deviceInfo: deviceInfo || null,
      },
      access_token: this.jwtService.sign(payload),
    };
  }

  loginAdmin(user: User) {
    // 1. Tạo JWT token
    const payload: DecodedToken = {
      username: user.phone,
      sub: user.id,
    };

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.fullName,
        avatar: user.avatar,
      },
      access_token: this.jwtService.sign(payload),
    };
  }

  /**
   * Gửi otp đến email
   * @param email
   */
  async sendOtpEmail(email: string) {
    const otp = generateRandomNumber(6);
    const cacheKey = `otp_${email}`;

    await this.setCache(cacheKey, otp.toString());

    await this.mailerService.sendMail({
      to: email,
      subject: 'Mã xác thực OTP',
      template: 'register',
      context: {
        activationCode: otp,
      },
    });

    return { message: 'Gửi mã xác thực thành công' };
  }

  /**
   * Xác thực email hoặc số điện thoại. Nếu email, otp hoặc ID token hợp lệ thì trả về jwt để api đăng ký xác thực và tạo tài khoản cho người dùng
   * @param verifyDto
   * @returns
   */
  async verifyPhone(verifyDto: VerifyAuthDto) {
    const { idToken } = verifyDto;

    if (!idToken) {
      throw new UnauthorizedException('Thiếu thông tin xác thực');
    }

    try {
      const decodedToken = await admin.auth().verifyIdToken(idToken);
      const phoneNumber = decodedToken.phone_number;

      if (!phoneNumber) {
        throw new UnauthorizedException('Số điện thoại không hợp lệ');
      }
      // Tạo token JWT từ thông tin người dùng để api đăng ký xác thực
      const payload = {
        phoneNumber,
      };
      const jwt = this.jwtService.sign(payload);

      // Trả về token JWT
      return { jwt, phoneNumber };
    } catch (error) {
      throw new UnauthorizedException('ID token không hợp lệ');
    }
  }

  async setCache(key: string, value: string) {
    await this.cacheManager.set(key, value, 600000);
  }

  async getCache(key: string): Promise<any> {
    const value = await this.cacheManager.get(key);

    return value;
  }

  async handleRegister(registerDto: CreateAuthDto) {
    return await this.usersService.handleRegister(registerDto);
  }

  async verifyGoogleToken(token: string) {
    try {
      const ticket = await this.client.verifyIdToken({
        idToken: token,
        audience: this.client._clientId,
      });
      const payload = ticket.getPayload();

      if (!payload) {
        throw new UnauthorizedException('Invalid token');
      }

      const user = {
        email: payload.email,
        name: payload.name,
        picture: payload.picture,
      };

      // Tạo JWT từ thông tin user
      const jwt = this.jwtService.sign(user);

      return { jwt, user };
    } catch (error: unknown) {
      if (error instanceof Error) {
        console.error('Google Token Verification Error:', error.message);
      } else {
        console.error('Unknown error during token verification:', error);
      }

      throw new UnauthorizedException('Token verification failed');
    }
  }

  async initiatePasswordRecovery(forgotPasswordDto: ForgotPasswordEmailDto): Promise<any> {
    const { email } = forgotPasswordDto;

    // Check if user exists
    if (!email) {
      throw new BadRequestException('Email không được để trống');
    }
    if (!email) {
      throw new BadRequestException('Email không được để trống');
    }
    const user = await this.usersService.getUserByEmail({ email });

    if (!user) {
      throw new NotFoundException('Nếu email tồn tại, mã xác thực sẽ được gửi đến email của bạn.');
    }

    // Generate token and expiration
    const otp = generateRandomNumber(6);
    const resetToken = this.jwtService.sign(
      { email, otp },
      { expiresIn: '15m' }, // Token expires in 15 minutes
    );

    // Store token temporarily (in production, use Redis or database)
    const cacheKey = `otp_forgot_password_${email}`;
    const hashedOtp = crypto.createHash('sha256').update(otp.toString()).digest('hex');

    await this.setCache(cacheKey, hashedOtp);

    // Send email
    await this.mailerService.sendMail({
      to: email,
      subject: 'Mã xác thực OTP',
      template: 'forgot-password',
      context: {
        otpCode: otp,
      },
    });

    return {
      message: 'Mã xác thực đã được gửi đến email.',
      resetToken,
    };
  }

  async verifyForgotPassword(dto: VerifyForgotPasswordDto): Promise<any> {
    const { idToken } = dto;

    if (!idToken) {
      throw new UnauthorizedException('Thiếu thông tin xác thực');
    }
    try {
      const decodedToken = await admin.auth().verifyIdToken(idToken);
      const phoneNumber = decodedToken.phone_number;

      if (!phoneNumber) {
        throw new UnauthorizedException('Số điện thoại không hợp lệ');
      }
      // Tạo token JWT từ thông tin người dùng để api đăng ký xác thực
      const payload = {
        phoneNumber,
      };
      const jwt = this.jwtService.sign(payload);

      // Trả về token JWT
      return { jwt, phoneNumber, message: 'Xác thực thành công' };
    } catch (error) {
      throw new UnauthorizedException('ID token không hợp lệ');
    }
  }

  async resetPassword(resetPasswordDto: ResetPasswordDto): Promise<any> {
    const { phone, jwtToken, newPassword, confirmPassword } = resetPasswordDto;

    if (newPassword !== confirmPassword) {
      throw new UnauthorizedException('Mật khẩu không khớp');
    }

    // Kiểm tra nếu cả email và phone đều không có
    if (!phone) {
      throw new BadRequestException('Bạn phải cung cấp số điện thoại');
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
      throw new BadRequestException('jwtToken không hợp lệ');
    }

    const user = await this.usersService.getUserByPhone({ phone });

    // Check if user exists
    if (!user) {
      throw new NotFoundException('Người dùng không tồn tại');
    }
    // Hash the new password
    const hashedPassword: string | undefined = await hashPasswordHelper(newPassword);

    if (!hashedPassword) {
      throw new BadRequestException('Mật khẩu không hợp lệ');
    }
    // Update the user's password
    await this.usersService.updatePartial(user.id, {
      password: hashedPassword,
    });

    return {
      message: 'Mật khẩu đã được thay đổi thành công',
    };
  }

  async validateAdmin(email: string, password: string): Promise<Partial<User> | null> {
    const admin = await this.usersService.getUserByEmail({ email });

    if (!admin || !admin.password) return null;

    const isValidPassword = await comparePasswordHelper(password, admin.password);

    if (!isValidPassword) return null;

    return admin;
  }

  async getUserRoles(userId: number): Promise<{ role_id: number }[]> {
    return await this.prisma.userRole
      .findMany({
        where: { user_id: userId },
        select: {
          role: {
            select: {
              id: true,
            },
          },
        },
      })
      .then((userRoles) => userRoles.map((userRole) => ({ role_id: userRole.role.id })));
  }

  // Thêm vào PrismaAuthService
  async getUserPermissions(userId: number): Promise<string[]> {
    return await this.prisma.userRole
      .findMany({
        where: { user_id: userId },
        select: {
          role: {
            select: {
              permissions: {
                select: {
                  permission: {
                    select: {
                      permission_name: true,
                    },
                  },
                },
              },
            },
          },
        },
      })
      .then((result) =>
        result.flatMap((userRole) => userRole.role.permissions.map((p) => p.permission.permission_name)),
      );
  }

  // Lấy permissions của các role
  async getPermissionsForRoles(roleIds: number[]): Promise<string[]> {
    return this.prisma.rolePermission
      .findMany({
        where: { role_id: { in: roleIds } },
        select: { permission: { select: { permission_name: true } } },
      })
      .then((perms) => perms.map((p) => p.permission.permission_name));
  }

  // // Lấy permissions được gán trực tiếp cho user
  // async getUserDirectPermissions(userId: number): Promise<string[]> {
  //   return await this.prisma.userPermission
  //     .findMany({
  //       where: { user_id: userId },
  //       select: { permission: { select: { name: true } } },
  //     })
  //     .then((perms) => perms.map((p) => p.permission.name));
  // }

  // async getUserRoles(userId: number): Promise<{ role_name: string }[]> {
  //   const roles = await this.prisma.userRole.findMany({
  //     where: { user_id: userId },
  //   });
  // }

  // async initiatePasswordRecoveryPhone(
  //   forgotPasswordDto: ForgotPasswordPhoneDto,
  // ): Promise<any> {
  //   const { idToken } = forgotPasswordDto;

  //   // Verify the ID token
  //   let decodedToken;
  //   try {
  //     decodedToken = await admin.auth().verifyIdToken(idToken);
  //   } catch (error) {
  //     throw new UnauthorizedException('ID token không hợp lệ');
  //   }
  //   const phone = decodedToken.phone_number;
  //   if (!phone) {
  //     throw new UnauthorizedException('Số điện thoại không hợp lệ');
  //   }
  //   // Check if user exists
  //   const user = await this.usersService.getUserByPhone({ phone });
  //   if (!user) {
  //     throw new NotFoundException(
  //       'Không thể đổi mật khẩu.',
  //     );
  //   }
  //   // Generate token and expiration
  //   const otp = generateRandomNumber(6);
  //   const resetToken = this.jwtService.sign(
  //     { phone, otp },
  //     { expiresIn: '15m' }, // Token expires in 15 minutes
  //   );

  //   // Store token temporarily (in production, use Redis or database)
  //   const cacheKey = `otp_forgot_password_${phone}`;
  //   const hashedOtp = crypto
  //     .createHash('sha256')
  //     .update(otp.toString())
  //     .digest('hex');
  //   await this.setCache(cacheKey, hashedOtp);

  //   return {
  //     resetToken,
  //     phone,
  //   };
  // }
}
