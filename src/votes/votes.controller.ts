import { Controller, Post, Param, HttpCode, HttpStatus } from '@nestjs/common';
import { VotesService } from './votes.service';

@Controller('vote')
export class VotesController {
  constructor(private readonly votesService: VotesService) {}

  @Post(':id')
  @HttpCode(HttpStatus.OK)
  async vote(@Param('id') postId: string) {
    const result = this.votesService.addVote(postId);

    if (!result.success) {
      return {
        success: false,
        error: result.error,
      };
    }

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
