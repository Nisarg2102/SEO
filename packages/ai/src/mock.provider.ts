import { AIProvider, GenerateTextOptions } from './provider.interface';
import { z } from 'zod';

export class MockAIProvider implements AIProvider {
  async generateText(prompt: string, options?: GenerateTextOptions): Promise<string> {
    return 'This is a mocked AI response.';
  }

  async generateStructuredOutput<T>(
    prompt: string,
    schema: z.Schema<T>,
    schemaName: string,
    options?: GenerateTextOptions
  ): Promise<T> {
    // Attempt to return a mock object that matches the schema 
    // In a real mock you'd allow configuring the response
    return {} as T; 
  }

  async generateEmbedding(text: string): Promise<number[]> {
    return Array(1536).fill(0.1);
  }

  async chatWithTools(messages: any[], tools: any[], options?: GenerateTextOptions): Promise<any> {
    return {
      role: 'assistant',
      content: 'This is a mocked chat response.',
    };
  }
}
