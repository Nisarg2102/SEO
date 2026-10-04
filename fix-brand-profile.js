const fs = require('fs');

// 1. Update Schema
const schemaPath = 'packages/database/prisma/schema.prisma';
let schema = fs.readFileSync(schemaPath, 'utf8');
schema = schema.replace(/model BrandProfile \{[\s\S]*?@@map\("brand_profiles"\)\n\}/, `model BrandProfile {
  id              String    @id @default(uuid()) @db.Uuid
  workspaceId     String    @map("workspace_id") @db.Uuid
  businessName    String    @map("business_name")
  industry        String
  targetAudience  String    @map("target_audience")
  brandVoice      String?   @map("brand_voice")
  primaryKeywords String?   @map("primary_keywords")
  website         String?
  createdAt       DateTime  @default(now()) @map("created_at")
  updatedAt       DateTime  @updatedAt @map("updated_at")

  workspace       Workspace @relation(fields: [workspaceId], references: [id], onDelete: Cascade)

  @@index([workspaceId])
  @@map("brand_profiles")
}`);
fs.writeFileSync(schemaPath, schema);

// 2. Update DTO
const dtoPath = 'apps/api/src/brand-profiles/dto.ts';
fs.writeFileSync(dtoPath, `import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class UpsertBrandProfileDto {
  @IsString()
  @IsNotEmpty()
  businessName!: string;

  @IsString()
  @IsNotEmpty()
  industry!: string;

  @IsString()
  @IsNotEmpty()
  targetAudience!: string;

  @IsString()
  @IsOptional()
  brandVoice?: string;

  @IsString()
  @IsOptional()
  primaryKeywords?: string;

  @IsString()
  @IsOptional()
  website?: string;
}
`);

// 3. Update Social Studio Service
const socialPath = 'apps/api/src/social-studio/social-studio.service.ts';
let social = fs.readFileSync(socialPath, 'utf8');
social = social.replace(/Description: \$\{brandProfile\.description\}[\s\S]*?Language: \$\{brandProfile\.language\}/, 
`Industry: \${brandProfile.industry}
Target Audience: \${brandProfile.targetAudience}
Brand Voice: \${brandProfile.brandVoice || 'Professional'}
Primary Keywords: \${brandProfile.primaryKeywords || 'N/A'}`);
fs.writeFileSync(socialPath, social);

// 4. Update Social Studio Service Spec
const socialSpecPath = 'apps/api/src/social-studio/social-studio.service.spec.ts';
let socialSpec = fs.readFileSync(socialSpecPath, 'utf8');
socialSpec = socialSpec.replace(/description: 'Test Desc',[\s\S]*?language: 'en'/, 
`industry: 'Tech',
      targetAudience: 'Devs',
      brandVoice: 'Friendly',
      primaryKeywords: 'code'`);
fs.writeFileSync(socialSpecPath, socialSpec);

// 5. Update AI Agent Service
const agentPath = 'apps/api/src/ai-agent/ai-agent.service.ts';
let agent = fs.readFileSync(agentPath, 'utf8');
agent = agent.replace(/findUnique\(\{ where: \{ workspaceId \} \}\)/g, 'findFirst({ where: { workspaceId } })');
fs.writeFileSync(agentPath, agent);

console.log("Updated BrandProfile logic");
