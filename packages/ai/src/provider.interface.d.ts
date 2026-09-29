import { z } from 'zod';
export interface GenerateTextOptions {
    model?: string;
    temperature?: number;
    maxTokens?: number;
}
export interface AITool {
    name: string;
    description: string;
    parameters: any;
    execute: (args: any) => Promise<any>;
    requiresConfirmation?: boolean;
}
export interface ChatMessage {
    role: 'system' | 'user' | 'assistant' | 'tool';
    content: string;
    name?: string;
    tool_calls?: any[];
    tool_call_id?: string;
}
export interface AIProvider {
    generateText(prompt: string, options?: GenerateTextOptions): Promise<string>;
    generateStructuredOutput<T>(prompt: string, schema: z.Schema<T>, schemaName: string, options?: GenerateTextOptions): Promise<T>;
    generateEmbedding(text: string): Promise<number[]>;
    chatWithTools(messages: ChatMessage[], tools: AITool[], options?: GenerateTextOptions): Promise<ChatMessage>;
}
//# sourceMappingURL=provider.interface.d.ts.map