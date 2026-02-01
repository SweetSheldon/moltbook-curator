import { Controller, Post, Param, Req, HttpCode, HttpStatus, BadRequestException, NotFoundException } from '@nestjs/common';
import { Request } from 'express';
import { VotesService } from './votes.service';

@Controller('vote')
export class VotesController {
  constructor(private readonly votesService: VotesService) {}

  @Post(':id')
  @HttpCode(HttpStatus.OK)
  async vote(@Param('id') postId: string, @Req() req: Request) {
    // Validate post ID format
    const isValidId = /^(post|proj)_\d+_[a-z0-9]+$/.test(postId);
    if (!isValidId) {
      throw new BadRequestException('Invalid post ID format');
    }

    const result = await this.votesService.addVote(postId);

    if (!result.success) {
      if (result.error === 'Post not found') {
        throw new NotFoundException('Post not found');
      }
      throw new BadRequestException(result.error);
    }

    return {
      success: true,
      message: 'Vote recorded!',
      post: {
        id: result.post.id,
        url: result.post.url,
        votes: result.post.votes,
      },
    };
  }
}
