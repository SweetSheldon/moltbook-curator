import { Test, TestingModule } from '@nestjs/testing';
import { PostsService } from './posts.service';
import { Post } from './post.interface';

describe('PostsService', () => {
  let service: PostsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PostsService],
    }).compile();

    service = module.get<PostsService>(PostsService);
  });

  afterEach(() => {
    // Clean up test data
    service['posts'] = [];
  });

  describe('create', () => {
    it('should create a new post', async () => {
      const post = await service.create(
        'https://example.com/post1',
        'Test post',
        'TestBot',
      );

      expect(post).toHaveProperty('id');
      expect(post).toHaveProperty('url', 'https://example.com/post1');
      expect(post).toHaveProperty('description', 'Test post');
      expect(post).toHaveProperty('suggested_by', 'TestBot');
      expect(post).toHaveProperty('votes', 0);
      expect(post).toHaveProperty('created_at');
    });

    it('should return existing post if URL already exists', async () => {
      const post1 = await service.create(
        'https://example.com/duplicate',
        'First post',
        'Bot1',
      );

      const post2 = await service.create(
        'https://example.com/duplicate',
        'Second post',
        'Bot2',
      );

      expect(post1.id).toBe(post2.id);
      expect(post1.votes).toBe(0);
    });

    it('should use anonymous if suggested_by is not provided', async () => {
      const post = await service.create(
        'https://example.com/post2',
        'Anonymous post',
        undefined,
      );

      expect(post.suggested_by).toBe('anonymous');
    });

    it('should generate unique ID for each post', async () => {
      const post1 = await service.create(
        'https://example.com/post3',
        'Post 1',
        'Bot1',
      );
      const post2 = await service.create(
        'https://example.com/post4',
        'Post 2',
        'Bot2',
      );

      expect(post1.id).not.toBe(post2.id);
      expect(post1.id).toMatch(/^post_\d+_[a-z0-9]+$/);
      expect(post2.id).toMatch(/^post_\d+_[a-z0-9]+$/);
    });
  });

  describe('getAll', () => {
    it('should return empty array initially', async () => {
      const posts = await service.getAll();
      expect(posts).toEqual([]);
    });

    it('should return all posts', async () => {
      await service.create('https://example.com/1', 'Post 1', 'Bot1');
      await service.create('https://example.com/2', 'Post 2', 'Bot2');

      const posts = await service.getAll();
      expect(posts.length).toBe(2);
    });

    it('should respect limit parameter', async () => {
      await service.create('https://example.com/1', 'Post 1', 'Bot1');
      await service.create('https://example.com/2', 'Post 2', 'Bot2');
      await service.create('https://example.com/3', 'Post 3', 'Bot3');

      const posts = await service.getAll(2);
      expect(posts.length).toBe(2);
    });
  });

  describe('getTop', () => {
    it('should return posts sorted by votes', async () => {
      await service.create('https://example.com/1', 'Post 1', 'Bot1');
      await service.create('https://example.com/2', 'Post 2', 'Bot2');
      await service.create('https://example.com/3', 'Post 3', 'Bot3');

      // Vote for posts in different order
      await service.incrementPosts((await service.getAll())[1].id); // Post 2: 1 vote
      await service.incrementPosts((await service.getAll())[0].id); // Post 1: 1 vote
      await service.incrementPosts((await service.getAll())[1].id); // Post 2: 2 votes

      const topPosts = await service.getTop(3);

      expect(topPosts[0].id).toBe((await service.getAll())[1].id); // Post 2 has most votes
      expect(topPosts[1].votes).toBe(1); // Second has 1 vote
    });

    it('should respect limit', async () => {
      await service.create('https://example.com/1', 'Post 1', 'Bot1');
      await service.create('https://example.com/2', 'Post 2', 'Bot2');

      const topPosts = await service.getTop(1);
      expect(topPosts.length).toBe(1);
    });
  });

  describe('findById', () => {
    it('should find post by ID', async () => {
      const post = await service.create(
        'https://example.com/post',
        'Test post',
        'Bot',
      );

      const found = await service.findById(post.id);

      expect(found).toBeDefined();
      expect(found?.id).toBe(post.id);
      expect(found?.description).toBe('Test post');
    });

    it('should return undefined for non-existent ID', async () => {
      const found = await service.findById('post_invalid_id');
      expect(found).toBeUndefined();
    });
  });

  describe('incrementVotes', () => {
    it('should increment votes by 1', async () => {
      const post = await service.create(
        'https://example.com/post',
        'Test post',
        'Bot',
      );

      const updated = await service.incrementVotes(post.id);

      expect(updated?.votes).toBe(1);
    });

    it('should increment votes multiple times', async () => {
      const post = await service.create(
        'https://example.com/post',
        'Test post',
        'Bot',
      );

      await service.incrementVotes(post.id);
      await service.incrementVotes(post.id);
      await service.incrementVotes(post.id);

      const updated = await service.findById(post.id);

      expect(updated?.votes).toBe(3);
    });

    it('should update last_voted_at timestamp', async () => {
      const post = await service.create(
        'https://example.com/post',
        'Test post',
        'Bot',
      );

      await service.incrementVotes(post.id);

      const updated = await service.findById(post.id);

      expect(updated?.last_voted_at).toBeDefined();
      expect(updated?.last_voted_at).not.toBe(post.last_voted_at);
    });

    it('should return undefined for non-existent ID', async () => {
      const result = await service.incrementVotes('post_invalid_id');
      expect(result).toBeUndefined();
    });
  });

  describe('concurrent operations', () => {
    it('should handle concurrent create operations', async () => {
      const posts = await Promise.all([
        service.create('https://example.com/1', 'Post 1', 'Bot1'),
        service.create('https://example.com/2', 'Post 2', 'Bot2'),
        service.create('https://example.com/3', 'Post 3', 'Bot3'),
      ]);

      expect(posts.length).toBe(3);
      expect(posts[0].id).not.toBe(posts[1].id);
      expect(posts[1].id).not.toBe(posts[2].id);
    });

    it('should handle concurrent vote operations with mutex', async () => {
      const post = await service.create(
        'https://example.com/post',
        'Test post',
        'Bot',
      );

      // Simulate 100 concurrent votes
      const votes = Array.from({ length: 100 }, () =>
        service.incrementVotes(post.id),
      );

      await Promise.all(votes);

      const updated = await service.findById(post.id);

      // All 100 votes should be recorded (mutex prevents race conditions)
      expect(updated?.votes).toBe(100);
    });
  });
});
