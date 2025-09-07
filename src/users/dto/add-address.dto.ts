import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsNumber, IsPhoneNumber, Matches, Length } from 'class-validator';

export class CreateUserAddressDto {
  @ApiProperty({
    description: 'This is field is required',
    required: true,
    example: '1',
  })
  @IsNumber()
  @IsNotEmpty()
  id: number;

  @ApiProperty({
    description: 'This is field is required',
    required: true,
    example: '0912674016',
  })
  @IsString()
  @IsNotEmpty()
  @IsPhoneNumber()
  @Matches(/^0\d{9}$/, {
    message: 'Số điện thoại phải có 10 số, bắt đầu bằng 0',
  })
  phone: string;

  @ApiProperty({
    description: 'This is field is required',
    required: true,
    example: '77/30-QuangTrung-HCM',
  })
  @IsString()
  @IsNotEmpty()
  @Length(5, 100, { message: 'Địa chỉ phải từ 5 đến 100 ký tự' })
  address: string;
}

export class DeleteUserAddressDto {
  @IsNumber()
  @IsNotEmpty()
  @ApiProperty({ example: 1, description: 'ID của địa chỉ cần xóa' })
  id: number;

  @IsNumber()
  @IsNotEmpty()
  @ApiProperty({ example: 10, description: 'ID của user' })
  userId: number;
}
