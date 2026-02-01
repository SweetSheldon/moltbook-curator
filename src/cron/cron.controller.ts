import { Controller, Post, HttpCode, HttpStatus } from '@nestjs/common';
import { CronService } from './cron.service';

@Controller('refresh')
export class CronController {
  constructor(private readonly cronService: CronService) {}

  @Post()
  @HttpCode(HttpStatus.OK)
  async refresh() {
    // Simple protection via secret header (optional)
    // const secret = req.headers['x-cron-secret'];
    // if (secret !== process.env.CRON_SECRET) {
    //   return { success: false, error: 'Unauthorized' };
    // }

    await this.cronService.manualRefresh();

    const posts = this.cronService['postsService'].getAll();

    return {
      success: true,
      message: 'Posts refreshed successfully',
      stats: {
        total: posts.length,
        with_votes: posts.filter((p) => p.votes > 0).length,
      },
    };
  }
}
