"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MockAIProvider = void 0;
class MockAIProvider {
    async generateText(prompt, options) {
        return 'This is a mocked AI response.';
    }
    async generateStructuredOutput(prompt, schema, schemaName, options) {
        // Attempt to return a mock object that matches the schema 
        // In a real mock you'd allow configuring the response
        return {};
    }
    async generateEmbedding(text) {
        return Array(1536).fill(0.1);
    }
    async chatWithTools(messages, tools, options) {
        return {
            role: 'assistant',
            content: 'This is a mocked chat response.',
        };
    }
}
exports.MockAIProvider = MockAIProvider;
//# sourceMappingURL=mock.provider.js.map