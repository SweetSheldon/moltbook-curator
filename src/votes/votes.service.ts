import { Injectable } from '@nestjs/common';
import { PostsService } from '../posts/posts.service';

@Injectable()
export class VotesService {
  constructor(private readonly postsService: PostsService) {}

  addVote(postId: string) {
    const post = this.postsService.updateVotes(postId, true);

    if (!post) {
      return { success: false, error: 'Post not found' };
    }

    return {
      success: true,
      post,
    };
  }

  removeVote(postId: string) {
    const post = this.postsService.updateVotes(postId, false);

    if (!post) {
      return { success: false, error: 'Post not found' };
    }

    return {
      success: true,
      post,
    };
  }
}
