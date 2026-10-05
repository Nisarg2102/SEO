import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';
import { AiService } from './ai/ai.service';

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly aiService: AiService,
  ) {}

  @Get('health')
  async getHealth() {
    const dbStatus = await this.appService.checkDatabaseConnection();
    return {
      status: 'ok',
      service: 'api',
      database: dbStatus,
    };
  }

  @Get('health/ai')
  async getAiHealth() {
    const ai = await this.aiService.checkHealth();
    return {
      provider: ai.provider,
      available: ai.available,
      model: ai.model,
      embeddingModel: ai.embeddingModel,
      message: ai.available
        ? 'Local AI is available.'
        : 'Local AI is unavailable. Start Ollama and try again.',
    };
  }
}

