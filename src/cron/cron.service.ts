import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { MoltbookService } from '../moltbook/moltbook.service';
import { PostsService } from '../posts/posts.service';
import { Post } from '../posts/post.interface';

@Injectable()
export class CronService {
  private readonly logger = new Logger(CronService.name);

  constructor(
    private readonly moltbookService: MoltbookService,
    private readonly postsService: PostsService,
  ) {}

  @Cron(CronExpression.EVERY_6_HOURS)
  async refreshPosts() {
    this.logger.log('Starting Moltbook posts refresh...');

    try {
      // Fetch posts from Moltbook
      const moltbookPosts = await this.moltbookService.fetchPosts('hot', 100);

      // Get existing posts
      const existingPosts = this.postsService.getAll();
      const existingIds = new Set(existingPosts.map((p) => p.id));

      // Merge posts: preserve curator votes
      const mergedPosts: Post[] = moltbookPosts.map((mbPost: any) => {
        const existing = existingPosts.find((p) => p.id === mbPost.id);
        return {
          id: mbPost.id,
          title: mbPost.title,
          content: mbPost.content,
          author: mbPost.author,
          submolt: mbPost.submolt,
          url: mbPost.url || `https://moltbook.com/posts/${mbPost.id}`,
          upvotes: mbPost.upvotes || 0,
          downvotes: mbPost.downvotes || 0,
          created_at: mbPost.created_at,
          // Preserve curator votes
          votes: existing?.votes || 0,
          last_voted_at: existing?.last_voted_at || null,
          synced_at: new Date().toISOString(),
        };
      });

      // Save merged posts
      this.postsService.updateAllPosts(mergedPosts);

      const newCount = moltbookPosts.filter((p: any) => !existingIds.has(p.id))
        .length;
      const withVotesCount = mergedPosts.filter((p) => p.votes > 0).length;

      this.logger.log(
        `Refresh complete: ${mergedPosts.length} total, ${newCount} new, ${withVotesCount} with votes`,
      );
    } catch (error) {
      this.logger.error('Refresh failed:', error.message);
    }
  }

  // Manual trigger via API
  async manualRefresh() {
    await this.refreshPosts();
  }
}
