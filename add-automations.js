const fs = require('fs');
const schemaPath = 'packages/database/prisma/schema.prisma';
let schema = fs.readFileSync(schemaPath, 'utf8');

const modelsToAdd = `
model Automation {
  id          String   @id @default(uuid()) @db.Uuid
  workspaceId String   @map("workspace_id") @db.Uuid
  name        String
  type        String
  enabled     Boolean  @default(false)
  schedule    String?
  config      Json?
  createdAt   DateTime @default(now()) @map("created_at")
  updatedAt   DateTime @updatedAt @map("updated_at")

  workspace   Workspace @relation(fields: [workspaceId], references: [id], onDelete: Cascade)
  runs        AutomationRun[]

  @@index([workspaceId])
  @@map("automations")
}

model AutomationRun {
  id           String    @id @default(uuid()) @db.Uuid
  automationId String    @map("automation_id") @db.Uuid
  workspaceId  String    @map("workspace_id") @db.Uuid
  status       String
  startedAt    DateTime? @map("started_at")
  completedAt  DateTime? @map("completed_at")
  error        String?   @db.Text
  metadata     Json?
  createdAt    DateTime  @default(now()) @map("created_at")

  automation   Automation @relation(fields: [automationId], references: [id], onDelete: Cascade)

  @@index([automationId])
  @@index([workspaceId])
  @@map("automation_runs")
}
`;

if (!schema.includes('model Automation')) {
  schema = schema + '\n' + modelsToAdd;
  
  // Also add to Workspace model
  schema = schema.replace(
    '  agentConversations AgentConversation[]',
    '  agentConversations AgentConversation[]\n  automations        Automation[]'
  );
  
  fs.writeFileSync(schemaPath, schema);
  console.log('Added Automation models');
} else {
  console.log('Models already exist');
}
