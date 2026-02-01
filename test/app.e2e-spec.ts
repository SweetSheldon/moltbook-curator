import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';

describe('AppController (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('/api/health (GET)', () => {
    it('should return health status', () => {
      return request(app.getHttpServer())
        .get('/api/health')
        .expect(200)
        .expect((res) => {
          expect(res.body.success).toBe(true);
          expect(res.body.message).toContain('Moltbook Curator API');
          expect(res.body.timestamp).toBeDefined();
        });
    });
  });

  describe('/api/posts (GET)', () => {
    it('should return empty array initially', () => {
      return request(app.getHttpServer())
        .get('/api/posts')
        .expect(200)
        .expect((res) => {
          expect(res.body.success).toBe(true);
          expect(res.body.posts).toEqual([]);
          expect(res.body.count).toBe(0);
        });
    });
  });

  describe('/api/posts/top (GET)', () => {
    it('should return empty array initially', () => {
      return request(app.getHttpServer())
        .get('/api/posts/top?limit=10')
        .expect(200)
        .expect((res) => {
          expect(res.body.success).toBe(true);
          expect(res.body.posts).toEqual([]);
        });
    });
  });

  describe('/api/suggest (POST)', () => {
    it('should create a new suggestion', () => {
      return request(app.getHttpServer())
        .post('/api/suggest')
        .send({
          url: 'https://moltbook.com/posts/test123',
          description: 'Test post for e2e testing',
          suggested_by: 'TestBot',
        })
        .expect(201)
        .expect((res) => {
          expect(res.body.success).toBe(true);
          expect(res.body.message).toBe('Post suggested! 🦞');
          expect(res.body.post).toHaveProperty('id');
          expect(res.body.post.url).toBe('https://moltbook.com/posts/test123');
          expect(res.body.post.description).toBe('Test post for e2e testing');
          expect(res.body.post.votes).toBe(0);
        });
    });

    it('should return 400 for invalid URL', () => {
      return request(app.getHttpServer())
        .post('/api/suggest')
        .send({
          url: 'not-a-valid-url',
          description: 'Test',
        })
        .expect(400)
        .expect((res) => {
          expect(res.body.success).toBe(false);
          expect(res.body.error).toContain('URL must be a valid URL');
        });
    });

    it('should return 400 for missing required fields', () => {
      return request(app.getHttpServer())
        .post('/api/suggest')
        .send({
          description: 'Test without URL',
        })
        .expect(400)
        .expect((res) => {
          expect(res.body.success).toBe(false);
        });
    });

    it('should sanitize XSS in description', () => {
      const xssPayload = {
        url: 'https://moltbook.com/posts/test',
        description: '<script>alert("XSS")</script> Test',
        suggested_by: 'TestBot',
      };

      return request(app.getHttpServer())
        .post('/api/suggest')
        .send(xssPayload)
        .expect(201)
        .expect((res) => {
          // XSS should be sanitized
          expect(res.body.post.description).not.toContain('<script>');
          expect(res.body.post.description).toContain('Test');
        });
    });
  });

  describe('/api/vote/:id (POST)', () => {
    it('should vote for a post', async () => {
      // First, create a post
      const createResponse = await request(app.getHttpServer())
        .post('/api/suggest')
        .send({
          url: 'https://moltbook.com/posts/votetest',
          description: 'Test for voting',
          suggested_by: 'TestBot',
        });

      const postId = createResponse.body.post.id;

      // Now vote
      return request(app.getHttpServer())
        .post(`/api/vote/${postId}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.success).toBe(true);
          expect(res.body.message).toBe('Vote recorded! 🦞');
          expect(res.body.post.votes).toBe(1);
        });
    });

    it('should return 400 for invalid post ID format', () => {
      return request(app.getHttpServer())
        .post('/api/vote/invalid-id-format')
        .expect(400)
        .expect((res) => {
          expect(res.body.success).toBe(false);
          expect(res.body.error).toContain('Invalid post ID format');
        });
    });

    it('should return 404 for non-existent post', () => {
      return request(app.getHttpServer())
        .post('/api/vote/post_9999999999_nonexistent')
        .expect(404)
        .expect((res) => {
          expect(res.body.success).toBe(false);
          expect(res.body.error).toBe('Post not found');
        });
    });
  });

  describe('Security Headers', () => {
    it('should include security headers', () => {
      return request(app.getHttpServer())
        .get('/api/health')
        .expect(200)
        .expect('X-Content-Type-Options', /nosniff/)
        .expect('X-Frame-Options', /DENY/)
        .expect('X-XSS-Protection', /1; mode=block/);
        .expect('Strict-Transport-Security', /max-age=/);
    });

    it('should have CORS headers', () => {
      return request(app.getHttpServer())
        .get('/api/health')
        .expect(200)
        .expect('Access-Control-Allow-Origin', /\*/|https?:\/\/.+/);
    });
  });
});
