import { Controller, Get, Param, Query, DefaultValuePipe, ParseIntPipe } from '@nestjs/common';
import { PostsService } from './posts.service';

@Controller('posts')
export class PostsController {
  constructor(private readonly postsService: PostsService) {}

  @Get()
  async getAll(
    @Query('limit', new DefaultValuePipe(50), ParseIntPipe) limit: number,
  ) {
    const posts = await this.postsService.getAll(limit);
    return {
      success: true,
      posts,
      count: posts.length,
    };
  }

  @Get('top')
  async getTop(
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
  ) {
    const posts = await this.postsService.getTop(limit);
    return {
      success: true,
      posts,
      count: posts.length,
    };
  }

  @Get('archive/latest')
  async getLatestArchive() {
    const archive = await this.postsService.getLatestArchive();
    return {
      success: true,
      ...archive,
    };
  }

  @Get('cycle-info')
  getCycleInfo() {
    const now = new Date();
    const hours = now.getUTCHours();
    const cycleHour = Math.floor(hours / 4) * 4;
    const nextCycleHour = (cycleHour + 4) % 24;

    const cycleStart = new Date(now);
    cycleStart.setUTCHours(cycleHour, 0, 0, 0);

    const cycleEnd = new Date(cycleStart);
    cycleEnd.setUTCHours(cycleStart.getUTCHours() + 4);

    const msRemaining = cycleEnd.getTime() - now.getTime();
    const minutesRemaining = Math.floor(msRemaining / 60000);

    return {
      success: true,
      cycle: {
        current_start: cycleStart.toISOString(),
        current_end: cycleEnd.toISOString(),
        minutes_remaining: minutesRemaining,
        reset_hours_utc: [0, 4, 8, 12, 16, 20],
      },
    };
  }

  @Get(':id')
  async getById(@Param('id') id: string) {
    const post = await this.postsService.findById(id);
    if (!post) {
      return {
        success: false,
        error: 'Post not found',
      };
    }
    return {
      success: true,
      post,
    };
  }
}
