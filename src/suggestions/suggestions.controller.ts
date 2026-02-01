import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { PostsService } from '../posts/posts.service';
import { CreateSuggestionDto } from './suggestion.dto';

@Controller('suggest')
export class SuggestionsController {
  constructor(private readonly postsService: PostsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async suggest(@Body() dto: CreateSuggestionDto) {
    const { url, description, suggested_by } = dto;

    const post = this.postsService.create(
      url,
      description,
      suggested_by,
    );

    return {
      success: true,
      message: 'Post suggested! 🦞',
      post,
    };
  }
}
