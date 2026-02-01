import { MiddlewareConsumer } from '@nestjs/common';
import helmet from 'helmet';

export class SecurityMiddleware {
  static configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(helmet({
        contentSecurityPolicy: false,
        crossOriginEmbedderPolicy: false,
      }))
      .forRoutes('*');
  }
}
