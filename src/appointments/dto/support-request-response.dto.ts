import { ApiProperty } from '@nestjs/swagger';
import { IssueType, SupportStatus } from '@prisma/client';

export class SupportRequestResponseDto {
  @ApiProperty({
    description: 'ID của yêu cầu hỗ trợ',
  })
  id: number;

  @ApiProperty({
    description: 'ID của appointment',
  })
  appointment_id: number;

  @ApiProperty({
    description: 'Loại vấn đề',
    enum: IssueType,
  })
  issue_type: IssueType;

  @ApiProperty({
    description: 'Mô tả vấn đề',
  })
  description: string;

  @ApiProperty({
    description: 'Trạng thái yêu cầu',
    enum: SupportStatus,
  })
  status: SupportStatus;

  @ApiProperty({
    description: 'Thời gian tạo',
  })
  created_at: Date;
}
