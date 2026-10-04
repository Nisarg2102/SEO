import { Test, TestingModule } from '@nestjs/testing';
import { AutomationsService } from './automations.service';
import { PrismaService } from '../prisma/prisma.service';
import { AnalyticsService } from '../analytics/analytics.service';
import { GscService } from '../gsc/gsc.service';
import { NotFoundException } from '@nestjs/common';

const mockPrisma = {
  automation: { count: jest.fn(), create: jest.fn(), findMany: jest.fn(), findUnique: jest.fn(), update: jest.fn(), findFirst: jest.fn() },
  automationRun: { create: jest.fn(), findMany: jest.fn(), update: jest.fn() },
};

const mockAnalyticsService = {
  getOverview: jest.fn(),
  getOpportunities: jest.fn(),
};

const mockGscService = {
  sync: jest.fn(),
};

describe('AutomationsService', () => {
  let service: AutomationsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AutomationsService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: AnalyticsService, useValue: mockAnalyticsService },
        { provide: GscService, useValue: mockGscService },
      ],
    }).compile();

    service = module.get<AutomationsService>(AutomationsService);
    jest.clearAllMocks();
  });

  it('runs automation logic successfully', async () => {
    mockPrisma.automation.findUnique.mockResolvedValueOnce({ id: 'a1', workspaceId: 'ws1', type: 'gsc-sync', enabled: true });
    mockPrisma.automationRun.create.mockResolvedValueOnce({ id: 'r1' });
    mockPrisma.automationRun.update.mockResolvedValueOnce({ id: 'r1', status: 'completed' });
    mockGscService.sync.mockResolvedValueOnce(true);

    const res = await service.runAutomationManually('ws1', 'a1');
    expect(res.status).toBe('completed');
    expect(mockGscService.sync).toHaveBeenCalledWith('ws1');
  });

  it('handles execution failures without fabricating success', async () => {
    mockPrisma.automation.findUnique.mockResolvedValueOnce({ id: 'a2', workspaceId: 'ws1', type: 'performance-report', enabled: true });
    mockPrisma.automationRun.create.mockResolvedValueOnce({ id: 'r2' });
    mockPrisma.automationRun.update.mockResolvedValueOnce({ id: 'r2', status: 'failed', error: 'DB Error' });
    mockAnalyticsService.getOverview.mockRejectedValueOnce(new Error('DB Error'));

    const res = await service.runAutomationManually('ws1', 'a2');
    expect(res.status).toBe('failed');
    expect(res.error).toBe('DB Error');
  });

  it('webhook enforces workspace isolation (not found if missing)', async () => {
    mockPrisma.automation.findFirst.mockResolvedValueOnce(null);
    await expect(service.handleWebhook({ workspaceId: 'ws-hacker', type: 'gsc-sync' }))
      .rejects.toThrow(NotFoundException);
  });

  it('webhook skips if disabled', async () => {
    mockPrisma.automation.findFirst.mockResolvedValueOnce({ id: 'a3', workspaceId: 'ws1', enabled: false });
    const res = await service.handleWebhook({ workspaceId: 'ws1', type: 'gsc-sync' });
    expect(res.status).toBe('skipped');
  });
});
