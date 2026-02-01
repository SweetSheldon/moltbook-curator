import { Module, MiddlewareConsumer, NestModule } from '@nestjs/common';
import helmet from 'helmet';
import { ConfigService } from '@nestjs/config';

export class SecurityMiddleware {
  static configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(helmet({
        contentSecurityPolicy: false, // Disabled for API (no HTML)
        crossOriginEmbedderPolicy: false,
        hsts: {
          maxAge: 31536000, // 1 year
          includeSubDomains: true,
          preload: true,
        },
        referrerPolicy: {
          policy: 'no-referrer',
        },
        // Additional security headers for API
        permittedCrossDomainPolicies: {
          permittedPolicies: 'none',
        },
        hidePoweredBy: true,
        xContentTypeOptions: {
          nosniff: true,
        },
        xDnsPrefetchControl: {
          allow: false,
        },
        xDownloadOptions: {
          noopen: true,
        },
        xFrameOptions: {
          action: 'deny',
        },
        xPermittedCrossDomainPolicies: {
          permittedPolicies: 'none',
        },
        xXssProtection: {
          enabled: true,
          mode: 'block',
        },
      }))
      .forRoutes('*');
  }
}
