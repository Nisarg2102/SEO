import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateWorkspaceDto, UpdateWorkspaceDto } from './dto';

@Injectable()
export class WorkspacesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: string, dto: CreateWorkspaceDto) {
    return (this.prisma as any).workspace.create({
      data: {
        name: dto.name,
        type: dto.type,
        members: {
          create: {
            userId,
            role: 'OWNER',
          },
        },
      },
    });
  }

  async findAllForUser(userId: string) {
    const members = await (this.prisma as any).workspaceMember.findMany({
      where: { userId },
      include: { workspace: true },
    });
    return members.map((m: any) => m.workspace);
  }

  async findOne(workspaceId: string) {
    const workspace = await (this.prisma as any).workspace.findUnique({
      where: { id: workspaceId },
    });
    if (!workspace) throw new NotFoundException();
    return workspace;
  }

  async update(workspaceId: string, dto: UpdateWorkspaceDto) {
    return (this.prisma as any).workspace.update({
      where: { id: workspaceId },
      data: dto,
    });
  }

  async getStats(workspaceId: string) {
    const scopedPrisma = this.prisma.withWorkspace(workspaceId);

    const [researchIdeas, draftContent, pendingApprovals, scheduledPosts] = await Promise.all([
      scopedPrisma.contentIdea.count({ where: { status: 'pending' } }),
      scopedPrisma.contentPack.count({ where: { status: 'draft' } }),
      scopedPrisma.contentPack.count({ where: { status: 'pending_approval' } }),
      scopedPrisma.contentPack.count({ where: { status: 'scheduled' } })
    ]);

    return {
      researchIdeas,
      draftContent,
      pendingApprovals,
      scheduledPosts
    };
  }
}
