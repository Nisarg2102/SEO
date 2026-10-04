const fs = require('fs');

// 1. types
let apiTypes = fs.readFileSync('apps/web/src/types/api.ts', 'utf8');
apiTypes += `
export interface IntegrationStatus {
  serverConfigured: boolean;
  connected: boolean;
  propertyUrl?: string;
}

export interface WorkspaceIntegrations {
  gsc: IntegrationStatus;
  postiz: IntegrationStatus;
}
`;
fs.writeFileSync('apps/web/src/types/api.ts', apiTypes);

// 2. workspaces.ts
let workspacesTs = fs.readFileSync('apps/web/src/services/workspaces.ts', 'utf8');
workspacesTs = workspacesTs.replace(/UpsertBrandProfilePayload,\n\} from '@\/types\/api';/, `UpsertBrandProfilePayload,\n  WorkspaceIntegrations,\n} from '@/types/api';`);
workspacesTs = workspacesTs.replace(/}\n$/, `
  getIntegrations(workspaceId: string) {
    return apiClient.get<WorkspaceIntegrations>(\`/workspaces/\${workspaceId}/integrations\`);
  },

  togglePostiz(workspaceId: string, connect: boolean) {
    return apiClient.post(\`/workspaces/\${workspaceId}/integrations/postiz\`, { connect });
  },
};
`);
fs.writeFileSync('apps/web/src/services/workspaces.ts', workspacesTs);

console.log('Patched frontend services');
