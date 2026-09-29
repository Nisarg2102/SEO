jest.mock('@prisma/client', () => ({ PrismaClient: class {}, Prisma: {} }), { virtual: true });

import { Test, TestingModule } from '@nestjs/testing';
import { ResearchService } from './research.service';
import { PrismaService } from '../prisma/prisma.service';
import { AiService } from '../ai/ai.service';
import { NotFoundException } from '@nestjs/common';

// ─── Helpers ─────────────────────────────────────────────────────────────────
const mockResearchItem = (overrides = {}) => ({
  id: 'item-1',
  workspaceId: 'ws-1',
  sourceId: 'src-1',
  title: 'Test Title',
  url: 'https://example.com/article',
  topic: 'SEO Tips',
  audience: 'Marketing teams',
  intent: 'informational',
  summary: 'This is a 2-3 sentence summary of the article.',
  relevanceReason: 'This is a research opportunity for content teams.',
  suggestedContentFormats: JSON.stringify(['Blog Post', 'LinkedIn Carousel']),
  confidence: 0.8,
  status: 'new',
  publishedAt: new Date('2024-01-15'),
  createdAt: new Date(),
  source: { id: 'src-1', name: 'Test Feed', url: 'https://feed.example.com', sourceType: 'rss', sourceTier: 'tier1' },
  contentIdeas: [],
  ...overrides,
});

const mockAiAnalysis = {
  topic: 'SEO Tips',
  summary: 'This article discusses practical SEO strategies for content teams.',
  audience: 'Marketing professionals',
  intent: 'informational',
  relevanceReason: 'This is a research opportunity for teams producing educational content.',
  confidence: 0.85,
  suggestedContentFormats: ['Blog Post', 'LinkedIn Carousel'],
};

