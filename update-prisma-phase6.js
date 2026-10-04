const fs = require('fs');
let content = fs.readFileSync('packages/database/prisma/schema.prisma', 'utf8');

const newModels = `
model SeoContentBrief {
  id                String   @id @default(uuid()) @db.Uuid
  workspaceId       String   @map("workspace_id") @db.Uuid
  primaryKeyword    String   @map("primary_keyword")
  secondaryKeywords String[] @map("secondary_keywords")
  topic             String?
  country           String?
  language          String?
  contentType       String?  @map("content_type")
  searchIntent      String?  @map("search_intent")
  briefData         Json?    @map("brief_data")
  status            String   @default("pending") // pending | completed | failed | approved
  errorMessage      String?  @map("error_message")
  createdAt         DateTime @default(now()) @map("created_at")
  updatedAt         DateTime @updatedAt @map("updated_at")

  workspace         Workspace @relation(fields: [workspaceId], references: [id], onDelete: Cascade)
  drafts            SeoContentDraft[]

  @@index([workspaceId])
  @@map("seo_content_briefs")
}

model SeoContentDraft {
  id                String   @id @default(uuid()) @db.Uuid
  workspaceId       String   @map("workspace_id") @db.Uuid
  briefId           String   @map("brief_id") @db.Uuid
  title             String
  content           String   @db.Text
  metadata          Json?
  status            String   @default("draft") // draft | approved | published
  version           Int      @default(1)
  createdAt         DateTime @default(now()) @map("created_at")
  updatedAt         DateTime @updatedAt @map("updated_at")

  workspace         Workspace       @relation(fields: [workspaceId], references: [id], onDelete: Cascade)
  brief             SeoContentBrief @relation(fields: [briefId], references: [id], onDelete: Cascade)

  @@index([workspaceId])
  @@index([briefId])
  @@map("seo_content_drafts")
}
`;

if (!content.includes('model SeoContentBrief')) {
  content += newModels;
  
  if (content.includes('seoContentAnalyses SeoContentAnalysis[]') && !content.includes('seoContentBriefs SeoContentBrief[]')) {
    content = content.replace('seoContentAnalyses SeoContentAnalysis[]', 'seoContentAnalyses SeoContentAnalysis[]\n  seoContentBriefs SeoContentBrief[]\n  seoContentDrafts SeoContentDraft[]');
  }
  
  fs.writeFileSync('packages/database/prisma/schema.prisma', content);
  console.log('Added Phase 6 models');
} else {
  console.log('Phase 6 models already exist');
}
