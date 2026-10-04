jest.mock('@prisma/client', () => ({ PrismaClient: class {}, Prisma: {} }), { virtual: true });

// Mock QStash Client so tests never attempt a real network call
const mockPublishJSON = jest.fn().mockResolvedValue({ messageId: 'job-123' });
jest.mock('@upstash/qstash', () => ({
  Client: jest.fn().mockImplementation(() => ({ publishJSON: mockPublishJSON })),
}));

import { Test, TestingModule } from '@nestjs/testing';
import { GscController } from './gsc.controller';
import { GscService } from './gsc.service';
import { PrismaService } from '../prisma/prisma.service';

describe('GscController', () => {
  let controller: GscController;
  let mockGscService: any;

  beforeEach(async () => {
    mockPublishJSON.mockClear();

    mockGscService = {
      getAuthUrl: jest.fn().mockReturnValue('https://accounts.google.com/o/oauth2/v2/auth?state=ws-1'),
      getIntegrationStatus: jest.fn().mockResolvedValue({ connected: true }),
      getProperties: jest.fn().mockResolvedValue([{ siteUrl: 'https://example.com' }]),
      connectProperty: jest.fn().mockResolvedValue({ success: true }),
      getKeywordHistory: jest.fn().mockResolvedValue([]),
      getPropertyHistory: jest.fn().mockResolvedValue([]),
      getPerformance: jest.fn().mockResolvedValue({ clicks: 0, impressions: 0, ctr: 0, averagePosition: 0 }),
      getTopQueries: jest.fn().mockResolvedValue([]),
      getTopPages: jest.fn().mockResolvedValue([]),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [GscController],
      providers: [
        { provide: GscService, useValue: mockGscService },
        { provide: PrismaService, useValue: {} },
      ],
    }).compile();

    controller = module.get<GscController>(GscController);
  });

  describe('getAuthUrl', () => {
    it('should return auth url from service', () => {
      const result = controller.getAuthUrl('ws-1');
      expect(result.url).toContain('accounts.google.com');
      expect(mockGscService.getAuthUrl).toHaveBeenCalledWith('ws-1');
    });
  });

  describe('getStatus', () => {
    it('should return integration status', async () => {
      const result = await controller.getStatus('ws-1');
      expect(result).toEqual({ connected: true });
    });
  });

  describe('getProperties', () => {
    it('should return list of properties', async () => {
      const result = await controller.getProperties('ws-1');
      expect(result).toEqual([{ siteUrl: 'https://example.com' }]);
    });
  });

  describe('sync', () => {
    it('should enqueue a sync-gsc job with default days and return message + jobId', async () => {
      const result = await controller.sync('workspace-1');
      expect(mockPublishJSON).toHaveBeenCalledWith(
        expect.objectContaining({
          body: expect.objectContaining({ workspaceId: 'workspace-1', days: 28 }),
        }),
      );
      expect(result).toEqual({
        message: 'Synchronization queued',
        jobId: 'job-123',
      });
    });

    it('should enqueue a sync-gsc job with custom days if provided', async () => {
      await controller.sync('workspace-1', 7);
      expect(mockPublishJSON).toHaveBeenCalledWith(
        expect.objectContaining({
          body: expect.objectContaining({ workspaceId: 'workspace-1', days: 7 }),
        }),
      );
    });
  });

  describe('getTopQueries', () => {
    it('should call gscService.getTopQueries', async () => {
      await controller.getTopQueries('ws-1', '30');
      expect(mockGscService.getTopQueries).toHaveBeenCalledWith('ws-1', 30);
    });
  });

  describe('getTopPages', () => {
    it('should call gscService.getTopPages', async () => {
      await controller.getTopPages('ws-1', '14');
      expect(mockGscService.getTopPages).toHaveBeenCalledWith('ws-1', 14);
    });
  });
});
