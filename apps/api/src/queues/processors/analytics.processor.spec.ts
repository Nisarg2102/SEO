jest.mock('@prisma/client', () => ({ PrismaClient: class {}, Prisma: {} }), { virtual: true });
import { Test, TestingModule } from '@nestjs/testing';
import { AnalyticsProcessor } from './analytics.processor';
import { GscService } from '../../gsc/gsc.service';

describe('AnalyticsProcessor', () => {
  let processor: AnalyticsProcessor;
  let mockGscService: any;

  beforeEach(async () => {
    mockGscService = {
      sync: jest.fn().mockResolvedValue({ success: true, count: 5 }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AnalyticsProcessor,
        { provide: GscService, useValue: mockGscService },
      ],
    }).compile();

    processor = module.get<AnalyticsProcessor>(AnalyticsProcessor);
  });

  it('should process sync-gsc job', async () => {
    const job: any = {
      id: 'job-1',
      name: 'sync-gsc',
      data: { workspaceId: 'ws-1' },
    };

    const result = await processor.process(job);

    expect(mockGscService.sync).toHaveBeenCalledWith('ws-1', 28);
    expect(result).toEqual({ success: true, count: 5 });
  });

  it('should process sync-gsc job with custom days', async () => {
    const job: any = {
      id: 'job-1-custom',
      name: 'sync-gsc',
      data: { workspaceId: 'ws-1', days: 90 },
    };

    await processor.process(job);

    expect(mockGscService.sync).toHaveBeenCalledWith('ws-1', 90);
  });

  it('should throw error on failure to let BullMQ handle retries', async () => {
    const job: any = {
      id: 'job-2',
      name: 'sync-gsc',
      data: { workspaceId: 'ws-1' },
    };

    mockGscService.sync.mockRejectedValue(new Error('Network error'));

    await expect(processor.process(job)).rejects.toThrow('Network error');
  });
});
