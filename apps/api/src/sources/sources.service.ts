import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateSourceDto, UpdateSourceDto } from './dto';

@Injectable()
export class SourcesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(workspaceId: string, dto: CreateSourceDto) {
    // Normalize URL to prevent near-duplicate sources
    const normalizedUrl = dto.url.replace(/\/$/, '').toLowerCase();

    const existing = await (this.prisma as any).source.findFirst({
      where: { workspaceId, url: normalizedUrl },
    });
    if (existing) {
      throw new ConflictException(`A source with this URL already exists: ${normalizedUrl}`);
    }

    return (this.prisma as any).source.create({
      data: { ...dto, url: normalizedUrl, workspaceId },
    });
  }

  async findAll(workspaceId: string) {
    return (this.prisma as any).source.findMany({
      where: { workspaceId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(workspaceId: string, id: string) {
    const source = await (this.prisma as any).source.findFirst({
      where: { id, workspaceId },
    });
    if (!source) throw new NotFoundException('Source not found');
    return source;
  }

  async update(workspaceId: string, id: string, dto: UpdateSourceDto) {
    // Verify ownership before updating
    await this.findOne(workspaceId, id);

    const data: Record<string, unknown> = { ...dto };
    if (dto.url) {
      data.url = dto.url.replace(/\/$/, '').toLowerCase();
    }

    return (this.prisma as any).source.update({
      where: { id },
      data,
    });
  }

  async remove(workspaceId: string, id: string) {
    // Verify ownership before deleting
    await this.findOne(workspaceId, id);
    return (this.prisma as any).source.delete({ where: { id } });
  }
}
