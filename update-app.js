const fs = require('fs');
let app = fs.readFileSync('apps/api/src/app.module.ts', 'utf8');

if (!app.includes('AutomationsModule')) {
  app = app.replace(
    "import { AgentModule } from './agent/agent.module';",
    "import { AgentModule } from './agent/agent.module';\nimport { AutomationsModule } from './automations/automations.module';"
  );
  
  app = app.replace(
    'AgentModule,',
    'AgentModule,\n    AutomationsModule,'
  );
  fs.writeFileSync('apps/api/src/app.module.ts', app);
  console.log('AppModule updated');
}
