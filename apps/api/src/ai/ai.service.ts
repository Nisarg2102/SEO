import { Injectable, Logger } from '@nestjs/common';
import { AIProvider, OpenAIProvider, MockAIProvider, GenerateTextOptions } from '@ai-marketing/ai';
import { z } from 'zod';

@Injectable()
export class AiService {
  private provider: AIProvider;
  private readonly logger = new Logger(AiService.name);

  constructor() {
    const apiKey = process.env.AI_API_KEY;
    const model = process.env.AI_MODEL || 'gpt-4o';
    
    if (process.env.NODE_ENV === 'test' || !apiKey) {
      this.logger.warn('Using MockAIProvider because AI_API_KEY is missing or NODE_ENV is test');
      this.provider = new MockAIProvider();
    } else {
      this.provider = new OpenAIProvider(apiKey, model);
    }
  }

  // Allow injecting a mock for tests explicitly if needed
  setProvider(provider: AIProvider) {
    this.provider = provider;
  }

  async generateText(prompt: string, options?: GenerateTextOptions): Promise<string> {
    const start = Date.now();
    try {
      this.logger.log(`Generating text using model: ${options?.model || 'default'}`);
      const result = await this.provider.generateText(prompt, options);
      this.logger.log(`Text generation completed in ${Date.now() - start}ms`);
      return result;
    } catch (error: any) {
      this.logger.error(`Text generation failed in ${Date.now() - start}ms`, error.stack);
      throw error;
    }
  }

  async generateStructuredOutput<T>(
    prompt: string,
    schema: z.Schema<T>,
    schemaName: string,
    options?: GenerateTextOptions
  ): Promise<T> {
    const start = Date.now();
    try {
      this.logger.log(`Generating structured output (${schemaName}) using model: ${options?.model || 'default'}`);
      const result = await this.provider.generateStructuredOutput(prompt, schema, schemaName, options);
      this.logger.log(`Structured generation completed in ${Date.now() - start}ms`);
      return result;
    } catch (error: any) {
      this.logger.error(`Structured generation failed in ${Date.now() - start}ms`, error.stack);
      throw error;
    }
  }

  async generateEmbedding(text: string): Promise<number[]> {
    const start = Date.now();
    try {
      this.logger.log(`Generating embedding...`);
      const result = await this.provider.generateEmbedding(text);
      this.logger.log(`Embedding generated in ${Date.now() - start}ms`);
      return result;
    } catch (error: any) {
      this.logger.error(`Embedding generation failed in ${Date.now() - start}ms`, error.stack);
      throw error;
    }
  }

  async chatWithTools(messages: any[], tools: any[], options?: GenerateTextOptions): Promise<any> {
    const start = Date.now();
    try {
      this.logger.log(`Executing chat loop with ${tools.length} tools`);
      const result = await this.provider.chatWithTools(messages, tools, options);
      this.logger.log(`Chat loop execution completed in ${Date.now() - start}ms`);
      return result;
    } catch (error: any) {
      this.logger.error(`Chat loop failed in ${Date.now() - start}ms`, error.stack);
      throw error;
    }
  }
}
