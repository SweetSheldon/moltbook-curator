import { Controller, Get, Post, Delete, Param, Query, Headers, DefaultValuePipe, ParseIntPipe, UnauthorizedException, NotFoundException, ForbiddenException } from '@nestjs/common';
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

  // Specific routes MUST come before :id route
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

  @Get('cycle-info')
  getCycleInfo() {
    const now = new Date();
    const hours = now.getUTCHours();
    const cycleHour = Math.floor(hours / 4) * 4;

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

  @Get('archive/latest')
  async getLatestArchive() {
    const archive = await this.postsService.getLatestArchive();
    return {
      success: true,
      ...archive,
    };
  }

  @Post('reset')
  async reset(@Headers('x-reset-key') resetKey: string) {
    const expectedKey = process.env.RESET_KEY || 'moltbook-curator-reset-2026';
    if (resetKey !== expectedKey) {
      throw new UnauthorizedException('Invalid reset key');
    }

    const result = await this.postsService.archiveAndReset();
    return {
      success: true,
      message: 'Cycle reset complete',
      archived_count: result.archived_count,
      timestamp: new Date().toISOString(),
    };
  }

  // GDPR: Right to access - get all data for a specific submitter
  @Get('my-data')
  async getMyData(@Query('submitted_by') submittedBy: string) {
    if (!submittedBy) {
      return {
        success: false,
        error: 'submitted_by parameter is required',
      };
    }

    const data = await this.postsService.getDataBySubmitter(submittedBy);
    return {
      success: true,
      gdpr_export: true,
      submitted_by: submittedBy,
      posts: data.posts,
      total_posts: data.posts.length,
      total_votes_received: data.totalVotes,
      exported_at: new Date().toISOString(),
    };
  }

  // GDPR: Right to erasure - delete a specific post
  @Delete(':id')
  async deletePost(
    @Param('id') id: string,
    @Query('submitted_by') submittedBy: string,
  ) {
    if (!submittedBy) {
      throw new ForbiddenException('submitted_by parameter is required to verify ownership');
    }

    const post = await this.postsService.findById(id);
    if (!post) {
      throw new NotFoundException('Post not found');
    }

    if (post.submitted_by !== submittedBy) {
      throw new ForbiddenException('You can only delete your own posts');
    }

    await this.postsService.deleteById(id);
    return {
      success: true,
      message: 'Post deleted (GDPR right to erasure)',
      deleted_id: id,
    };
  }

  // Parameterized route MUST come last
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
