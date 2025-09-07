import { ApiProperty, OmitType } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString, Length } from 'class-validator';

import { CreateAuthDto, VerifyAuthDto } from './create-auth.dto';

import { IsEmailOrPhone } from '@/common/decorator/customize';

export class ForgotPasswordEmailDto {
  @ApiProperty({ example: 'example@gmail.com' })
  @IsNotEmpty()
  @IsString()
  @IsEmail()
  email: string; // Can be email or phone number
}

export class ForgotPasswordPhoneDto {
  @ApiProperty({ example: 'id token' })
  @IsNotEmpty()
  @IsString()
  idToken: string; // Can be email or phone number
}

export class VerifyForgotPasswordDto extends VerifyAuthDto {}

export class ResetPasswordDto extends OmitType(CreateAuthDto, ['password', 'fullName'] as const) {
  @ApiProperty({ example: 'newPassword123' })
  @IsString()
  @IsNotEmpty({ message: 'Mật khẩu mới không được để trống' })
  newPassword: string;

  @ApiProperty({ example: 'newPassword123' })
  @IsString()
  @IsNotEmpty({ message: 'Xác nhận mật khẩu không được để trống' })
  confirmPassword: string;
}
