import { ApiProperty } from '@nestjs/swagger';
import { IssueType, SupportStatus } from '@prisma/client';

export class SupportRequestListItemDto {
  @ApiProperty({ description: 'ID yêu cầu hỗ trợ' })
  id: number;

  @ApiProperty({ description: 'Loại vấn đề', enum: IssueType })
  issue_type: IssueType;

  @ApiProperty({ description: 'Mô tả vấn đề' })
  description: string;

  @ApiProperty({ description: 'Trạng thái', enum: SupportStatus })
  status: SupportStatus;

  @ApiProperty({ description: 'Thời gian tạo' })
  created_at: Date;

  @ApiProperty({ description: 'Thông tin đơn hàng liên quan' })
  appointment: {
    id: number;
    scheduledDate: Date;
    scheduledTime: string;
    currentStatus: string;
  };
}
