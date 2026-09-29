import { WorkspaceGuard } from './workspace.guard';
import { PrismaService } from '../prisma/prisma.service';
import { ExecutionContext, ForbiddenException } from '@nestjs/common';

jest.mock('@prisma/client', () => ({
  PrismaClient: class {}
}));

const mockPrismaService = {
  workspaceMember: {
    findUnique: jest.fn(),
  },
} as any as PrismaService;

describe('WorkspaceGuard', () => {
  let guard: WorkspaceGuard;

  beforeEach(() => {
    guard = new WorkspaceGuard(mockPrismaService);
    jest.clearAllMocks();
  });

  const createMockContext = (user: any, workspaceId: string): ExecutionContext => {
    const req: any = {
      user,
      params: { workspaceId },
      query: {},
    };
    return {
      switchToHttp: () => ({
        getRequest: () => req,
      }),
    } as any;
  };

  it('should allow authorized workspace access', async () => {
    const context = createMockContext({ userId: 'user-1' }, 'workspace-1');
    
    (mockPrismaService.workspaceMember.findUnique as jest.Mock).mockResolvedValue({
      workspaceId: 'workspace-1',
      userId: 'user-1',
      role: 'OWNER',
    });

    const result = await guard.canActivate(context);
    expect(result).toBe(true);
    expect(context.switchToHttp().getRequest().workspaceRole).toBe('OWNER');
  });

  it('should throw ForbiddenException for unauthorized workspace access', async () => {
    const context = createMockContext({ userId: 'user-1' }, 'workspace-1');
    
    (mockPrismaService.workspaceMember.findUnique as jest.Mock).mockResolvedValue(null);

    await expect(guard.canActivate(context)).rejects.toThrow(ForbiddenException);
  });

  it('should throw ForbiddenException if user or workspaceId is missing', async () => {
    const context = createMockContext(null, 'workspace-1');
    await expect(guard.canActivate(context)).rejects.toThrow(ForbiddenException);
  });
});
