import { Controller, Post, Body, Req, HttpCode, HttpStatus } from '@nestjs/common';
import { Request } from 'express';
import { PostsService } from '../posts/posts.service';
import { CreateSuggestionDto } from './suggestion.dto';

@Controller('suggest')
export class SuggestionsController {
  constructor(private readonly postsService: PostsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async suggest(@Body() dto: CreateSuggestionDto, @Req() req: Request) {
    const post = await this.postsService.create(
      dto.url,
      dto.description || '',
      dto.suggested_by,
    );

    return {
      success: true,
      message: 'Post suggested!',
      post: {
        id: post.id,
        url: post.url,
        description: post.description,
        votes: post.votes,
        created_at: post.created_at,
      },
    };
  }
}
