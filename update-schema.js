const fs = require('fs');
let s = fs.readFileSync('apps/api/src/analytics/analytics.service.ts', 'utf8');

s = s.replace(
  "import { Prisma } from '@prisma/client';",
  "import { Prisma } from '@prisma/client';\nimport { z } from 'zod';"
);

s = s.replace(
  /const schema = {\s*type: 'object',[\s\S]*?};\n\n    return this\.aiService\.generateStructuredOutput\(prompt, schema, 'AnalyticsInsightsSchema'\);/g,
  `const schema = z.object({
      summary: z.string().describe('2-3 sentence performance summary.'),
      recommendedActions: z.array(z.string()).describe('2-3 bullet points for next actions.')
    });

    return this.aiService.generateStructuredOutput<{summary: string, recommendedActions: string[]}>(prompt, schema, 'AnalyticsInsightsSchema');`
);

fs.writeFileSync('apps/api/src/analytics/analytics.service.ts', s);
