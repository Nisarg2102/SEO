"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OllamaProvider = exports.OllamaSchemaValidationError = exports.OllamaInvalidResponseError = exports.OllamaTimeoutError = exports.OllamaModelNotFoundError = exports.OllamaUnavailableError = void 0;
const zod_to_json_schema_1 = require("zod-to-json-schema");
// Error classes for Ollama-specific failures
class OllamaUnavailableError extends Error {
    constructor(cause) {
        super(`Local AI is unavailable. Start Ollama and try again.${cause ? ` (${cause})` : ''}`);
        this.name = 'OllamaUnavailableError';
    }
}
exports.OllamaUnavailableError = OllamaUnavailableError;
class OllamaModelNotFoundError extends Error {
    constructor(model) {
        super(`The configured local AI model "${model}" is not installed. Run: ollama pull ${model}`);
        this.name = 'OllamaModelNotFoundError';
    }
}
exports.OllamaModelNotFoundError = OllamaModelNotFoundError;
class OllamaTimeoutError extends Error {
    constructor() {
        super('Local AI took too long to respond. Please try again.');
        this.name = 'OllamaTimeoutError';
    }
}
exports.OllamaTimeoutError = OllamaTimeoutError;
class OllamaInvalidResponseError extends Error {
    constructor(detail) {
        super(`Local AI returned an invalid response. Please try again.${detail ? ` (${detail})` : ''}`);
        this.name = 'OllamaInvalidResponseError';
    }
}
exports.OllamaInvalidResponseError = OllamaInvalidResponseError;
class OllamaSchemaValidationError extends Error {
    constructor(issues) {
        super(`Local AI response did not match the expected schema: ${issues}`);
        this.name = 'OllamaSchemaValidationError';
    }
}
exports.OllamaSchemaValidationError = OllamaSchemaValidationError;
const DEFAULT_TIMEOUT_MS = 120_000; // 2 minutes – local models can be slow
class OllamaProvider {
    baseUrl;
    defaultModel;
    embeddingModel;
    constructor(baseUrl = 'http://localhost:11434', defaultModel = 'llama3.2', embeddingModel = 'nomic-embed-text') {
        // Strip trailing slash
        this.baseUrl = baseUrl.replace(/\/$/, '');
        this.defaultModel = defaultModel;
        this.embeddingModel = embeddingModel;
    }
    /** Low-level fetch with timeout and Ollama-specific error mapping */
    async ollamaFetch(path, body) {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), DEFAULT_TIMEOUT_MS);
        let response;
        try {
            response = await fetch(`${this.baseUrl}${path}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
                signal: controller.signal,
            });
        }
        catch (err) {
            const msg = err instanceof Error ? err.message : String(err);
            if (msg.includes('abort') || err?.name === 'AbortError') {
                throw new OllamaTimeoutError();
            }
            throw new OllamaUnavailableError(msg);
        }
        finally {
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
    async generateText(prompt, options) {
        const model = options?.model || this.defaultModel;
        const data = await this.ollamaFetch('/api/generate', {
            model,
            prompt,
            stream: false,
            options: {
                temperature: options?.temperature ?? 0.7,
                ...(options?.maxTokens ? { num_predict: options.maxTokens } : {}),
            },
        });
        const text = data?.response;
        if (typeof text !== 'string') {
            throw new OllamaInvalidResponseError('response field missing');
        }
        return text;
    }
    async generateStructuredOutput(prompt, schema, schemaName, options) {
        const model = options?.model || this.defaultModel;
        // Build JSON schema from Zod schema for Ollama's format parameter
        const jsonSchema = (0, zod_to_json_schema_1.zodToJsonSchema)(schema, { name: schemaName });
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
        });
        const rawText = data?.response ?? '';
        if (!rawText.trim()) {
            throw new OllamaInvalidResponseError('empty response');
        }
        let parsed;
        try {
            parsed = JSON.parse(rawText);
        }
        catch {
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
    async generateEmbedding(text) {
        const data = await this.ollamaFetch('/api/embeddings', {
            model: this.embeddingModel,
            prompt: text,
        });
        const embedding = data?.embedding;
        if (!Array.isArray(embedding)) {
            throw new OllamaInvalidResponseError('embedding field missing or not an array');
        }
        return embedding;
    }
    async chatWithTools(messages, tools, options) {
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
        });
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
    async health() {
        try {
            const res = await fetch(`${this.baseUrl}/api/tags`, {
                signal: AbortSignal.timeout(5000),
            });
            if (!res.ok)
                return { available: false, model: this.defaultModel, embeddingModel: this.embeddingModel };
            return { available: true, model: this.defaultModel, embeddingModel: this.embeddingModel };
        }
        catch {
            return { available: false, model: this.defaultModel, embeddingModel: this.embeddingModel };
        }
    }
}
exports.OllamaProvider = OllamaProvider;
//# sourceMappingURL=ollama.provider.js.map