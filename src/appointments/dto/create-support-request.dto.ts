import { ApiProperty } from '@nestjs/swagger';
import { IssueType } from '@prisma/client';
import { IsEnum, IsInt, IsNotEmpty, IsString } from 'class-validator';

export class CreateSupportRequestDto {
  @ApiProperty({
    description: 'ID của appointment cần hỗ trợ',
    example: 1,
  })
  @IsInt()
  @IsNotEmpty()
  appointment_id: number;

  @ApiProperty({
    description: 'Loại vấn đề cần hỗ trợ',
    enum: IssueType,
  })
  @IsEnum(IssueType)
  @IsNotEmpty()
  issue_type: IssueType;

  @ApiProperty({
    description: 'Mô tả chi tiết vấn đề',
    example: 'Nhân viên sửa chữa không đến đúng giờ',
  })
  @IsString()
  @IsNotEmpty()
  description: string;
}
