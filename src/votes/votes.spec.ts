import { Test, TestingModule } from '@nestjs/testing';
import { VotesService } from './votes.service';
import { PostsService } from '../posts/posts.service';

describe('VotesService', () => {
  let service: VotesService;
  let postsService: PostsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [VotesService, PostsService],
    }).compile();

    service = module.get<VotesService>(VotesService);
    postsService = module.get<PostsService>(PostsService);

    // Clear test data
    postsService['posts'] = [];
  });

  describe('addVote', () => {
    it('should add a vote to existing post', async () => {
      const post = await postsService.create(
        'https://example.com/post',
        'Test post',
        'Bot1',
      );

      const result = await service.addVote(post.id);

      expect(result.success).toBe(true);
      expect(result.post.votes).toBe(1);
    });

    it('should increment votes multiple times', async () => {
      const post = await postsService.create(
        'https://example.com/post',
        'Test post',
        'Bot1',
      );

      await service.addVote(post.id);
      await service.addVote(post.id);
      await service.addVote(post.id);

      const result = await service.addVote(post.id);

      expect(result.post.votes).toBe(4);
    });

    it('should return error for non-existent post', async () => {
      const result = await service.addVote('post_invalid_id');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Post not found');
    });

    it('should update last_voted_at timestamp', async () => {
      const post = await postsService.create(
        'https://example.com/post',
        'Test post',
        'Bot1',
      );

      await service.addVote(post.id);

      const updated = await postsService.findById(post.id);

      expect(updated?.last_voted_at).toBeDefined();
      expect(updated?.last_voted_at).not.toBe(post.last_voted_at);
    });

    it('should handle concurrent votes', async () => {
      const post = await postsService.create(
        'https://example.com/post',
        'Test post',
        'Bot1',
      );

      // Simulate 100 concurrent votes
      const votes = Array.from({ length: 100 }, () =>
        service.addVote(post.id),
      );

      await Promise.all(votes);

      const updated = await postsService.findById(post.id);

      // All 100 votes should be recorded (mutex prevents race conditions)
      expect(updated?.votes).toBe(100);
    });
  });
});
