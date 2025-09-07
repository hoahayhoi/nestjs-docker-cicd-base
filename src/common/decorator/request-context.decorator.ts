import { createParamDecorator } from '@nestjs/common';

import type { RequestWithContext } from '../interceptors/request.interface';
import type { ExecutionContext } from '@nestjs/common';

export const ReqWithContext = createParamDecorator((data: unknown, ctx: ExecutionContext) => {
  const request = ctx.switchToHttp().getRequest<RequestWithContext>();

  request.ctx = request.ctx || { warnings: [] }; // Khởi tạo nếu chưa có

  return request;
});
