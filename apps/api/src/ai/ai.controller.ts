import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { AiService } from './ai.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('ai')
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @Post('test')
  async testPrompt(@Body('prompt') prompt: string) {
    if (!prompt) {
      return { error: 'Prompt is required' };
    }
    const result = await this.aiService.generateText(prompt);
    return { result };
  }
}
