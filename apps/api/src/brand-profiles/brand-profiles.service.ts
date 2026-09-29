import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpsertBrandProfileDto } from './dto';

@Injectable()
export class BrandProfilesService {
  constructor(private readonly prisma: PrismaService) {}

  async getProfile(workspaceId: string) {
    const profile = await this.prisma.withWorkspace(workspaceId).brandProfile.findFirst();
    if (!profile) throw new NotFoundException('Brand profile not found');
    return profile;
  }

  async upsertProfile(workspaceId: string, dto: UpsertBrandProfileDto) {
    // using findFirst because there should be only one per workspace
    const existing = await this.prisma.withWorkspace(workspaceId).brandProfile.findFirst();

    if (existing) {
      return this.prisma.withWorkspace(workspaceId).brandProfile.update({
        where: { id: existing.id },
        data: dto,
      });
    }

    return this.prisma.withWorkspace(workspaceId).brandProfile.create({
      data: dto as any, // workspaceId is auto-injected by withWorkspace
    });
  }
}
