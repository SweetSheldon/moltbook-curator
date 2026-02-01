import { ExceptionFilter, Catch, ArgumentsHost, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { Response, Request } from 'express';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      if (typeof exceptionResponse === 'string') {
        message = exceptionResponse;
      } else {
        const responseObj = exceptionResponse as any;
        message = responseObj.message || exception.message;
      }
    } else if (exception instanceof Error) {
      message = 'Internal server error';
      this.logger.error(`[${request.method}] ${request.url}`, {
        error: exception.message,
        stack: exception.stack,
      });
    }

    const isDevelopment = process.env.NODE_ENV === 'development';

    response.status(status).json({
      success: false,
      error: isDevelopment ? message : 'Internal server error',
      timestamp: new Date().toISOString(),
      path: request.url,
    });
  }
}
