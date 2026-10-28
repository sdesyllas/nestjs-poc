import { CallHandler, ExecutionContext, Injectable, Logger, NestInterceptor } from '@nestjs/common';
import { Request } from 'express';
import { Observable, finalize } from 'rxjs';

/** Logs method, URL and duration of every request without touching any controller. */
@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger('HTTP');

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest<Request>();
    const startedAt = Date.now();

    return next
      .handle()
      .pipe(finalize(() => this.logger.log(`${request.method} ${request.url} ${Date.now() - startedAt}ms`)));
  }
}
