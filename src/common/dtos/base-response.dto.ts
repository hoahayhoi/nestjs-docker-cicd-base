import { ApiProperty } from '@nestjs/swagger';

import type { ApiResponse } from '@/common/interceptors/response.interceptor';

export class BaseResponseDto<T> implements ApiResponse<T> {
  success: boolean;
  message: string;
  data: T | null;
  warnings?: string[];
  timestamp: string; // Di chuyển ra ngoài meta để phù hợp với ApiResponse

  constructor(partial: Partial<BaseResponseDto<T>>) {
    this.timestamp = new Date().toISOString();
    Object.assign(this, partial);
  }
}

export class GenericApiResponse<T> {
  @ApiProperty({ example: true })
  success: boolean;

  @ApiProperty({ example: 'Thành công' })
  message: string;

  @ApiProperty()
  data: T;

  @ApiProperty({ example: new Date().toISOString() })
  timestamp: string;
}
