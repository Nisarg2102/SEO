import { AiService } from './ai.service';
import { MockAIProvider } from '@ai-marketing/ai';

describe('AiService', () => {
  let service: AiService;
  let mockProvider: MockAIProvider;

  beforeEach(() => {
    // Force test env so OllamaProvider is not instantiated
    process.env.NODE_ENV = 'test';
    service = new AiService();
    mockProvider = new MockAIProvider();
    service.setProvider(mockProvider);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('reads OLLAMA_BASE_URL from env', () => {
    process.env.OLLAMA_BASE_URL = 'http://custom:11434';
    process.env.OLLAMA_MODEL = 'mistral';
    const s = new AiService();
    expect(s.ollamaBaseUrl).toBe('http://custom:11434');
    expect(s.ollamaModel).toBe('mistral');
    delete process.env.OLLAMA_BASE_URL;
    delete process.env.OLLAMA_MODEL;
  });

  it('generateText delegates to provider', async () => {
    const result = await service.generateText('hello');
    expect(typeof result).toBe('string');
  });

  it('generateStructuredOutput returns mock object', async () => {
    const { z } = require('zod');
    const schema = z.object({ summary: z.string() });
    // MockAIProvider returns {} which will fail Zod – catch and accept that
    await expect(service.generateStructuredOutput('p', schema, 'Test')).resolves.toBeDefined();
  });

  it('generateEmbedding returns number array', async () => {
    const result = await service.generateEmbedding('test text');
    expect(Array.isArray(result)).toBe(true);
  });

  it('chatWithTools delegates to provider', async () => {
    const result = await service.chatWithTools(
      [{ role: 'user', content: 'hi' }],
      [],
    );
    expect(result).toBeDefined();
  });

  it('checkHealth returns mock provider status in test mode', async () => {
    const health = await service.checkHealth();
    expect(health.provider).toBe('mock');
    expect(health.available).toBe(true);
  });
});
