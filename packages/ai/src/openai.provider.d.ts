import { AIProvider, GenerateTextOptions } from './provider.interface';
import { z } from 'zod';
export declare class OpenAIProvider implements AIProvider {
    private client;
    private defaultModel;
    constructor(apiKey: string, defaultModel?: string);
    generateText(prompt: string, options?: GenerateTextOptions): Promise<string>;
    generateStructuredOutput<T>(prompt: string, schema: z.Schema<T>, schemaName: string, options?: GenerateTextOptions): Promise<T>;
    generateEmbedding(text: string): Promise<number[]>;
    chatWithTools(messages: any[], tools: any[], options?: GenerateTextOptions): Promise<any>;
}
//# sourceMappingURL=openai.provider.d.ts.map