const fs = require('fs');
const schemaPath = 'packages/database/prisma/schema.prisma';
let schema = fs.readFileSync(schemaPath, 'utf8');

const modelsToAdd = `
model AgentConversation {
  id          String   @id @default(uuid()) @db.Uuid
  workspaceId String   @map("workspace_id") @db.Uuid
  title       String?
  createdAt   DateTime @default(now()) @map("created_at")
  updatedAt   DateTime @updatedAt @map("updated_at")

  workspace   Workspace @relation(fields: [workspaceId], references: [id], onDelete: Cascade)
  messages    AgentMessage[]

  @@index([workspaceId])
  @@map("agent_conversations")
}

model AgentMessage {
  id             String   @id @default(uuid()) @db.Uuid
  conversationId String   @map("conversation_id") @db.Uuid
  role           String   // SYSTEM | USER | ASSISTANT | TOOL
  content        String   @db.Text
  toolCalls      Json?    @map("tool_calls")
  createdAt      DateTime @default(now()) @map("created_at")

  conversation   AgentConversation @relation(fields: [conversationId], references: [id], onDelete: Cascade)

  @@index([conversationId])
  @@map("agent_messages")
}
`;

if (!schema.includes('model AgentConversation')) {
  schema = schema + '\n' + modelsToAdd;
  
  // Also add to Workspace model
  schema = schema.replace(
    '  analyticsAccounts AnalyticsAccount[]',
    '  analyticsAccounts AnalyticsAccount[]\n  agentConversations AgentConversation[]'
  );
  
  fs.writeFileSync(schemaPath, schema);
  console.log('Added Agent models');
} else {
  console.log('Models already exist');
}
