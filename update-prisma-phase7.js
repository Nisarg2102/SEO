const fs = require('fs');
let content = fs.readFileSync('packages/database/prisma/schema.prisma', 'utf8');

const newModels = `
model SocialPost {
  id                String    @id @default(uuid()) @db.Uuid
  workspaceId       String    @map("workspace_id") @db.Uuid
  sourceType        String?   @map("source_type") // draft | brief | url | topic
  sourceId          String?   @map("source_id") @db.Uuid
  sourceUrl         String?   @map("source_url")
  platform          String
  connectedAccountId String?  @map("connected_account_id")
  content           Json      // { text, hook, cta, mediaSuggestion, notes }
  hashtags          String[]
  status            String    @default("draft") // draft | scheduled | published | failed
  approvalStatus    String    @default("pending") // pending | approved | rejected
  scheduledAt       DateTime? @map("scheduled_at")
  publishedAt       DateTime? @map("published_at")
  externalPostId    String?   @map("external_post_id")
  errorMessage      String?   @map("error_message")
  createdAt         DateTime  @default(now()) @map("created_at")
  updatedAt         DateTime  @updatedAt @map("updated_at")

  workspace         Workspace @relation(fields: [workspaceId], references: [id], onDelete: Cascade)

  @@index([workspaceId])
  @@index([sourceId])
  @@map("social_posts")
}
`;

if (!content.includes('model SocialPost')) {
  content += newModels;
  
  // Add to Workspace model
  if (content.includes('seoContentDrafts SeoContentDraft[]') && !content.includes('socialPosts SocialPost[]')) {
    content = content.replace('seoContentDrafts SeoContentDraft[]', 'seoContentDrafts SeoContentDraft[]\n  socialPosts SocialPost[]');
  }
  
  fs.writeFileSync('packages/database/prisma/schema.prisma', content);
  console.log('Added Phase 7 models');
} else {
  console.log('Phase 7 models already exist');
}
