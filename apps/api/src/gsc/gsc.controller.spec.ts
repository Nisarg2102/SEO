jest.mock('@prisma/client', () => ({ PrismaClient: class {}, Prisma: {} }), { virtual: true });
import { Test, TestingModule } from '@nestjs/testing';
import { GscController } from './gsc.controller';
import { GscService } from './gsc.service';
import { getQueueToken } from '@nestjs/bullmq';
import { ANALYTICS_QUEUE } from '../queues/queues.constants';

import { PrismaService } from '../prisma/prisma.service';

describe('GscController', () => {
  let controller: GscController;
  let mockQueue: any;
  let mockGscService: any;
  let mockPrismaService: any;

  beforeEach(async () => {
    mockQueue = {
      add: jest.fn().mockResolvedValue({ id: 'job-123' }),
    };
    mockGscService = {};
    mockPrismaService = {};

    const module: TestingModule = await Test.createTestingModule({
      controllers: [GscController],
      providers: [
        { provide: GscService, useValue: mockGscService },
        { provide: getQueueToken(ANALYTICS_QUEUE), useValue: mockQueue },
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    controller = module.get<GscController>(GscController);
  });

  describe('sync', () => {
    it('should enqueue a sync-gsc job with default days and return 202 Accepted formatting', async () => {
      const workspaceId = 'workspace-1';
      const result = await controller.sync(workspaceId);

      expect(mockQueue.add).toHaveBeenCalledWith('sync-gsc', { workspaceId, days: 28 });
      expect(result).toEqual({
        message: 'Synchronization queued',
        jobId: 'job-123',
      });
    });

    it('should enqueue a sync-gsc job with custom days if provided', async () => {
      const workspaceId = 'workspace-1';
      const result = await controller.sync(workspaceId, 7);

      expect(mockQueue.add).toHaveBeenCalledWith('sync-gsc', { workspaceId, days: 7 });
    });
  });
});
