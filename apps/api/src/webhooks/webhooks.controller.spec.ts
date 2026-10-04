// Mock QStash Client so tests never make real network calls
const mockPublishJSON = jest.fn().mockResolvedValue({ messageId: 'queued-123' });
jest.mock('@upstash/qstash', () => ({
  Client: jest.fn().mockImplementation(() => ({ publishJSON: mockPublishJSON })),
}));

import { Test, TestingModule } from '@nestjs/testing';
import { PostizWebhooksController, WebhooksController } from './webhooks.controller';

describe('WebhooksControllers', () => {
  let postizController: PostizWebhooksController;
  let n8nController: WebhooksController;

  beforeEach(async () => {
    mockPublishJSON.mockClear();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [WebhooksController, PostizWebhooksController],
      providers: [],
    }).compile();

    n8nController = module.get<WebhooksController>(WebhooksController);
    postizController = module.get<PostizWebhooksController>(PostizWebhooksController);
  });

  it('n8n should enqueue research sync via QStash and return a jobId', async () => {
    const res = await n8nController.syncResearch();
    expect(mockPublishJSON).toHaveBeenCalledWith(
      expect.objectContaining({
        body: {},
      }),
    );
    expect(res.jobId).toBe('queued-123');
    expect(res.message).toBe('Research sync queued');
  });

  it('postiz should enqueue postiz sync via QStash and return a jobId', async () => {
    const res = await postizController.syncPostizStatuses();
    expect(mockPublishJSON).toHaveBeenCalledWith(
      expect.objectContaining({
        body: {},
      }),
    );
    expect(res.jobId).toBe('queued-123');
    expect(res.message).toBe('Postiz sync queued');
  });
});
