const fs = require('fs');
let content = fs.readFileSync('packages/database/prisma/schema.prisma', 'utf8');

const newModel = `
model SeoContentAnalysis {
  id                String   @id @default(uuid()) @db.Uuid
  workspaceId       String   @map("workspace_id") @db.Uuid
  url               String
  primaryKeyword    String   @map("primary_keyword")
  secondaryKeywords String[] @map("secondary_keywords")
  country           String?
  language          String?
  searchIntent      String?  @map("search_intent")
  sourceSnapshot    Json     @map("source_snapshot")
  analysisResult    Json?    @map("analysis_result")
  status            String   @default("pending") // pending | completed | failed
  errorMessage      String?  @map("error_message")
  createdAt         DateTime @default(now()) @map("created_at")
  updatedAt         DateTime @updatedAt @map("updated_at")

  workspace         Workspace @relation(fields: [workspaceId], references: [id], onDelete: Cascade)

  @@index([workspaceId])
  @@map("seo_content_analyses")
}
`;

if (!content.includes('model SeoContentAnalysis')) {
  content += newModel;
  
  if (content.includes('seoLinks         SeoLink[]') && !content.includes('seoContentAnalyses SeoContentAnalysis[]')) {
    content = content.replace('seoLinks         SeoLink[]', 'seoLinks         SeoLink[]\n  seoContentAnalyses SeoContentAnalysis[]');
  }
  
  fs.writeFileSync('packages/database/prisma/schema.prisma', content);
  console.log('Added SeoContentAnalysis model');
} else {
  console.log('SeoContentAnalysis model already exists');
}