describe('ResearchService', () => {
  let service: ResearchService;
  let mockPrisma: jest.Mocked<any>;
  let mockAiService: jest.Mocked<any>;

  beforeEach(async () => {
    mockPrisma = {
      researchItem: {
        findMany: jest.fn(),
        findFirst: jest.fn(),
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
      source: {
        findMany: jest.fn(),
      },
      contentIdea: {
        create: jest.fn(),
      },
      workspace: {
        findMany: jest.fn(),
      },
    };

    mockAiService = {
      generateStructuredOutput: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ResearchService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: AiService, useValue: mockAiService },
      ],
    }).compile();

    service = module.get<ResearchService>(ResearchService);

    // Directly replace the rssParser instance on the service
    const mockParseURL = jest.fn();
    (service as any).rssParser = { parseURL: mockParseURL };

    // Expose the mock for use in tests
    (service as any)._mockParseURL = mockParseURL;

    // Wire mock prisma methods via monkey-patching since service uses `(this.prisma as any)`
    Object.assign(mockPrisma, mockPrisma);
  });

  afterEach(() => jest.clearAllMocks());

  // ─── findAll ───────────────────────────────────────────────────────────────
  describe('findAll', () => {
    it('should return research items for the correct workspace only', async () => {
      const items = [mockResearchItem(), mockResearchItem({ id: 'item-2' })];
      mockPrisma.researchItem.findMany.mockResolvedValue(items);

      const result = await service.findAll('ws-1');

      expect(mockPrisma.researchItem.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: expect.objectContaining({ workspaceId: 'ws-1' }) }),
      );
      expect(result).toHaveLength(2);
    });

    it('should apply sourceId filter', async () => {
      mockPrisma.researchItem.findMany.mockResolvedValue([]);
      await service.findAll('ws-1', { sourceId: 'src-99' });
      expect(mockPrisma.researchItem.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: expect.objectContaining({ sourceId: 'src-99' }) }),
      );
    });

    it('should apply search filter', async () => {
      mockPrisma.researchItem.findMany.mockResolvedValue([]);
      await service.findAll('ws-1', { search: 'SEO' });
      const call = mockPrisma.researchItem.findMany.mock.calls[0][0];
      expect(call.where.OR).toBeDefined();
    });

    it('should apply minConfidence filter', async () => {
      mockPrisma.researchItem.findMany.mockResolvedValue([]);
      await service.findAll('ws-1', { minConfidence: 0.7 });
      const call = mockPrisma.researchItem.findMany.mock.calls[0][0];
      expect(call.where.confidence).toEqual({ gte: 0.7 });
    });
  });

  // ─── findOne ──────────────────────────────────────────────────────────────
  describe('findOne', () => {
    it('should return item when it belongs to the workspace', async () => {
      mockPrisma.researchItem.findFirst.mockResolvedValue(mockResearchItem());
      const item = await service.findOne('ws-1', 'item-1');
      expect(mockPrisma.researchItem.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: 'item-1', workspaceId: 'ws-1' } }),
      );
      expect(item.id).toBe('item-1');
    });

    it('should throw NotFoundException when item does not belong to workspace', async () => {
      mockPrisma.researchItem.findFirst.mockResolvedValue(null);
      await expect(service.findOne('ws-WRONG', 'item-1')).rejects.toThrow(NotFoundException);
    });
  });

  // ─── convertToIdea ────────────────────────────────────────────────────────
  describe('convertToIdea', () => {
    it('should create a content idea linked to the research item', async () => {
      const item = mockResearchItem();
      mockPrisma.researchItem.findFirst.mockResolvedValue(item);
      mockPrisma.contentIdea.create.mockResolvedValue({ id: 'idea-1', title: 'SEO Tips' });
      mockPrisma.researchItem.update.mockResolvedValue({ ...item, status: 'converted' });

      const idea = await service.convertToIdea('ws-1', 'item-1', 'My Custom Title');

      expect(mockPrisma.contentIdea.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            workspaceId: 'ws-1',
            researchItemId: 'item-1',
            title: 'My Custom Title',
          }),
        }),
      );
      expect(mockPrisma.researchItem.update).toHaveBeenCalledWith(
        expect.objectContaining({ data: { status: 'converted' } }),
      );
    });

    it('should throw NotFoundException when item belongs to a different workspace', async () => {
      mockPrisma.researchItem.findFirst.mockResolvedValue(null);
      await expect(service.convertToIdea('ws-WRONG', 'item-1')).rejects.toThrow(NotFoundException);
      expect(mockPrisma.contentIdea.create).not.toHaveBeenCalled();
    });
  });

  // ─── AI analysis validation ───────────────────────────────────────────────
  describe('analyzeItem (private)', () => {
    it('should return null if AI returns invalid data', async () => {
      mockAiService.generateStructuredOutput.mockResolvedValue({
        // Missing required fields
        topic: 'Some topic',
        // confidence is missing
      });

      const result = await (service as any).analyzeItem('Title', 'https://example.com', 'snippet');
      expect(result).toBeNull();
    });

    it('should return null if AI service throws', async () => {
      mockAiService.generateStructuredOutput.mockRejectedValue(new Error('AI timeout'));
      const result = await (service as any).analyzeItem('Title', 'https://example.com', 'snippet');
      expect(result).toBeNull();
    });

    it('should return structured data when AI responds correctly', async () => {
      mockAiService.generateStructuredOutput.mockResolvedValue(mockAiAnalysis);
      const result = await (service as any).analyzeItem('Title', 'https://example.com', 'some snippet text here');
      expect(result).toMatchObject({ topic: 'SEO Tips', confidence: 0.85 });
    });
  });

  // ─── sync: workspace isolation ────────────────────────────────────────────
  describe('sync', () => {
    it('should only fetch sources belonging to the specified workspace', async () => {
      mockPrisma.source.findMany.mockResolvedValue([]);
      await service.sync('ws-1');
      expect(mockPrisma.source.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { workspaceId: 'ws-1', active: true } }),
      );
    });

    it('should skip unsupported source types (website, news, other)', async () => {
      mockPrisma.source.findMany.mockResolvedValue([
        { id: 'src-1', url: 'https://example.com', name: 'Blog', sourceType: 'website', workspaceId: 'ws-1' },
      ]);
      const result = await service.sync('ws-1');
      expect(result.newItemsCount).toBe(0);
    });

    it('should continue processing when one source fails', async () => {
      mockPrisma.source.findMany.mockResolvedValue([
        { id: 'src-1', url: 'https://bad-feed.com', name: 'Bad Feed', sourceType: 'rss', workspaceId: 'ws-1' },
        { id: 'src-2', url: 'https://good-feed.com', name: 'Good Feed', sourceType: 'rss', workspaceId: 'ws-1' },
      ]);

      (service as any).rssParser.parseURL
        .mockRejectedValueOnce(new Error('Connection refused'))
        .mockResolvedValueOnce({ items: [] });

      const result = await service.sync('ws-1');
      expect(result.failedSources).toBe(1);
      expect(result.newItemsCount).toBe(0);
    });

    it('should not create duplicate items for the same URL', async () => {
      mockPrisma.source.findMany.mockResolvedValue([
        { id: 'src-1', url: 'https://feed.com', name: 'Feed', sourceType: 'rss', workspaceId: 'ws-1' },
      ]);

      (service as any).rssParser.parseURL.mockResolvedValue({
        items: [{ link: 'https://article.com/1', title: 'Article 1', contentSnippet: 'Content snippet here' }],
      });

      // Item already exists
      mockPrisma.researchItem.findUnique.mockResolvedValue({ id: 'existing-item' });

      const result = await service.sync('ws-1');
      expect(result.newItemsCount).toBe(0);
      expect(mockAiService.generateStructuredOutput).not.toHaveBeenCalled();
    });

    it('should normalize URLs to prevent near-duplicates', async () => {
      mockPrisma.source.findMany.mockResolvedValue([
        { id: 'src-1', url: 'https://feed.com', name: 'Feed', sourceType: 'rss', workspaceId: 'ws-1' },
      ]);

      (service as any).rssParser.parseURL.mockResolvedValue({
        items: [{ link: 'https://article.com/1/', title: 'Article with trailing slash', contentSnippet: 'text here' }],
      });

      mockPrisma.researchItem.findUnique.mockResolvedValue(null);
      mockAiService.generateStructuredOutput.mockResolvedValue(mockAiAnalysis);
      mockPrisma.researchItem.create.mockResolvedValue({ id: 'new-item' });

      await service.sync('ws-1');

      // URL should have trailing slash stripped
      expect(mockPrisma.researchItem.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ url: 'https://article.com/1' }),
        }),
      );
    });
  });
});
