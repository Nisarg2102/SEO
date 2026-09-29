import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class WorkspaceGuard implements CanActivate {
  constructor(private prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    
    // Assumes workspaceId is passed as a route param or query param
    const workspaceId = request.params.workspaceId || request.query.workspaceId;

    if (!user || !workspaceId) {
      throw new ForbiddenException('User or workspace not identified');
    }

    const membership = await (this.prisma as any).workspaceMember.findUnique({
      where: {
        workspaceId_userId: {
          workspaceId: workspaceId,
          userId: user.userId,
        },
      },
    });

    if (!membership) {
      throw new ForbiddenException('You do not have access to this workspace');
    }

    // Attach role to request for potential role-based guards later
    request.workspaceRole = membership.role;
    
    return true;
  }
}
