const fs = require('fs');

// 1. Service
let svc = fs.readFileSync('apps/api/src/workspaces/workspaces.service.ts', 'utf8');
svc = svc.replace(/}\n$/, `
  async getIntegrations(workspaceId: string) {
    const integrations = await (this.prisma as any).integration.findMany({
      where: { workspaceId }
    });

    const gsc = integrations.find((i: any) => i.provider === 'google_search_console');
    const postiz = integrations.find((i: any) => i.provider === 'postiz');

    let gscPropertyUrl = null;
    if (gsc?.config) {
      try { gscPropertyUrl = JSON.parse(gsc.config).propertyUrl; } catch {}
    }

    return {
      gsc: {
        serverConfigured: !!process.env.GOOGLE_CLIENT_ID,
        connected: !!gsc,
        propertyUrl: gscPropertyUrl,
      },
      postiz: {
        serverConfigured: !!process.env.POSTIZ_API_KEY,
        connected: !!postiz,
      }
    };
  }

  async togglePostiz(workspaceId: string, connect: boolean) {
    if (connect) {
      if (!process.env.POSTIZ_API_KEY) throw new Error('Server not configured for Postiz');
      await (this.prisma as any).integration.upsert({
        where: { workspaceId_provider: { workspaceId, provider: 'postiz' } },
        update: {},
        create: { workspaceId, provider: 'postiz' }
      });
    } else {
      await (this.prisma as any).integration.deleteMany({
        where: { workspaceId, provider: 'postiz' }
      });
    }
    return { success: true };
  }
}
`);
fs.writeFileSync('apps/api/src/workspaces/workspaces.service.ts', svc);

// 2. Controller
let ctrl = fs.readFileSync('apps/api/src/workspaces/workspaces.controller.ts', 'utf8');
ctrl = ctrl.replace(/}\n$/, `
  @UseGuards(WorkspaceGuard)
  @Get(':workspaceId/integrations')
  getIntegrations(@Param('workspaceId') id: string) {
    return this.workspacesService.getIntegrations(id);
  }

  @UseGuards(WorkspaceGuard)
  @Post(':workspaceId/integrations/postiz')
  togglePostiz(@Param('workspaceId') id: string, @Body('connect') connect: boolean) {
    return this.workspacesService.togglePostiz(id, connect);
  }
}
`);
fs.writeFileSync('apps/api/src/workspaces/workspaces.controller.ts', ctrl);

console.log('Patched Workspaces API');
