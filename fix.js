const fs = require('fs');
const file = 'apps/web/src/app/workspaces/[workspaceId]/automations/page.tsx';
let data = fs.readFileSync(file, 'utf8');

data = data.replace(
  '<code>{"workspaceId": "${params.workspaceId}", "type": "workflow-type"}</code>',
  '<code>{`{"workspaceId": "${params.workspaceId}", "type": "workflow-type"}`}</code>'
);

fs.writeFileSync(file, data);
