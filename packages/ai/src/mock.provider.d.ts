import { AIProvider, GenerateTextOptions } from './provider.interface';
import { z } from 'zod';
export declare class MockAIProvider implements AIProvider {
    generateText(prompt: string, options?: GenerateTextOptions): Promise<string>;
    generateStructuredOutput<T>(prompt: string, schema: z.Schema<T>, schemaName: string, options?: GenerateTextOptions): Promise<T>;
    generateEmbedding(text: string): Promise<number[]>;
    chatWithTools(messages: any[], tools: any[], options?: GenerateTextOptions): Promise<any>;
}
//# sourceMappingURL=mock.provider.d.ts.map