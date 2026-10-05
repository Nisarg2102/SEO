import { AIProvider, AITool, ChatMessage, GenerateTextOptions } from './provider.interface';
import { z } from 'zod';
import { zodToJsonSchema } from 'zod-to-json-schema';

// Error classes for Ollama-specific failures
export class OllamaUnavailableError extends Error {
  constructor(cause?: string) {
    super(`Local AI is unavailable. Start Ollama and try again.${cause ? ` (${cause})` : ''}`);
    this.name = 'OllamaUnavailableError';
  }
}
export class OllamaModelNotFoundError extends Error {
  constructor(model: string) {
    super(`The configured local AI model "${model}" is not installed. Run: ollama pull ${model}`);
    this.name = 'OllamaModelNotFoundError';
  }
}
export class OllamaTimeoutError extends Error {
  constructor() {
    super('Local AI took too long to respond. Please try again.');
    this.name = 'OllamaTimeoutError';
  }
}
export class OllamaInvalidResponseError extends Error {
  constructor(detail?: string) {
    super(`Local AI returned an invalid response. Please try again.${detail ? ` (${detail})` : ''}`);
    this.name = 'OllamaInvalidResponseError';
  }
}
export class OllamaSchemaValidationError extends Error {
  constructor(issues: string) {
    super(`Local AI response did not match the expected schema: ${issues}`);
    this.name = 'OllamaSchemaValidationError';
  }
}

const DEFAULT_TIMEOUT_MS = 120_000; // 2 minutes – local models can be slow

export class OllamaProvider implements AIProvider {
  private readonly baseUrl: string;
  private readonly defaultModel: string;
  private readonly embeddingModel: string;

  constructor(
    baseUrl = 'http://localhost:11434',
    defaultModel = 'llama3.2',
    embeddingModel = 'nomic-embed-text',
  ) {
    // Strip trailing slash
    this.baseUrl = baseUrl.replace(/\/$/, '');
    this.defaultModel = defaultModel;
    this.embeddingModel = embeddingModel;
  }

  /** Low-level fetch with timeout and Ollama-specific error mapping */
  private async ollamaFetch(path: string, body: unknown): Promise<unknown> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), DEFAULT_TIMEOUT_MS);

    let response: Response;
    try {
      response = await fetch(`${this.baseUrl}${path}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        signal: controller.signal,
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.includes('abort') || (err as any)?.name === 'AbortError') {
        throw new OllamaTimeoutError();
      }
      throw new OllamaUnavailableError(msg);
    } finally {
      clearTimeout(timeout);
    }

    if (response.status === 404) {
      throw new OllamaModelNotFoundError(this.defaultModel);
    }
    if (!response.ok) {
      const text = await response.text().catch(() => '');
      throw new OllamaUnavailableError(`HTTP ${response.status}: ${text.substring(0, 200)}`);
    }

    return response.json();
  }

  async generateText(prompt: string, options?: GenerateTextOptions): Promise<string> {
    const model = options?.model || this.defaultModel;
    const data = await this.ollamaFetch('/api/generate', {
      model,
      prompt,
      stream: false,
      options: {
        temperature: options?.temperature ?? 0.7,
        ...(options?.maxTokens ? { num_predict: options.maxTokens } : {}),
      },
    }) as any;

    const text = data?.response;
    if (typeof text !== 'string') {
      throw new OllamaInvalidResponseError('response field missing');
    }
    return text;
  }

  async generateStructuredOutput<T>(
    prompt: string,
    schema: z.Schema<T>,
    schemaName: string,
    options?: GenerateTextOptions,
  ): Promise<T> {
    const model = options?.model || this.defaultModel;

    // Build JSON schema from Zod schema for Ollama's format parameter
    const jsonSchema = zodToJsonSchema(schema as any, { name: schemaName }) as any;
    const schemaObj = jsonSchema?.definitions?.[schemaName] ?? jsonSchema;

    const systemInstruction = `You MUST respond with valid JSON only. Do not add any explanation, markdown, or text outside the JSON object. The JSON must match this schema: ${JSON.stringify(schemaObj)}`;
    const fullPrompt = `${systemInstruction}\n\n${prompt}`;

    const data = await this.ollamaFetch('/api/generate', {
      model,
      prompt: fullPrompt,
      stream: false,
      format: 'json', // Ollama JSON mode – forces valid JSON output
      options: {
        temperature: options?.temperature ?? 0.2,
      },
    }) as any;

    const rawText: string = data?.response ?? '';
    if (!rawText.trim()) {
      throw new OllamaInvalidResponseError('empty response');
    }

    let parsed: unknown;
    try {
      parsed = JSON.parse(rawText);
    } catch {
      throw new OllamaInvalidResponseError(`JSON parse failed: ${rawText.substring(0, 200)}`);
    }

    // Zod validation
    const result = schema.safeParse(parsed);
    if (!result.success) {
      const issues = result.error.issues.map(i => `${i.path.join('.')}: ${i.message}`).join('; ');
      throw new OllamaSchemaValidationError(issues);
    }

    return result.data;
  }

  async generateEmbedding(text: string): Promise<number[]> {
    const data = await this.ollamaFetch('/api/embeddings', {
      model: this.embeddingModel,
      prompt: text,
    }) as any;

    const embedding = data?.embedding;
    if (!Array.isArray(embedding)) {
      throw new OllamaInvalidResponseError('embedding field missing or not an array');
    }
    return embedding as number[];
  }

  async chatWithTools(
    messages: ChatMessage[],
    tools: AITool[],
    options?: GenerateTextOptions,
  ): Promise<ChatMessage> {
    const model = options?.model || this.defaultModel;

    // Ollama /api/chat supports messages and tools natively (as of v0.3+)
    // Build tool definitions in OpenAI-compatible format (Ollama supports this)
    const ollamaTools = tools.length > 0
      ? tools.map(t => ({
          type: 'function',
          function: {
            name: t.name,
            description: t.description,
            parameters: t.parameters,
          },
        }))
      : undefined;

    const data = await this.ollamaFetch('/api/chat', {
      model,
      messages: messages.map(m => ({
        role: m.role,
        content: m.content,
        ...(m.tool_calls ? { tool_calls: m.tool_calls } : {}),
        ...(m.tool_call_id ? { tool_call_id: m.tool_call_id } : {}),
      })),
      stream: false,
      ...(ollamaTools ? { tools: ollamaTools } : {}),
      options: {
        temperature: options?.temperature ?? 0.7,
      },
    }) as any;

    const msg = data?.message;
    if (!msg) {
      throw new OllamaInvalidResponseError('message field missing from chat response');
    }

    return {
      role: msg.role ?? 'assistant',
      content: msg.content ?? '',
      tool_calls: msg.tool_calls,
    };
  }

  /** Health check – returns availability and loaded models */
  async health(): Promise<{ available: boolean; model: string; embeddingModel: string }> {
    try {
      const res = await fetch(`${this.baseUrl}/api/tags`, {
        signal: AbortSignal.timeout(5000),
      });
      if (!res.ok) return { available: false, model: this.defaultModel, embeddingModel: this.embeddingModel };
      return { available: true, model: this.defaultModel, embeddingModel: this.embeddingModel };
    } catch {
      return { available: false, model: this.defaultModel, embeddingModel: this.embeddingModel };
    }
  }
}
