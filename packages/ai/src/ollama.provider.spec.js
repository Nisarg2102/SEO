"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * OllamaProvider unit tests — all Ollama HTTP calls are mocked.
 * No real Ollama installation is required for these tests.
 */
const ollama_provider_1 = require("./ollama.provider");
const zod_1 = require("zod");
// Minimal fetch mock helper
function mockFetch(response, status = 200) {
    return jest.fn().mockResolvedValue({
        ok: status >= 200 && status < 300,
        status,
        json: async () => response,
        text: async () => JSON.stringify(response),
    });
}
function mockFetchFailure(error) {
    return jest.fn().mockRejectedValue(error);
}
describe('OllamaProvider', () => {
    let provider;
    beforeEach(() => {
        provider = new ollama_provider_1.OllamaProvider('http://localhost:11434', 'llama3.2', 'nomic-embed-text');
    });
    afterEach(() => {
        jest.restoreAllMocks();
    });
    // ─── generateText ─────────────────────────────────────────────────────────
    it('generateText returns text on success', async () => {
        global.fetch = mockFetch({ response: 'Hello from Ollama' });
        const result = await provider.generateText('Say hello');
        expect(result).toBe('Hello from Ollama');
    });
    it('generateText throws OllamaUnavailableError on network failure', async () => {
        global.fetch = mockFetchFailure(new Error('ECONNREFUSED'));
        await expect(provider.generateText('hi')).rejects.toThrow(ollama_provider_1.OllamaUnavailableError);
    });
    it('generateText throws OllamaInvalidResponseError on missing response field', async () => {
        global.fetch = mockFetch({ model: 'llama3.2' });
        await expect(provider.generateText('hi')).rejects.toThrow(ollama_provider_1.OllamaInvalidResponseError);
    });
    it('generateText throws OllamaUnavailableError on 500 status', async () => {
        global.fetch = mockFetch({ error: 'internal error' }, 500);
        await expect(provider.generateText('hi')).rejects.toThrow(ollama_provider_1.OllamaUnavailableError);
    });
    // ─── generateStructuredOutput ─────────────────────────────────────────────
    it('generateStructuredOutput returns validated data on success', async () => {
        const schema = zod_1.z.object({ summary: zod_1.z.string(), actions: zod_1.z.array(zod_1.z.string()) });
        global.fetch = mockFetch({ response: JSON.stringify({ summary: 'Great!', actions: ['Do this'] }) });
        const result = await provider.generateStructuredOutput('Analyze', schema, 'Test');
        expect(result.summary).toBe('Great!');
        expect(result.actions).toEqual(['Do this']);
    });
    it('generateStructuredOutput throws OllamaSchemaValidationError on invalid JSON schema', async () => {
        const schema = zod_1.z.object({ summary: zod_1.z.string() });
        global.fetch = mockFetch({ response: JSON.stringify({ wrongField: 123 }) });
        await expect(provider.generateStructuredOutput('p', schema, 'Bad')).rejects.toThrow(ollama_provider_1.OllamaSchemaValidationError);
    });
    it('generateStructuredOutput throws OllamaInvalidResponseError on non-JSON response', async () => {
        const schema = zod_1.z.object({ summary: zod_1.z.string() });
        global.fetch = mockFetch({ response: 'This is not JSON at all!!!' });
        await expect(provider.generateStructuredOutput('p', schema, 'Bad')).rejects.toThrow(ollama_provider_1.OllamaInvalidResponseError);
    });
    it('generateStructuredOutput throws OllamaInvalidResponseError on empty response', async () => {
        const schema = zod_1.z.object({ summary: zod_1.z.string() });
        global.fetch = mockFetch({ response: '' });
        await expect(provider.generateStructuredOutput('p', schema, 'Empty')).rejects.toThrow(ollama_provider_1.OllamaInvalidResponseError);
    });
    // ─── generateEmbedding ────────────────────────────────────────────────────
    it('generateEmbedding returns number array', async () => {
        global.fetch = mockFetch({ embedding: [0.1, 0.2, 0.3] });
        const emb = await provider.generateEmbedding('test');
        expect(emb).toEqual([0.1, 0.2, 0.3]);
    });
    it('generateEmbedding throws OllamaInvalidResponseError when embedding field missing', async () => {
        global.fetch = mockFetch({ model: 'nomic-embed-text' });
        await expect(provider.generateEmbedding('test')).rejects.toThrow(ollama_provider_1.OllamaInvalidResponseError);
    });
    // ─── chatWithTools ────────────────────────────────────────────────────────
    it('chatWithTools returns assistant message', async () => {
        global.fetch = mockFetch({ message: { role: 'assistant', content: 'Hi there!', tool_calls: undefined } });
        const result = await provider.chatWithTools([{ role: 'user', content: 'Hello', }], []);
        expect(result.role).toBe('assistant');
        expect(result.content).toBe('Hi there!');
    });
    it('chatWithTools throws OllamaInvalidResponseError when message missing', async () => {
        global.fetch = mockFetch({ done: true });
        await expect(provider.chatWithTools([{ role: 'user', content: 'hi' }], [])).rejects.toThrow(ollama_provider_1.OllamaInvalidResponseError);
    });
    // ─── health ───────────────────────────────────────────────────────────────
    it('health returns available=true when Ollama responds', async () => {
        global.fetch = jest.fn().mockResolvedValue({ ok: true, json: async () => ({ models: [] }) });
        const h = await provider.health();
        expect(h.available).toBe(true);
        expect(h.model).toBe('llama3.2');
    });
    it('health returns available=false when Ollama is down', async () => {
        global.fetch = jest.fn().mockRejectedValue(new Error('ECONNREFUSED'));
        const h = await provider.health();
        expect(h.available).toBe(false);
    });
});
//# sourceMappingURL=ollama.provider.spec.js.map