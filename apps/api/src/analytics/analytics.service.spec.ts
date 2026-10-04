import { Test, TestingModule } from '@nestjs/testing';
import { AnalyticsService } from './analytics.service';
import { PrismaService } from '../prisma/prisma.service';
import { AiService } from '../ai/ai.service';
import { NotFoundException } from '@nestjs/common';

const mockPrisma = {
  gscMetric: {
    findMany: jest.fn(),
    groupBy: jest.fn(),
  },
  seoAudit: {
    findFirst: jest.fn(),
  },
  seoLink: {
    count: jest.fn(),
  },
  seoContentBrief: { count: jest.fn() },
  seoContentDraft: { count: jest.fn() },
  seoContentAnalysis: { count: jest.fn() },
  socialPost: {
    groupBy: jest.fn(),
  },
  workspace: {
    findUnique: jest.fn(),
  }
};

const mockAiService = {
  generateStructuredOutput: jest.fn(),
};

describe('AnalyticsService', () => {
  let service: AnalyticsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AnalyticsService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: AiService, useValue: mockAiService },
      ],
    }).compile();

    service = module.get<AnalyticsService>(AnalyticsService);
    jest.clearAllMocks();
  });

  it('aggregates overview metrics correctly', async () => {
    mockPrisma.gscMetric.findMany.mockResolvedValueOnce([
      { clicks: 10, impressions: 100, ctr: 0.1, position: 5, date: new Date('2026-10-01') },
      { clicks: 20, impressions: 200, ctr: 0.1, position: 3, date: new Date('2026-10-02') }
    ]);

    const result = await service.getOverview('ws-1');
    expect(result.hasData).toBe(true);
    expect(result.summary!.clicks).toBe(30);
    expect(result.summary!.impressions).toBe(300);
    expect(result.summary!.averagePosition).toBe(4);
    expect(result.trends.length).toBe(2);
  });

  it('detects striking distance opportunities', async () => {
    mockPrisma.gscMetric.groupBy.mockResolvedValueOnce([
      { page: '/test', _sum: { clicks: 1, impressions: 150 }, _avg: { position: 12, ctr: 0.01 } }
    ]);

    const opps = await service.getOpportunities('ws-1');
    expect(opps.length).toBeGreaterThan(0);
    expect(opps[0].type).toBe('Striking Distance');
  });

  it('returns missing backlink data notice', async () => {
    mockPrisma.seoAudit.findFirst.mockResolvedValueOnce({ id: 'audit-1' });
    mockPrisma.seoLink.count.mockResolvedValue(5);

    const links = await service.getLinks('ws-1');
    expect(links.message).toContain('Complete backlink discovery is not available');
    expect(links.internalLinks).toBe(5);
  });

  it('enforces medical safety rules for insights', async () => {
    mockPrisma.workspace.findUnique.mockResolvedValueOnce({ id: 'ws-med', type: 'medical' });
    mockPrisma.gscMetric.findMany.mockResolvedValueOnce([]);
    mockPrisma.gscMetric.groupBy.mockResolvedValueOnce([]);

    await service.generateInsights('ws-med');
    const prompt = mockAiService.generateStructuredOutput.mock.calls[0][0];
    expect(prompt).toContain('MEDICAL SAFETY RULES MUST BE FOLLOWED');
    expect(prompt).toContain('Do NOT generate medical advice');
  });

  it('returns missing data gracefully', async () => {
    mockPrisma.gscMetric.findMany.mockResolvedValueOnce([]);
    const result = await service.getOverview('ws-1');
    expect(result.hasData).toBe(false);
  });
});
