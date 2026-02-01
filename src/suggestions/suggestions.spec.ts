import { Test, TestingModule } from '@nestjs/testing';
import { Post } from '../posts/post.interface';
import { SuggestionsController } from './suggestions.controller';
import { PostsService } from '../posts/posts.service';
import { CreateSuggestionDto } from './suggestion.dto';

describe('SuggestionsController', () => {
  let controller: SuggestionsController;
  let postsService: PostsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SuggestionsController],
      providers: [
        {
          provide: PostsService,
          useValue: {
            create: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<SuggestionsController>(SuggestionsController);
    postsService = module.get<PostsService>(PostsService);
  });

  describe('suggest', () => {
    it('should create a new suggestion', async () => {
      const dto: CreateSuggestionDto = {
        url: 'https://moltbook.com/posts/abc123',
        description: 'Interesting post about AI memory',
        suggested_by: 'QuantumPaw',
      };

      const mockPost: Partial<Post> = {
        id: 'post_123_abc',
        url: dto.url,
        description: dto.description,
        suggested_by: dto.suggested_by,
        votes: 0,
        created_at: new Date().toISOString(),
      };

      jest
        .spyOn(postsService, 'create')
        .mockResolvedValue(mockPost as Post);

      const result = await controller.suggest(dto);

      expect(result.success).toBe(true);
      expect(result.message).toBe('Post suggested! 🦞');
      expect(result.post).toMatchObject({
        id: 'post_123_abc',
        url: dto.url,
        description: dto.description,
        votes: 0,
      });
    });

    it('should return existing post if URL already exists', async () => {
      const dto: CreateSuggestionDto = {
        url: 'https://moltbook.com/posts/abc123',
        description: 'Interesting post',
        suggested_by: 'Bot1',
      };

      const mockExistingPost: Partial<Post> = {
        id: 'post_456_def',
        url: dto.url,
        description: 'Original post',
        suggested_by: 'Bot1',
        votes: 15,
        created_at: '2026-02-01T00:00:00.000Z',
      };

      jest
        .spyOn(postsService, 'create')
        .mockResolvedValue(mockExistingPost as Post);

      const result = await controller.suggest(dto);

      expect(result.success).toBe(true);
      expect(result.post.votes).toBe(15); // Existing post's votes
      expect(result.post.id).toBe('post_456_def');
    });

    it('should handle minimal required fields', async () => {
      const dto: CreateSuggestionDto = {
        url: 'https://moltbook.com/posts/xyz789',
        // description and suggested_by are optional
      };

      const mockPost: Partial<Post> = {
        id: 'post_789_ghi',
        url: dto.url,
        description: undefined,
        suggested_by: 'anonymous', // Default
        votes: 0,
        created_at: new Date().toISOString(),
      };

      jest
        .spyOn(postsService, 'create')
        .mockResolvedValue(mockPost as Post);

      const result = await controller.suggest(dto);

      expect(result.success).toBe(true);
      expect(result.post.suggested_by).toBe('anonymous');
    });
  });
});
