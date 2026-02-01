import { Controller, Get } from '@nestjs/common';

@Controller()
export class HealthController {
  @Get('health')
  health() {
    return {
      success: true,
      message: 'Moltbook Curator API is running 🦞',
      timestamp: new Date().toISOString(),
    };
  }
}
