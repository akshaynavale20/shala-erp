import {
  ExceptionFilter, Catch, ArgumentsHost,
  HttpException, HttpStatus, Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { ERRORS_MR } from '../errors/errors.mr';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message: string = ERRORS_MR.INTERNAL;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const res = exception.getResponse();
      if (typeof res === 'string') {
        message = res;
      } else if (typeof res === 'object' && res !== null) {
        const r = res as any;
        message = r.message || r.error || message;
        if (Array.isArray(message)) message = message.join('; ');
      }
    } else {
      this.logger.error(exception);
    }

    if (!message || message === ERRORS_MR.INTERNAL) {
      if (status === HttpStatus.NOT_FOUND) message = ERRORS_MR.NOT_FOUND;
      else if (status === HttpStatus.UNAUTHORIZED) message = ERRORS_MR.UNAUTHORIZED;
      else if (status === HttpStatus.FORBIDDEN) message = ERRORS_MR.FORBIDDEN;
      else if (status === HttpStatus.BAD_REQUEST) message = ERRORS_MR.BAD_REQUEST;
      else if (status === HttpStatus.CONFLICT) message = ERRORS_MR.CONFLICT;
      else if (status === HttpStatus.TOO_MANY_REQUESTS) message = ERRORS_MR.TOO_MANY_REQUESTS;
    }

    response.status(status).json({
      statusCode: status,
      message,
      timestamp: new Date().toISOString(),
      path: request.url,
    });
  }
}
