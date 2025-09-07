import { Injectable, NestInterceptor, ExecutionContext, CallHandler, HttpStatus } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Response as ExpressResponse } from 'express';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

import { RESPONSE_MESSAGE } from '@/common/decorator/customize';

export interface Response<T> {
  statusCode: HttpStatus;
  message: string;
  data: T | null;
  timestamp: string;
}

@Injectable()
export class TransformInterceptor<T> implements NestInterceptor<T, Response<T>> {
  constructor(private reflector: Reflector) {}

  intercept(context: ExecutionContext, next: CallHandler<T>): Observable<Response<T>> {
    const now = new Date();
    const response = context.switchToHttp().getResponse<ExpressResponse>();

    if (response.statusCode === undefined) {
      response.statusCode = HttpStatus.OK; // Mặc định là OK nếu không có statusCode
    }

    return next.handle().pipe(
      map((data: T) => {
        // Validate data không được undefined
        const responseData = data !== undefined ? data : null;

        // Lấy message từ decorator hoặc mặc định
        const message =
          this.reflector.get<string>(RESPONSE_MESSAGE, context.getHandler()) || 'Operation completed successfully';

        // Kiểm tra statusCode hợp lệ
        const statusCode = Number.isInteger(response.statusCode) ? response.statusCode : HttpStatus.OK;

        return {
          statusCode: statusCode ? statusCode : HttpStatus.OK,
          message,
          data: responseData,
          timestamp: now.toISOString(),
        };
      }),
    );
  }
}
