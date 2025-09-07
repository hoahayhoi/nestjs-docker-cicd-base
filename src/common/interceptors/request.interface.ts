import type { Request } from 'express';

export interface RequestWithContext extends Request {
  ctx: {
    warnings: string[];
    // Có thể thêm các trường khác nếu cần
  };
}
