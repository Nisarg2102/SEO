import { Test, TestingModule } from '@nestjs/testing';
import { AiService } from './ai.service';
import { MockAIProvider } from '@ai-marketing/ai';

describe('AiService', () => {
  let service: AiService;

  beforeEach(async () => {
    // Explicitly set NODE_ENV to force mock if .env wasn't cleared
    process.env.NODE_ENV = 'test';
    
    const module: TestingModule = await Test.createTestingModule({
      providers: [AiService],
    }).compile();

    service = module.get<AiService>(AiService);
    // Explicitly ensure mock provider is used for tests
    service.setProvider(new MockAIProvider());
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should generate text using the mock provider', async () => {
    const result = await service.generateText('Hello AI');
    expect(result).toEqual('This is a mocked AI response.');
  });
});
