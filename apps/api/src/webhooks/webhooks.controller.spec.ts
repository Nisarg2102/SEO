import { Test, TestingModule } from '@nestjs/testing';
import { PostizWebhooksController, WebhooksController } from './webhooks.controller';

describe('WebhooksControllers', () => {
  let postizController: PostizWebhooksController;
  let n8nController: WebhooksController;
  let mockResearchQueue: any;
  let mockWebhooksQueue: any;

  beforeEach(async () => {
    mockResearchQueue = {
      add: jest.fn().mockResolvedValue({ id: 'res-job-1' }),
    };
    mockWebhooksQueue = {
      add: jest.fn().mockResolvedValue({ id: 'web-job-1' }),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [WebhooksController, PostizWebhooksController],
      providers: [
      ],
    }).compile();

    n8nController = module.get<WebhooksController>(WebhooksController);
    postizController = module.get<PostizWebhooksController>(PostizWebhooksController);
  });

  it('n8n should enqueue research sync', async () => {
    const res = await n8nController.syncResearch();
    expect(mockResearchQueue.add).toHaveBeenCalledWith('sync-all', {});
    expect(res.jobId).toBe('res-job-1');
  });

  it('postiz should enqueue postiz sync', async () => {
    const res = await postizController.syncPostizStatuses();
    expect(mockWebhooksQueue.add).toHaveBeenCalledWith('sync-postiz', {});
    expect(res.jobId).toBe('web-job-1');
  });
});
