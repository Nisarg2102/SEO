const fs = require('fs');

function patchAiService() {
  const path = 'apps/api/src/ai/ai.service.ts';
  let code = fs.readFileSync(path, 'utf8');

  // Enhance generateText
  code = code.replace(
    /this\.logger\.error\(\`Text generation failed in \$\{Date\.now\(\) \- start\}ms\`\, error\.stack\);/,
    "this.logger.error(`Text generation failed in ${Date.now() - start}ms. Error type: ${error.name}, Message: ${error.message}`);\n      // Safe logging\n      console.error('[AI_ERROR]', { type: error.name, message: error.message, model: options?.model || this.defaultModel });"
  );

  // Enhance generateStructuredOutput
  code = code.replace(
    /this\.logger\.error\(\`Structured generation failed in \$\{Date\.now\(\) \- start\}ms\`\, error\.stack\);/,
    "this.logger.error(`Structured generation failed in ${Date.now() - start}ms. Error type: ${error.name}, Message: ${error.message}`);\n      // Safe logging\n      console.error('[AI_ERROR]', { type: error.name, message: error.message, schema: schemaName, model: options?.model || this.defaultModel });"
  );

  // Enhance chatWithTools
  code = code.replace(
    /this\.logger\.error\(\`Chat loop failed in \$\{Date\.now\(\) \- start\}ms\`\, error\.stack\);/,
    "this.logger.error(`Chat loop failed in ${Date.now() - start}ms. Error type: ${error.name}, Message: ${error.message}`);\n      // Safe logging\n      console.error('[AI_ERROR]', { type: error.name, message: error.message, toolsCount: tools.length });"
  );

  // Add defaultModel property to AiService
  code = code.replace(
    /private readonly logger = new Logger\(AiService\.name\);/,
    "private readonly logger = new Logger(AiService.name);\n  private defaultModel = 'gpt-4o';"
  );

  fs.writeFileSync(path, code);
}

patchAiService();
