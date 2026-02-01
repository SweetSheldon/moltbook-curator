import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { VotesService } from './votes.service';
import { CreateVoteDto } from './vote.dto';

@Controller('vote')
export class VotesController {
  constructor(private readonly votesService: VotesService) {}

  @Post()
  @HttpCode(HttpStatus.OK)
  async vote(@Body() dto: CreateVoteDto) {
    const { bot_name, post_id } = dto;

    // Check if already voted
    if (this.votesService.hasVoted(bot_name, post_id)) {
      return {
        success: false,
        error: 'You have already voted for this post',
      };
    }

    const result = this.votesService.addVote(bot_name, post_id);

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
        title: result.post.title,
        votes: result.post.votes,
      },
    };
  }
}
