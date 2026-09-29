"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OpenAIProvider = void 0;
const openai_1 = require("openai");
const zod_to_json_schema_1 = require("zod-to-json-schema");
class OpenAIProvider {
    client;
    defaultModel;
    constructor(apiKey, defaultModel = 'gpt-4o') {
        this.client = new openai_1.default({ apiKey });
        this.defaultModel = defaultModel;
    }
    async generateText(prompt, options) {
        try {
            const response = await this.client.chat.completions.create({
                model: options?.model || this.defaultModel,
                messages: [{ role: 'user', content: prompt }],
                temperature: options?.temperature ?? 0.7,
                max_tokens: options?.maxTokens,
            });
            return response.choices[0]?.message?.content || '';
        }
        catch (error) {
            throw new Error(`OpenAI generateText failed: ${error.message}`);
        }
    }
    async generateStructuredOutput(prompt, schema, schemaName, options) {
        try {
            const jsonSchema = (0, zod_to_json_schema_1.zodToJsonSchema)(schema, schemaName);
            // We pass the JSON schema inside the functions format to enforce structured output
            const response = await this.client.chat.completions.create({
                model: options?.model || this.defaultModel,
                messages: [{ role: 'user', content: prompt }],
                temperature: options?.temperature ?? 0.2,
                tools: [
                    {
                        type: 'function',
                        function: {
                            name: `extract_${schemaName}`,
                            description: `Extract structured data for ${schemaName}`,
                            parameters: jsonSchema.definitions[schemaName],
                        },
                    },
                ],
                tool_choice: {
                    type: 'function',
                    function: { name: `extract_${schemaName}` },
                },
            });
            const toolCall = response.choices[0]?.message?.tool_calls?.[0];
            if (!toolCall) {
                throw new Error('No structured output returned');
            }
            const parsedArgs = JSON.parse(toolCall.function.arguments);
            // Validate the response through Zod
            return schema.parse(parsedArgs);
        }
        catch (error) {
            throw new Error(`OpenAI generateStructuredOutput failed: ${error.message}`);
        }
    }
    async generateEmbedding(text) {
        try {
            const response = await this.client.embeddings.create({
                model: 'text-embedding-3-small',
                input: text,
            });
            return response.data[0]?.embedding || [];
        }
        catch (error) {
            throw new Error(`OpenAI generateEmbedding failed: ${error.message}`);
        }
    }
    async chatWithTools(messages, tools, options) {
        try {
            const formattedTools = tools.length > 0 ? tools.map(t => ({
                type: 'function',
                function: {
                    name: t.name,
                    description: t.description,
                    parameters: t.parameters,
                }
            })) : undefined;
            const response = await this.client.chat.completions.create({
                model: options?.model || this.defaultModel,
                messages: messages,
                tools: formattedTools,
                temperature: options?.temperature ?? 0.7,
            });
            return response.choices[0]?.message;
        }
        catch (error) {
            throw new Error(`OpenAI chatWithTools failed: ${error.message}`);
        }
    }
}
exports.OpenAIProvider = OpenAIProvider;
//# sourceMappingURL=openai.provider.js.map