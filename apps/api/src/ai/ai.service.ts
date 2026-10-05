import { Injectable, Logger } from '@nestjs/common';
import {
  AIProvider,
  OllamaProvider,
  MockAIProvider,
  GenerateTextOptions,
  OllamaUnavailableError,
  OllamaModelNotFoundError,
  OllamaTimeoutError,
  OllamaSchemaValidationError,
  OllamaInvalidResponseError,
} from '@ai-marketing/ai';
import { z } from 'zod';

@Injectable()
export class AiService {
  private provider: AIProvider;
  private readonly logger = new Logger(AiService.name);
  readonly ollamaBaseUrl: string;
  readonly ollamaModel: string;
  readonly ollamaEmbeddingModel: string;

  constructor() {
    const baseUrl = process.env.OLLAMA_BASE_URL || 'http://localhost:11434';
    const model = process.env.OLLAMA_MODEL || 'llama3.2';
    const embeddingModel = process.env.OLLAMA_EMBEDDING_MODEL || 'nomic-embed-text';

    this.ollamaBaseUrl = baseUrl;
    this.ollamaModel = model;
    this.ollamaEmbeddingModel = embeddingModel;

    if (process.env.NODE_ENV === 'test') {
      this.logger.warn('Using MockAIProvider in test environment');
      this.provider = new MockAIProvider();
    } else {
      this.logger.log(`Using OllamaProvider — baseUrl: ${baseUrl}, model: ${model}`);
      this.provider = new OllamaProvider(baseUrl, model, embeddingModel);
    }
  }

  // Allow injecting a mock for tests
  setProvider(provider: AIProvider) {
    this.provider = provider;
  }

  /** Map Ollama-specific errors to safe user-facing messages */
  private mapError(error: unknown): Error {
    if (
      error instanceof OllamaUnavailableError ||
      error instanceof OllamaModelNotFoundError ||
      error instanceof OllamaTimeoutError ||
      error instanceof OllamaInvalidResponseError ||
      error instanceof OllamaSchemaValidationError
    ) {
      return error; // already user-safe
    }
    const msg = error instanceof Error ? error.message : String(error);
    return new Error(`AI request failed: ${msg}`);
  }

  async generateText(prompt: string, options?: GenerateTextOptions): Promise<string> {
    const start = Date.now();
    try {
      this.logger.log(`[Ollama] Generating text (model: ${options?.model || this.ollamaModel})`);
      const result = await this.provider.generateText(prompt, options);
      this.logger.log(`[Ollama] Text generation completed in ${Date.now() - start}ms`);
      return result;
    } catch (error: unknown) {
      const mapped = this.mapError(error);
      this.logger.error(`[Ollama] Text generation failed in ${Date.now() - start}ms: ${mapped.message}`);
      throw mapped;
    }
  }

  async generateStructuredOutput<T>(
    prompt: string,
    schema: z.Schema<T>,
    schemaName: string,
    options?: GenerateTextOptions,
  ): Promise<T> {
    const start = Date.now();
    try {
      this.logger.log(`[Ollama] Generating structured output (${schemaName})`);
      const result = await this.provider.generateStructuredOutput(prompt, schema, schemaName, options);
      this.logger.log(`[Ollama] Structured generation completed in ${Date.now() - start}ms`);
      return result;
    } catch (error: unknown) {
      const mapped = this.mapError(error);
      this.logger.error(`[Ollama] Structured generation failed in ${Date.now() - start}ms: ${mapped.message}`);
      throw mapped;
    }
  }

  async generateEmbedding(text: string): Promise<number[]> {
    const start = Date.now();
    try {
      this.logger.log(`[Ollama] Generating embedding (model: ${this.ollamaEmbeddingModel})`);
      const result = await this.provider.generateEmbedding(text);
      this.logger.log(`[Ollama] Embedding generated in ${Date.now() - start}ms`);
      return result;
    } catch (error: unknown) {
      const mapped = this.mapError(error);
      this.logger.error(`[Ollama] Embedding generation failed in ${Date.now() - start}ms: ${mapped.message}`);
      throw mapped;
    }
  }

  async chatWithTools(messages: any[], tools: any[], options?: GenerateTextOptions): Promise<any> {
    const start = Date.now();
    try {
      this.logger.log(`[Ollama] Chat with ${tools.length} tools`);
      const result = await this.provider.chatWithTools(messages, tools, options);
      this.logger.log(`[Ollama] Chat completed in ${Date.now() - start}ms`);
      return result;
    } catch (error: unknown) {
      const mapped = this.mapError(error);
      this.logger.error(`[Ollama] Chat failed in ${Date.now() - start}ms: ${mapped.message}`);
      throw mapped;
    }
  }

  /** Check Ollama availability for the health endpoint */
  async checkHealth(): Promise<{ provider: string; available: boolean; model: string; embeddingModel: string }> {
    if (this.provider instanceof OllamaProvider) {
      const health = await this.provider.health();
      return { provider: 'ollama', ...health };
    }
    // In test/mock mode
    return { provider: 'mock', available: true, model: 'mock', embeddingModel: 'mock' };
  }
}
