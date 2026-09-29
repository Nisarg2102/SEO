import { PrismaService } from './prisma.service';

jest.mock('@prisma/client', () => ({
  PrismaClient: class {
    $connect() {}
    $disconnect() {}
  }
}));

describe('PrismaService Workspace Isolation', () => {
  let prisma: any;

  beforeEach(() => {
    // We create a fake PrismaClient instance and intercept $extends
    prisma = new PrismaService();
    prisma.$extends = jest.fn((extension: any) => {
      // Mock the extended client by providing a fake model that triggers the $allOperations hook
      return {
        brandProfile: {
          findFirst: async (args: any = {}) => {
            return extension.query.$allModels.$allOperations({
              model: 'BrandProfile',
              operation: 'findFirst',
              args,
              query: (finalArgs: any) => finalArgs,
            });
          },
          create: async (args: any = {}) => {
            return extension.query.$allModels.$allOperations({
              model: 'BrandProfile',
              operation: 'create',
              args,
              query: (finalArgs: any) => finalArgs,
            });
          },
        },
      };
    });
  });

  it('should automatically inject workspaceId into where clause for findFirst', async () => {
    const scopedPrisma = prisma.withWorkspace('workspace-123');
    
    // We call findFirst without specifying workspaceId
    const resultArgs = await scopedPrisma.brandProfile.findFirst({
      where: { businessName: 'Test' }
    });

    // The args passed to the underlying query should now include workspaceId
    expect(resultArgs.where).toEqual({
      businessName: 'Test',
      workspaceId: 'workspace-123'
    });
  });

  it('should automatically inject workspaceId if where clause is empty', async () => {
    const scopedPrisma = prisma.withWorkspace('workspace-123');
    
    const resultArgs = await scopedPrisma.brandProfile.findFirst();

    expect(resultArgs.where).toEqual({
      workspaceId: 'workspace-123'
    });
  });

  it('should automatically inject workspaceId on create data', async () => {
    const scopedPrisma = prisma.withWorkspace('workspace-123');
    
    const resultArgs = await scopedPrisma.brandProfile.create({
      data: { businessName: 'Test' }
    });

    expect(resultArgs.data).toEqual({
      businessName: 'Test',
      workspaceId: 'workspace-123'
    });
  });
});
