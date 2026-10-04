jest.mock('@prisma/client', () => ({ PrismaClient: class {}, Prisma: {} }), { virtual: true });

import { Test, TestingModule } from '@nestjs/testing';
import { GscService } from './gsc.service';
import { PrismaService } from '../prisma/prisma.service';
import { SeoOpportunitiesService } from '../seo-opportunities/seo-opportunities.service';

describe('GscService', () => {
  let service: GscService;
  let mockPrisma: any;
  let mockSeoOppsService: any;

  beforeEach(async () => {
    mockPrisma = {
      withWorkspace: jest.fn().mockReturnThis(),
      integration: {
        findUnique: jest.fn(),
        upsert: jest.fn(),
        update: jest.fn(),
        findMany: jest.fn().mockResolvedValue([]),
      },
      gscMetric: {
        upsert: jest.fn(),
        findMany: jest.fn().mockResolvedValue([]),
        groupBy: jest.fn().mockResolvedValue([]),
        aggregate: jest.fn().mockResolvedValue({ _sum: { clicks: 0, impressions: 0 }, _avg: { ctr: 0, position: 0 } }),
      },
    };

    mockSeoOppsService = {
      analyzeMetrics: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GscService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: SeoOpportunitiesService, useValue: mockSeoOppsService },
      ],
    }).compile();

    service = module.get<GscService>(GscService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getAuthUrl', () => {
    it('should return google oauth url with workspace state', () => {
      const url = service.getAuthUrl('ws-1');
      expect(url).toContain('response_type=code');
      expect(url).toContain('state=ws-1');
    });
  });

  describe('handleCallback', () => {
    it('should upsert integration mock in test env', async () => {
      await service.handleCallback('some_code', 'ws-1');
      expect(mockPrisma.integration.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { workspaceId_provider: { workspaceId: 'ws-1', provider: 'google_search_console' } }
        })
      );
    });
  });

  describe('getProperties', () => {
    it('should throw if not connected', async () => {
      mockPrisma.integration.findUnique.mockResolvedValue(null);
      await expect(service.getProperties('ws-1')).rejects.toThrow('Not connected');
    });

    it('should return mock properties in test env', async () => {
      mockPrisma.integration.findUnique.mockResolvedValue({
        accessToken: 't', refreshToken: 'r'
      });
      const props = await service.getProperties('ws-1');
      expect(props.length).toBeGreaterThan(0);
      expect(props[0]).toHaveProperty('siteUrl');
    });
  });

  describe('connectProperty', () => {
    it('should update integration with selected property url', async () => {
      await service.connectProperty('ws-1', 'https://mysite.com');
      expect(mockPrisma.integration.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { workspaceId_provider: { workspaceId: 'ws-1', provider: 'google_search_console' } },
          data: { config: JSON.stringify({ propertyUrl: 'https://mysite.com' }) }
        })
      );
    });
  });

  describe('sync', () => {
    it('should throw if not connected', async () => {
      mockPrisma.integration.findUnique.mockResolvedValue(null);
      await expect(service.sync('ws-1')).rejects.toThrow('Not connected');
    });

    it('should throw if no property url selected', async () => {
      mockPrisma.integration.findUnique.mockResolvedValue({ config: null });
      await expect(service.sync('ws-1')).rejects.toThrow('No property selected');
    });

    it('should process mock metrics, upsert to gsc_metrics, call AI analysis, and update lastSyncAt', async () => {
      mockPrisma.integration.findUnique.mockResolvedValue({
        id: 'integration-1',
        config: JSON.stringify({ propertyUrl: 'https://mysite.com' })
      });

      const res = await service.sync('ws-1', 7);

      expect(res.success).toBe(true);
      expect(res.count).toBe(2);

      // Ensure upsert was called on GscMetric table
      expect(mockPrisma.gscMetric.upsert).toHaveBeenCalledTimes(2);

      // Ensure analyzeMetrics was called on SeoOpportunities engine
      expect(mockSeoOppsService.analyzeMetrics).toHaveBeenCalledWith('ws-1', expect.any(Array));

      // Ensure lastSyncAt is updated
      expect(mockPrisma.integration.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'integration-1' },
          data: expect.objectContaining({ lastSyncAt: expect.any(Date) })
        })
      );
    });
  });

  describe('Analytics queries', () => {
    it('getKeywordHistory should filter by workspaceId and date', async () => {
      await service.getKeywordHistory('ws-1', 'test query', 30);
      expect(mockPrisma.gscMetric.findMany).toHaveBeenCalledWith(expect.objectContaining({
        where: expect.objectContaining({ workspaceId: 'ws-1', query: 'test query' })
      }));
    });

    it('getPerformance should aggregate metrics for date range', async () => {
      mockPrisma.gscMetric.aggregate.mockResolvedValue({
        _sum: { clicks: 10, impressions: 100 },
        _avg: { ctr: 10, position: 2.5 }
      });
      const res = await service.getPerformance('ws-1', new Date('2023-01-01'), new Date('2023-01-31'));
      expect(res).toEqual({ clicks: 10, impressions: 100, ctr: 10, averagePosition: 2.5 });
    });

    it('getTopQueries should return query-grouped results', async () => {
      mockPrisma.gscMetric.groupBy.mockResolvedValue([{
        query: 'seo tool',
        _sum: { clicks: 50, impressions: 2000 },
        _avg: { ctr: 2.5, position: 8.3 },
      }]);
      const result = await service.getTopQueries('ws-1', 30);
      expect(result[0].query).toBe('seo tool');
      expect(result[0].clicks).toBe(50);
    });

    it('getTopPages should return page-grouped results', async () => {
      mockPrisma.gscMetric.groupBy.mockResolvedValue([{
        page: 'https://example.com/blog',
        _sum: { clicks: 30, impressions: 1500 },
        _avg: { ctr: 2.0, position: 6.1 },
      }]);
      const result = await service.getTopPages('ws-1', 30);
      expect(result[0].page).toBe('https://example.com/blog');
    });
  });
});
