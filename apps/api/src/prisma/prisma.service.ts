import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient, Prisma } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }

  /**
   * Returns a Prisma Client extension that automatically injects the `workspaceId`
   * into every query for models that are scoped by workspace.
   * This guarantees strict multi-tenant isolation.
   */
  withWorkspace(workspaceId: string) {
    return this.$extends({
      query: {
        $allModels: {
          async $allOperations({ model, operation, args, query }) {
            // Models that strictly belong to a workspace
            const workspaceModels = [
              'BrandProfile',
              'Source',
              'ResearchItem',
              'ContentIdea',
              'ContentPack',
              'WorkspaceMember'
            ];

            if (workspaceModels.includes(model as string)) {
              // @ts-ignore
              if (args.where) {
                // @ts-ignore
                args.where.workspaceId = workspaceId;
              } else {
                // @ts-ignore
                args.where = { workspaceId };
              }
              
              if (operation === 'create' && (args as any).data) {
                // @ts-ignore
                args.data.workspaceId = workspaceId;
              }
              
              if (operation === 'createMany' && Array.isArray((args as any).data)) {
                // @ts-ignore
                args.data = args.data.map(d => ({ ...d, workspaceId }));
              }
            }
            return query(args);
          },
        },
      },
    });
  }
}
