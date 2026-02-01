import { Controller, Get, Query, DefaultValuePipe, ParseIntPipe } from '@nestjs/common';
import { PostsService } from './posts.service';

@Controller('posts')
export class PostsController {
  constructor(private readonly postsService: PostsService) {}

  @Get('top')
  async getTop(
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
  ) {
    const posts = this.postsService.getTop(limit);
    return {
      success: true,
      posts,
      count: posts.length,
    };
  }

  @Get('recent')
  async getRecent(
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
  ) {
    const posts = this.postsService.getRecent(limit);
    return {
      success: true,
      posts,
      count: posts.length,
    };
  }

  @Get('feed')
  async getFeed(
    @Query('limit', new DefaultValuePipe(25), ParseIntPipe) limit: number,
  ) {
    const posts = this.postsService.getFeed(limit);
    return {
      success: true,
      posts,
      count: posts.length,
    };
  }
}
