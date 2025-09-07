import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsString, IsNotEmpty, IsOptional, ValidateNested, IsEmail } from 'class-validator';

export class DeviceInfoDto {
  @ApiProperty({
    example: 'device_token_123',
    description: 'Token của thiết bị',
    required: true,
  })
  @IsString()
  @IsNotEmpty()
  token: string;

  @ApiProperty({
    example: 'ANDROID',
    description: 'Loại thiết bị',
    enum: ['ANDROID', 'IOS', 'WEB'],
    required: true,
  })
  @IsString()
  @IsNotEmpty()
  type: 'ANDROID' | 'IOS' | 'WEB';

  @ApiPropertyOptional({
    example: '12.1.0',
    description: 'Phiên bản hệ điều hành',
  })
  @IsOptional()
  @IsString()
  osVersion?: string;

  @ApiPropertyOptional({
    example: '1.0.0',
    description: 'Phiên bản ứng dụng',
  })
  @IsOptional()
  @IsString()
  appVersion?: string;
}

export class LoginRequestDto {
  @ApiProperty({
    example: '0123456789',
    description: 'Số điện thoại để đăng nhập',
    required: true,
  })
  @IsString()
  @IsEmail()
  @IsNotEmpty({ message: 'emailOrPhone không được để trống' })
  phone: string;

  @ApiProperty({ example: 'password123' })
  @IsString()
  @IsNotEmpty()
  password: string;

  @ApiPropertyOptional({
    description: 'Thông tin thiết bị',
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => DeviceInfoDto)
  deviceInfo?: DeviceInfoDto;
}

export class LoginRequestAdminDto {
  @ApiProperty({
    example: 'admin@gmail.com',
    description: 'Email để đăng nhập',
    required: true,
  })
  @IsString()
  @IsEmail()
  @IsNotEmpty({ message: 'email không được để trống' })
  email: string;

  @ApiProperty({ example: 'password123' })
  @IsString()
  @IsNotEmpty()
  password: string;
}
