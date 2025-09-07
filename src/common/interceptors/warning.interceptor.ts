import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

interface ResponseWithWarnings<T> {
  data: T;
  warnings?: string[]; // Hoặc bất kỳ kiểu warning nào bạn định nghĩa
}

interface RequestWithContext {
  ctx?: {
    warnings: string[]; // Kiểu cụ thể cho warnings
  };
}

@Injectable()
export class WarningInterceptor<T> implements NestInterceptor<T, ResponseWithWarnings<T>> {
  intercept(context: ExecutionContext, next: CallHandler<T>): Observable<ResponseWithWarnings<T>> {
    const req = context.switchToHttp().getRequest<RequestWithContext>();

    // Khởi tạo context nếu chưa có
    req.ctx = req.ctx || { warnings: [] };

    return next.handle().pipe(
      map((data: T) => {
        const response: ResponseWithWarnings<T> = { data };

        if (req?.ctx == undefined) {
          return response;
        }

        if (req?.ctx.warnings.length == undefined) {
          return response;
        }

        if (req.ctx?.warnings?.length > 0) {
          response.warnings = req.ctx.warnings;
        }

        return response;
      }),
    );
  }
}
