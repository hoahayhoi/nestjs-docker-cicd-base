import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsOptional, IsString, Matches } from 'class-validator';

export class CreateAuthDto {
  @ApiProperty({ example: '0746386748' })
  @IsNotEmpty({ message: 'Số điện thoại không được để trống' })
  @Matches(/^\+?\d{8,15}$/, {
    message: 'Số điện thoại không hợp lệ',
  })
  phone: string;

  @ApiProperty({ example: 'password123' })
  @IsNotEmpty({ message: 'password không được để trống' })
  password: string;

  @ApiProperty({ example: 'Hoa Tran' })
  @IsOptional()
  fullName: string;

  @ApiProperty({ example: 'jwt token' })
  @IsNotEmpty({ message: 'jwtToken không được để trống' })
  @IsString()
  jwtToken: string;
}

export class VerifyAuthDto {
  @ApiProperty({ example: 'ID token', required: false })
  @IsNotEmpty({ message: 'idToken không được để trống' })
  @IsString()
  idToken?: string;
}

export class ChangePasswordAuthDto {
  @IsNotEmpty({ message: 'code không được để trống' })
  code: string;

  @IsNotEmpty({ message: 'password không được để trống' })
  password: string;

  @IsNotEmpty({ message: 'confirmPassword không được để trống' })
  confirmPassword: string;

  @IsNotEmpty({ message: 'email không được để trống' })
  email: string;
}

export class SendOtpEmailDto {
  @ApiProperty({
    description: 'Email để gửi mã xác thực',
    example: 'example@gmail.com',
  })
  @IsEmail()
  email: string;
}
