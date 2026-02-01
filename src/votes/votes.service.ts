import { Injectable } from '@nestjs/common';
import { PostsService } from '../posts/posts.service';

@Injectable()
export class VotesService {
  constructor(private readonly postsService: PostsService) {}

  addVote(postId: string) {
    const post = this.postsService.incrementVotes(postId);

    if (!post) {
      return { success: false, error: 'Post not found' };
    }

    return {
      success: true,
      post,
    };
  }
}
