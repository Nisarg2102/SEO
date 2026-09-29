jest.mock('@prisma/client', () => ({ PrismaClient: class {}, Prisma: {} }), { virtual: true });

import { Test, TestingModule } from '@nestjs/testing';
import { SeoProcessor } from './seo.processor';
import { SeoOpportunitiesService } from '../../seo-opportunities/seo-opportunities.service';

describe('SeoProcessor', () => {
  let processor: SeoProcessor;
  let mockSeoOppsService: jest.Mocked<any>;

  beforeEach(async () => {
    mockSeoOppsService = {
      analyzeMetricsBackground: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SeoProcessor,
        { provide: SeoOpportunitiesService, useValue: mockSeoOppsService },
      ],
    }).compile();

    processor = module.get<SeoProcessor>(SeoProcessor);
  });

  afterEach(() => jest.clearAllMocks());

  it('should call analyzeMetricsBackground on analyze-metrics job', async () => {
    const job = {
      name: 'analyze-metrics',
      id: 'job-1',
      data: { workspaceId: 'ws-1', metrics: [{ keyword: 'test' }] },
    } as any;

    mockSeoOppsService.analyzeMetricsBackground.mockResolvedValue({ success: true, createdCount: 1 });

    const result = await processor.process(job);

    expect(mockSeoOppsService.analyzeMetricsBackground).toHaveBeenCalledWith('ws-1', [{ keyword: 'test' }]);
    expect(result.createdCount).toBe(1);
  });

  it('should ignore job if workspaceId is missing', async () => {
    const job = {
      name: 'analyze-metrics',
      id: 'job-1',
      data: { metrics: [] },
    } as any;

    await processor.process(job);

    expect(mockSeoOppsService.analyzeMetricsBackground).not.toHaveBeenCalled();
  });
});
