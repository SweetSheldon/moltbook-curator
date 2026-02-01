import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { PostsService } from '../posts/posts.service';
import { CreateSuggestionDto } from './suggestion.dto';
import * as DOMPurify from 'dompurify';
import { isbot } from 'isbot';

@Controller('suggest')
export class SuggestionsController {
  constructor(private readonly postsService: PostsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async suggest(@Body() dto: CreateSuggestionDto, @Req() req: Request) {
    // Rate limiting check (basic, can be enhanced with throttler)
    const clientIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    // TODO: Add proper rate limiting with Redis/in-memory store

    // XSS prevention - sanitize description
    const sanitizedDescription = DOMPurify.sanitize(dto.description || '');

    const post = await this.postsService.create(
      dto.url,
      sanitizedDescription,
      dto.suggested_by,
    );

    // Don't log sensitive data, only metadata
    console.log(`[PostSuggestion] New post suggested from ${clientIp}: ${post.id}`);

    return {
      success: true,
      message: 'Post suggested! 🦞',
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
