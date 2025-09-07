import { Controller, Get, Post, Body, UseGuards, Request } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiOperation } from '@nestjs/swagger';
import { User } from '@prisma/client';

import { AuthService } from './auth.service';
import { CreateAuthDto, VerifyAuthDto } from './dto/create-auth.dto';
import { ForgotPasswordEmailDto, ResetPasswordDto, VerifyForgotPasswordDto } from './dto/forgot-password.dto';
import { DeviceInfoDto, LoginRequestAdminDto, LoginRequestDto } from './dto/login-request.dto';
import { DecodedToken } from './interfaces/common.interface';
import { AdminAuthGuard } from './passport/guard/admin-auth.guard';
import { LocalAuthGuard } from './passport/guard/local-auth.guard';

import { Public, ResponseMessage } from '@/common/decorator/customize';

@ApiBearerAuth()
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @ApiOperation({ summary: 'Đăng nhập local' })
  @Post('login')
  @Public()
  @UseGuards(LocalAuthGuard)
  @ApiBody({ type: LoginRequestDto })
  @ResponseMessage('Fetch login')
  handleLogin(@Request() req: { user: User & { deviceInfo: DeviceInfoDto } }) {
    const user = req.user;

    const deviceInfo = user?.deviceInfo;

    return this.authService.login(user, deviceInfo);
  }

  @ApiOperation({ summary: 'Đăng nhập admin' })
  @Post('login-admin')
  @Public()
  @UseGuards(AdminAuthGuard)
  @ApiBody({ type: LoginRequestAdminDto })
  @ResponseMessage('Fetch login admin')
  handleLoginAdmin(@Request() req: { user: User }) {
    const user = req.user;

    return this.authService.loginAdmin(user);
  }

  /**
   * API xác thực email hoặc số điện thoại
   * @param codeDto
   * @returns token để api đăng ký xác thực và tạo tài khoản cho người dùng
   */
  @ApiOperation({ summary: 'Xác thực email hoặc số điện thoại' })
  @Post('verify-phone')
  @Public()
  verifyEmail(@Body() verifyDto: VerifyAuthDto) {
    return this.authService.verifyPhone(verifyDto);
  }

  /**
   * API đăng ký tài khoản
   * @param registerDto
   * @returns
   */
  @ApiOperation({
    summary: 'Đăng ký local',
    description: 'Phải xác thực email hoặc số điện thoại trước khi đăng ký tài khoản',
  })
  @Post('register')
  @Public()
  register(@Body() registerDto: CreateAuthDto) {
    return this.authService.handleRegister(registerDto);
  }

  @ApiOperation({ summary: 'Thông tin cá nhân' })
  @Get('me')
  getAccountInfor(@Request() request: { user: DecodedToken }) {
    return request.user;
  }

  @ApiOperation({ summary: 'Kiểm tra token khi đăng nhập bằng google' })
  @Public()
  @Post('google')
  async googleLogin(@Body('token') token: string) {
    return this.authService.verifyGoogleToken(token);
  }

  @Post('forgot-password-email-account')
  @Public()
  @ApiOperation({
    summary: 'Yêu cầu reset password cho tài khoản đăng ký bằng email',
  })
  async forgotPassword(@Body() forgotPasswordEmailDto: ForgotPasswordEmailDto): Promise<any> {
    await this.authService.initiatePasswordRecovery(forgotPasswordEmailDto);

    return {
      success: true,
      message: 'If your email is registered, you will receive a otp in your mail.',
    };
  }

  @Post('verify-forgot-password')
  @Public()
  @ApiOperation({
    summary: 'Xác thực mã otp để reset password cho tài khoản đăng ký bằng email',
  })
  async verifyForgotPassword(@Body() verifyForgotPasswordDto: VerifyForgotPasswordDto): Promise<any> {
    return await this.authService.verifyForgotPassword(verifyForgotPasswordDto);
  }

  @Post('reset-password')
  @Public()
  @ApiOperation({ summary: 'Reset password' })
  async resetPassword(@Body() resetPasswordDto: ResetPasswordDto): Promise<any> {
    return await this.authService.resetPassword(resetPasswordDto);
  }
}
