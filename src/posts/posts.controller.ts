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
