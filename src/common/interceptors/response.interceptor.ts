import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Response as ResponsExpress } from 'express';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

import { BaseResponseDto } from '../dtos/base-response.dto';

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T | null;
  timestamp: string;
}

@Injectable()
export class ResponseInterceptor<T> implements NestInterceptor<T, ApiResponse<T>> {
  constructor(private readonly reflector: Reflector) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<BaseResponseDto<T>> {
    const httpContext = context.switchToHttp();
    const response: ResponsExpress = httpContext.getResponse<ResponsExpress>();

    this.setSecurityHeaders(response);

    const responseMessage = this.getDefaultMessage(context);

    return next.handle().pipe(
      map(
        (data: T) =>
          new BaseResponseDto({
            success: true,
            message: responseMessage,
            data: data ?? null,
            // timestamp sẽ được tự động thêm bởi constructor
          }),
      ),
    );
  }

  private getDefaultMessage(context: ExecutionContext): string {
    const handler = context.getHandler();
    const customMessage = this.reflector.get<string>('responseMessage', handler);

    return typeof customMessage === 'string' ? this.sanitizeString(customMessage) : 'Thao tác thành công';
  }

  private sanitizeData<T>(data: T): T | null {
    if (data === null || data === undefined) {
      return null;
    }

    return data;
  }

  private sanitizeString(input: string): string {
    // Loại bỏ các ký tự nguy hiểm hoặc không mong muốn
    return input.replace(/[<>"'`]/g, '');
  }

  private setSecurityHeaders(response: ResponsExpress): void {
    // Thiết lập các header bảo mật cơ bản
    response.setHeader('X-Content-Type-Options', 'nosniff');
    response.setHeader('X-Frame-Options', 'DENY');
    response.setHeader('X-XSS-Protection', '1; mode=block');
    response.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');

    // Chống clickjacking
    response.setHeader('Content-Security-Policy', "default-src 'self'");
  }
}
