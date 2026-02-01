import { ExceptionFilter, Catch, ArgumentsHost, HttpException, HttpStatus, Logger } from '@nestjs/common';

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
      // Log full error for debugging, but don't leak to client
      this.logger.error(`[${request.method}] ${request.url}`, {
        error: exception.message,
        stack: exception.stack,
      });
    }

    // Security: Don't leak internal details in production
    const isDevelopment = process.env.NODE_ENV === 'development';
    const responseMessage = isDevelopment ? message : 'Internal server error';

    // Log security events
    if (status >= 400 && status < 500) {
      this.logger.warn(`[Client Error] ${status} ${request.method} ${request.url}`, {
        status,
        message: responseMessage,
      });
    } else if (status >= 500) {
      this.logger.error(`[Server Error] ${status} ${request.method} ${request.url}`, {
        status,
        message: responseMessage,
      });
    }

    response.status(status).json({
      success: false,
      error: responseMessage,
      timestamp: new Date().toISOString(),
      path: request.url,
      // Only include details in development
      ...(isDevelopment && { details: exception }),
    });
  }
}
