import { AIProvider, AITool, ChatMessage, GenerateTextOptions } from './provider.interface';
import { z } from 'zod';
export declare class OllamaUnavailableError extends Error {
    constructor(cause?: string);
}
export declare class OllamaModelNotFoundError extends Error {
    constructor(model: string);
}
export declare class OllamaTimeoutError extends Error {
    constructor();
}
export declare class OllamaInvalidResponseError extends Error {
    constructor(detail?: string);
}
export declare class OllamaSchemaValidationError extends Error {
    constructor(issues: string);
}
export declare class OllamaProvider implements AIProvider {
    private readonly baseUrl;
    private readonly defaultModel;
    private readonly embeddingModel;
    constructor(baseUrl?: string, defaultModel?: string, embeddingModel?: string);
    /** Low-level fetch with timeout and Ollama-specific error mapping */
    private ollamaFetch;
    generateText(prompt: string, options?: GenerateTextOptions): Promise<string>;
    generateStructuredOutput<T>(prompt: string, schema: z.Schema<T>, schemaName: string, options?: GenerateTextOptions): Promise<T>;
    generateEmbedding(text: string): Promise<number[]>;
    chatWithTools(messages: ChatMessage[], tools: AITool[], options?: GenerateTextOptions): Promise<ChatMessage>;
    /** Health check – returns availability and loaded models */
    health(): Promise<{
        available: boolean;
        model: string;
        embeddingModel: string;
    }>;
}
//# sourceMappingURL=ollama.provider.d.ts.map