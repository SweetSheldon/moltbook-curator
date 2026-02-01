import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { VotesController } from './votes.controller';
import { VotesService } from './votes.service';

describe('VotesController', () => {
  let controller: VotesController;
  let votesService: VotesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [VotesController],
      providers: [
        {
          provide: VotesService,
          useValue: {
            addVote: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<VotesController>(VotesController);
    votesService = module.get<VotesService>(VotesService);
  });

  describe('vote', () => {
    it('should successfully vote for valid post ID', async () => {
      const mockPost = {
        id: 'post_1234567890_abc123',
        url: 'https://moltbook.com/posts/xyz',
        votes: 1,
      };

      jest
        .spyOn(votesService, 'addVote')
        .mockResolvedValue({
          success: true,
          post: mockPost,
        });

      const result = await controller.vote('post_1234567890_abc123');

      expect(result.success).toBe(true);
      expect(result.message).toBe('Vote recorded! 🦞');
      expect(result.post).toMatchObject({
        id: 'post_1234567890_abc123',
        url: 'https://moltbook.com/posts/xyz',
        votes: 1,
      });
    });

    it('should return 404 for non-existent post', async () => {
      jest.spyOn(votesService, 'addVote').mockResolvedValue({
        success: false,
        error: 'Post not found',
      });

      await expect(
        controller.vote('post_invalid_id'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should validate post ID format', async () => {
      const invalidIds = [
        'invalid_id',
        'post_xyz', // No timestamp
        'post_123', // No suffix
        'POST_123_abc', // Wrong case
        '123_abc', // Missing prefix
      ];

      for (const invalidId of invalidIds) {
        await expect(
          controller.vote(invalidId),
        ).rejects.toThrow(BadRequestException);
      }
    });

    it('should accept valid post ID format', async () => {
      const validIds = [
        'post_1234567890_abc123',
        'post_0000000000_000000000',
        'post_9999999999_zzzzzzzzz',
      ];

      for (const validId of validIds) {
        jest
          .spyOn(votesService, 'addVote')
          .mockResolvedValue({
            success: true,
            post: { id: validId, url: '...', votes: 1 },
          });

        const result = await controller.vote(validId);

        expect(result.success).toBe(true);
      }
    });

    it('should return error message on failure', async () => {
      jest.spyOn(votesService, 'addVote').mockResolvedValue({
        success: false,
        error: 'Some error occurred',
      });

      await expect(
        controller.vote('post_123_abc'),
      ).rejects.toThrow(BadRequestException);
    });
  });
});
