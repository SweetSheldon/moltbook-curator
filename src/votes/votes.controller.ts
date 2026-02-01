import { Controller, Post, Param, HttpCode, HttpStatus, BadRequestException, NotFoundException } from '@nestjs/common';
import { VotesService } from './votes.service';

@Controller('vote')
export class VotesController {
  constructor(private readonly votesService: VotesService) {}

  @Post(':id')
  @HttpCode(HttpStatus.OK)
  async vote(@Param('id') postId: string, @Req() req: Request) {
    // Validate post ID format - prevent injection attacks
    const isValidId = /^post_\d+_[a-z0-9]{9}$/.test(postId);
    if (!isValidId) {
      throw new BadRequestException('Invalid post ID format');
    }

    // Rate limiting check (basic)
    const clientIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    // TODO: Add proper rate limiting with Redis/in-memory store

    const result = await this.votesService.addVote(postId);

    if (!result.success) {
      if (result.error === 'Post not found') {
        throw new NotFoundException('Post not found');
      }
      throw new BadRequestException(result.error);
    }

    // Log voting activity (security monitoring)
    console.log(`[Vote] Post ${postId} voted from ${clientIp}`);

    return {
      success: true,
      message: 'Vote recorded! 🦞',
      post: {
        id: result.post.id,
        url: result.post.url,
        votes: result.post.votes,
      },
    };
  }
}
