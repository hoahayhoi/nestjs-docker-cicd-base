import { ApiProperty } from '@nestjs/swagger';
import { RoleEnum } from '@prisma/client';
import { IsString, IsOptional, IsEmail, IsNotEmpty } from 'class-validator';

export class CreateUserDto {
  @ApiProperty({
    required: true,
    example: '123',
  })
  @IsString()
  password: string;

  @ApiProperty({
    required: true,
    example: '123456',
  })
  @IsString()
  @IsOptional()
  phone: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  address?: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  avatar?: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  fullName?: string;

  @IsOptional()
  isActive?: boolean;

  role: RoleEnum;
}
