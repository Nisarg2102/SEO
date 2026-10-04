jest.mock('@prisma/client', () => ({ PrismaClient: class {}, Prisma: {} }), { virtual: true });

// Mock the seo package providers so no live Google requests are made
jest.mock('@ai-marketing/seo', () => ({
  fetchAutocompleteSuggestions: jest.fn(),
  fetchTrendsInterest: jest.fn(),
  fetchRelatedQueries: jest.fn(),
  compareKeywords: jest.fn(),
}));

import { Test, TestingModule } from '@nestjs/testing';
import { KeywordResearchService } from './keyword-research.service';
import { PrismaService } from '../prisma/prisma.service';
import {
  fetchAutocompleteSuggestions,
  fetchTrendsInterest,
  fetchRelatedQueries,
  compareKeywords,
} from '@ai-marketing/seo';

const mockFetchAC = fetchAutocompleteSuggestions as jest.Mock;
const mockFetchTrend = fetchTrendsInterest as jest.Mock;
const mockFetchRelated = fetchRelatedQueries as jest.Mock;
const mockCompare = compareKeywords as jest.Mock;

describe('KeywordResearchService', () => {
  let service: KeywordResearchService;
  let mockPrisma: any;

  beforeEach(async () => {
    mockPrisma = {
      gscMetric: {
        groupBy: jest.fn().mockResolvedValue([]),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        KeywordResearchService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<KeywordResearchService>(KeywordResearchService);

    // Default mocks — no live network requests
    mockFetchAC.mockResolvedValue([
      { keyword: 'computer repair near me', source: 'google_autocomplete' },
      { keyword: 'computer repair shop', source: 'google_autocomplete' },
    ]);
    mockFetchTrend.mockResolvedValue({
      keyword: 'computer repair',
      interestOverTime: [{ date: '2024-01-01', interest: 50 }],
      currentInterest: 50,
      isRising: false,
    });
    mockFetchRelated.mockResolvedValue([
      { keyword: 'laptop repair', value: 75, isRising: false },
    ]);
    mockCompare.mockResolvedValue({
      keywords: ['seo', 'keyword research'],
      interests: { seo: 60, 'keyword research': 40 },
    });
  });

  afterEach(() => jest.clearAllMocks());

  describe('research (full workflow)', () => {
    it('should return combined result with all sections', async () => {
      const result = await service.research('ws-1', 'computer repair');
      expect(result.seed).toBe('computer repair');
      expect(result.suggestions.length).toBe(2);
      expect(result.trend).not.toBeNull();
      expect(result.relatedQueries.length).toBe(1);
      expect(result.disclaimer).toContain('Exact monthly search volume is unavailable');
    });

    it('should call autocomplete, trends, and related providers', async () => {
      await service.research('ws-1', 'computer repair');
      expect(mockFetchAC).toHaveBeenCalledWith('computer repair', expect.any(Object));
      expect(mockFetchTrend).toHaveBeenCalledWith('computer repair', expect.any(Object));
      expect(mockFetchRelated).toHaveBeenCalledWith('computer repair', expect.any(Object));
    });

    it('should include GSC data when available', async () => {
      mockPrisma.gscMetric.groupBy.mockResolvedValue([{
        query: 'computer repair',
        _sum: { clicks: 50, impressions: 2000 },
        _avg: { ctr: 2.5, position: 8.3 },
      }]);
      const result = await service.research('ws-1', 'computer repair');
      expect(result.gscData).not.toBeNull();
      expect(result.gscData?.clicks).toBe(50);
      expect(result.gscData?.impressions).toBe(2000);
    });

    it('should return null gscData when no GSC records exist', async () => {
      mockPrisma.gscMetric.groupBy.mockResolvedValue([]);
      const result = await service.research('ws-1', 'computer repair');
      expect(result.gscData).toBeNull();
    });
  });

  describe('getSuggestions', () => {
    it('should return empty array for empty seed', async () => {
      const result = await service.getSuggestions('');
      expect(result).toEqual([]);
      expect(mockFetchAC).not.toHaveBeenCalled();
    });

    it('should return empty array for whitespace-only seed', async () => {
      const result = await service.getSuggestions('   ');
      expect(result).toEqual([]);
      expect(mockFetchAC).not.toHaveBeenCalled();
    });

    it('should normalise and return autocomplete suggestions', async () => {
      const result = await service.getSuggestions('computer repair');
      expect(result.length).toBe(2);
      expect(result[0].source).toBe('google_autocomplete');
    });

    it('should cache results and not call provider twice for same key', async () => {
      await service.getSuggestions('seo tool');
      await service.getSuggestions('seo tool');
      expect(mockFetchAC).toHaveBeenCalledTimes(1);
    });

    it('should handle malformed/empty provider response gracefully', async () => {
      mockFetchAC.mockResolvedValue([]);
      const result = await service.getSuggestions('xyzzynotakeyword');
      expect(result).toEqual([]);
    });

    it('should handle provider network error gracefully', async () => {
      mockFetchAC.mockRejectedValue(new Error('Network error'));
      // Service should surface the rejection from the provider
      await expect(service.getSuggestions('failkeyword')).rejects.toThrow();
    });
  });

  describe('getTrend', () => {
    it('should return null for empty seed', async () => {
      const result = await service.getTrend('');
      expect(result).toBeNull();
      expect(mockFetchTrend).not.toHaveBeenCalled();
    });

    it('should return trend data with relative interest field', async () => {
      const result = await service.getTrend('computer repair');
      expect(result).not.toBeNull();
      expect(result?.currentInterest).toBeDefined();
      expect(typeof result?.currentInterest).toBe('number');
      expect(result?.interestOverTime.length).toBeGreaterThan(0);
    });

    it('should return null when Trends is unavailable (provider returns null)', async () => {
      mockFetchTrend.mockResolvedValue(null);
      const result = await service.getTrend('obscureterm');
      expect(result).toBeNull();
    });

    it('should cache trends results', async () => {
      await service.getTrend('caching test');
      await service.getTrend('caching test');
      expect(mockFetchTrend).toHaveBeenCalledTimes(1);
    });
  });

  describe('getRelatedQueries', () => {
    it('should return empty array for empty seed', async () => {
      const result = await service.getRelatedQueries('');
      expect(result).toEqual([]);
    });

    it('should return related queries from provider', async () => {
      const result = await service.getRelatedQueries('computer repair');
      expect(result.length).toBe(1);
      expect(result[0].keyword).toBe('laptop repair');
    });

    it('should handle provider API failure gracefully', async () => {
      mockFetchRelated.mockResolvedValue([]);
      const result = await service.getRelatedQueries('failkey');
      expect(result).toEqual([]);
    });
  });

  describe('compareKeywords', () => {
    it('should return comparison result for multiple keywords', async () => {
      const result = await service.compareKeywords(['seo', 'keyword research']);
      expect(result.keywords).toEqual(['seo', 'keyword research']);
      expect(result.interests.seo).toBeDefined();
    });

    it('should return empty comparison for empty array', async () => {
      const result = await service.compareKeywords([]);
      expect(result.keywords).toEqual([]);
      expect(result.interests).toEqual({});
    });
  });

  describe('data honesty — no fake search volume', () => {
    it('should not contain a "volume" or "monthlySearches" field in research result', async () => {
      const result = await service.research('ws-1', 'seo tool');
      const json = JSON.stringify(result);
      expect(json).not.toContain('"volume"');
      expect(json).not.toContain('"monthlySearches"');
      expect(json).not.toContain('"monthly_searches"');
    });

    it('should always include the disclaimer about search volume unavailability', async () => {
      const result = await service.research('ws-1', 'any keyword');
      expect(result.disclaimer).toContain('Exact monthly search volume is unavailable');
    });

    it('should label suggestions source as google_autocomplete', async () => {
      const result = await service.research('ws-1', 'keyword');
      for (const s of result.suggestions) {
        expect(s.source).toBe('google_autocomplete');
      }
    });

    it('should label trend interest as relative, not absolute volume', async () => {
      mockFetchTrend.mockResolvedValue({
        keyword: 'seo tool',
        interestOverTime: [{ date: '2024-01-01', interest: 75 }],
        currentInterest: 75,
        isRising: true,
      });
      const result = await service.research('ws-1', 'seo tool');
      // Interest should be 0-100 relative scale
      expect(result.trend?.currentInterest).toBeGreaterThanOrEqual(0);
      expect(result.trend?.currentInterest).toBeLessThanOrEqual(100);
    });
  });

  describe('workspace isolation', () => {
    it('should always pass workspaceId to GSC query', async () => {
      await service.research('ws-specific-123', 'some keyword');
      expect(mockPrisma.gscMetric.groupBy).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ workspaceId: 'ws-specific-123' }),
        }),
      );
    });

    it('should not leak GSC data across workspaces', async () => {
      mockPrisma.gscMetric.groupBy
        .mockResolvedValueOnce([{ query: 'secret ws-a keyword', _sum: { clicks: 100, impressions: 5000 }, _avg: { ctr: 2, position: 3 } }])
        .mockResolvedValueOnce([]);
      const resultA = await service.research('ws-a', 'secret');
      const resultB = await service.research('ws-b', 'secret');
      expect(resultA.gscData).not.toBeNull();
      expect(resultB.gscData).toBeNull();
    });
  });
});
