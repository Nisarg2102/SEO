jest.mock('@prisma/client', () => ({ PrismaClient: class {}, Prisma: {} }), { virtual: true });

import { Test, TestingModule } from '@nestjs/testing';
import { SourcesService } from './sources.service';
import { PrismaService } from '../prisma/prisma.service';
import { NotFoundException, ConflictException } from '@nestjs/common';

const mockSource = (overrides = {}) => ({
  id: 'src-1',
  workspaceId: 'ws-1',
  name: 'Test Feed',
  url: 'https://feed.example.com',
  sourceType: 'rss',
  sourceTier: 'tier1',
  active: true,
  createdAt: new Date(),
  ...overrides,
});

describe('SourcesService', () => {
  let service: SourcesService;
  let mockPrisma: jest.Mocked<any>;

  beforeEach(async () => {
    mockPrisma = {
      source: {
        create: jest.fn(),
        findMany: jest.fn(),
        findFirst: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SourcesService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<SourcesService>(SourcesService);
  });

  afterEach(() => jest.clearAllMocks());

  describe('create', () => {
    it('should normalize URL (strip trailing slash) before saving', async () => {
      mockPrisma.source.findFirst.mockResolvedValue(null);
      mockPrisma.source.create.mockResolvedValue(mockSource());

      await service.create('ws-1', {
        name: 'Test',
        url: 'https://feed.example.com/',
        sourceType: 'rss',
        sourceTier: 'tier1',
      });

      expect(mockPrisma.source.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ url: 'https://feed.example.com' }),
        }),
      );
    });

    it('should reject duplicate URLs in the same workspace', async () => {
      mockPrisma.source.findFirst.mockResolvedValue(mockSource());

      await expect(
        service.create('ws-1', {
          name: 'Duplicate',
          url: 'https://feed.example.com',
          sourceType: 'rss',
          sourceTier: 'tier1',
        }),
      ).rejects.toThrow(ConflictException);

      expect(mockPrisma.source.create).not.toHaveBeenCalled();
    });

    it('should allow same URL in different workspaces', async () => {
      // findFirst returns null (not found in ws-2)
      mockPrisma.source.findFirst.mockResolvedValue(null);
      mockPrisma.source.create.mockResolvedValue(mockSource({ workspaceId: 'ws-2' }));

      await service.create('ws-2', {
        name: 'Feed',
        url: 'https://feed.example.com',
        sourceType: 'rss',
        sourceTier: 'tier1',
      });

      // The findFirst is called with ws-2's workspaceId
      expect(mockPrisma.source.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({ where: expect.objectContaining({ workspaceId: 'ws-2' }) }),
      );
    });
  });

  describe('findOne', () => {
    it('should throw when source belongs to a different workspace', async () => {
      mockPrisma.source.findFirst.mockResolvedValue(null);
      await expect(service.findOne('ws-WRONG', 'src-1')).rejects.toThrow(NotFoundException);
    });

    it('should return source when workspace matches', async () => {
      mockPrisma.source.findFirst.mockResolvedValue(mockSource());
      const result = await service.findOne('ws-1', 'src-1');
      expect(result.id).toBe('src-1');
    });
  });

  describe('update (toggle active)', () => {
    it('should deactivate a source', async () => {
      mockPrisma.source.findFirst.mockResolvedValue(mockSource());
      mockPrisma.source.update.mockResolvedValue(mockSource({ active: false }));

      const result = await service.update('ws-1', 'src-1', { active: false });
      expect(result.active).toBe(false);
    });

    it('should reject update of source from different workspace', async () => {
      mockPrisma.source.findFirst.mockResolvedValue(null);
      await expect(service.update('ws-WRONG', 'src-1', { active: false })).rejects.toThrow(NotFoundException);
      expect(mockPrisma.source.update).not.toHaveBeenCalled();
    });
  });

  describe('remove', () => {
    it('should reject deletion from different workspace', async () => {
      mockPrisma.source.findFirst.mockResolvedValue(null);
      await expect(service.remove('ws-WRONG', 'src-1')).rejects.toThrow(NotFoundException);
      expect(mockPrisma.source.delete).not.toHaveBeenCalled();
    });

    it('should delete source that belongs to workspace', async () => {
      mockPrisma.source.findFirst.mockResolvedValue(mockSource());
      mockPrisma.source.delete.mockResolvedValue(mockSource());

      await service.remove('ws-1', 'src-1');
      expect(mockPrisma.source.delete).toHaveBeenCalledWith({ where: { id: 'src-1' } });
    });
  });
});
