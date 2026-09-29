jest.mock('@prisma/client', () => ({ PrismaClient: class {}, Prisma: {} }), { virtual: true });

import { Test, TestingModule } from '@nestjs/testing';
import { SeoOpportunitiesService, OPPORTUNITY_TYPES } from './seo-opportunities.service';
import { PrismaService } from '../prisma/prisma.service';
import { AiService } from '../ai/ai.service';
import { NotFoundException } from '@nestjs/common';

const mockOpportunity = (overrides = {}) => ({
  id: 'opp-1',
  workspaceId: 'ws-1',
  url: 'https://example.com/page',
  keyword: 'seo tips',
  impressions: 5000,
  clicks: 50,
  ctr: 1.0,
  averagePosition: 5.5,
  opportunityType: OPPORTUNITY_TYPES.LOW_CTR,
  recommendation: 'Fix title and meta tags',
  priority: 'high',
  createdAt: new Date(),
  ...overrides,
});

import { getQueueToken } from '@nestjs/bullmq';
import { SEO_QUEUE } from '../queues/queues.constants';

// ... (keep the rest of the file imports intact)

describe('SeoOpportunitiesService', () => {
  let service: SeoOpportunitiesService;
  let mockPrisma: jest.Mocked<any>;
  let mockAiService: jest.Mocked<any>;
  let mockQueue: jest.Mocked<any>;

  beforeEach(async () => {
    mockPrisma = {
      seoOpportunity: {
        findMany: jest.fn(),
        findFirst: jest.fn(),
        create: jest.fn(),
      },
      contentIdea: {
        create: jest.fn(),
      }
    };

    mockAiService = {
      generateStructuredOutput: jest.fn(),
    };

    mockQueue = {
      add: jest.fn().mockResolvedValue({ id: 'job-1' }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SeoOpportunitiesService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: AiService, useValue: mockAiService },
        { provide: getQueueToken(SEO_QUEUE), useValue: mockQueue },
      ],
    }).compile();

    service = module.get<SeoOpportunitiesService>(SeoOpportunitiesService);
    Object.assign(mockPrisma, mockPrisma); // Connect mock references
  });

  afterEach(() => jest.clearAllMocks());

  describe('findAll', () => {
    it('should query by workspaceId and filters', async () => {
      mockPrisma.seoOpportunity.findMany.mockResolvedValue([mockOpportunity()]);
      await service.findAll('ws-1', { type: 'LOW_CTR', priority: 'high' });

      expect(mockPrisma.seoOpportunity.findMany).toHaveBeenCalledWith({
        where: { workspaceId: 'ws-1', opportunityType: 'LOW_CTR', priority: 'high' },
        orderBy: [{ priority: 'asc' }, { impressions: 'desc' }]
      });
    });

    it('should isolate by workspaceId', async () => {
      mockPrisma.seoOpportunity.findMany.mockResolvedValue([]);
      await service.findAll('ws-2');

      expect(mockPrisma.seoOpportunity.findMany).toHaveBeenCalledWith({
        where: { workspaceId: 'ws-2' },
        orderBy: expect.any(Array)
      });
    });
  });

  describe('convertToIdea', () => {
    it('should throw NotFoundException if not in workspace', async () => {
      mockPrisma.seoOpportunity.findFirst.mockResolvedValue(null);
      await expect(service.convertToIdea('ws-WRONG', 'opp-1')).rejects.toThrow(NotFoundException);
    });

    it('should create content idea if opp belongs to workspace', async () => {
      const opp = mockOpportunity();
      mockPrisma.seoOpportunity.findFirst.mockResolvedValue(opp);
      mockPrisma.contentIdea.create.mockResolvedValue({ id: 'idea-1' });

      await service.convertToIdea('ws-1', 'opp-1');

      expect(mockPrisma.contentIdea.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          workspaceId: 'ws-1',
          seoOpportunityId: 'opp-1',
          topic: opp.keyword
        })
      });
    });
  });

  describe('analyzeMetricsBackground', () => {
    const metrics = [
      { url: 'https://site.com/a', keyword: 'key A', impressions: 2000, clicks: 10, position: 8 }, // CTR = 0.5% (LOW CTR)
      { url: 'https://site.com/b', keyword: 'key B', impressions: 100, clicks: 5, position: 5 }, // Impressions too low
      { url: 'https://site.com/c', keyword: 'key C', impressions: 2000, clicks: 400, position: 2 }, // CTR = 20% (Not LOW CTR)
      { url: 'https://site.com/d', keyword: 'key D', impressions: 5000, clicks: 50, position: 50 }, // Position too low (>20)
    ];

    it('should only create opportunities for high imp, low ctr, reasonable position', async () => {
      mockPrisma.seoOpportunity.findFirst.mockResolvedValue(null); // No existing
      mockAiService.generateStructuredOutput.mockResolvedValue({
        explanation: 'Test',
        titleSuggestion: 'Test Title',
        metaDescriptionSuggestion: 'Test Meta',
        contentRecommendation: 'Test Content'
      });

      const res = await service.analyzeMetricsBackground('ws-1', metrics);
      
      expect(res.createdCount).toBe(1);
      expect(mockPrisma.seoOpportunity.create).toHaveBeenCalledTimes(1);
      
      const createCall = mockPrisma.seoOpportunity.create.mock.calls[0][0];
      expect(createCall.data.keyword).toBe('key A');
      expect(createCall.data.opportunityType).toBe(OPPORTUNITY_TYPES.LOW_CTR);
    });

    it('should skip if opportunity already exists', async () => {
      mockPrisma.seoOpportunity.findFirst.mockResolvedValue(mockOpportunity()); // Already exists
      const res = await service.analyzeMetricsBackground('ws-1', [metrics[0]]);
      
      expect(res.createdCount).toBe(0);
      expect(mockPrisma.seoOpportunity.create).not.toHaveBeenCalled();
    });

    it('should use fallback recommendation if AI fails', async () => {
      mockPrisma.seoOpportunity.findFirst.mockResolvedValue(null);
      mockAiService.generateStructuredOutput.mockRejectedValue(new Error('AI Failed'));

      const res = await service.analyzeMetricsBackground('ws-1', [metrics[0]]);
      
      expect(res.createdCount).toBe(1);
      expect(mockPrisma.seoOpportunity.create).toHaveBeenCalledTimes(1);
      const createCall = mockPrisma.seoOpportunity.create.mock.calls[0][0];
      expect(createCall.data.recommendation).toContain('Consider rewriting the Title');
    });
  });
});
