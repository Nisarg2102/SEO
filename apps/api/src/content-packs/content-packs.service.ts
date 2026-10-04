import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AiService } from '../ai/ai.service';

import { GenerateContentPackDto, UpdateContentPackDto } from './dto';
import { z } from 'zod';

const ContentPackSchema = z.object({
  topic: z.string().describe('The main topic of the content'),
  objective: z.string().describe('What this content aims to achieve'),
  audience: z.string().describe('The target audience'),
  intent: z.string().describe('The intent of the content (e.g. educational, promotional)'),
  hook: z.string().describe('A catchy hook to grab attention'),
  caption: z.string().describe('The main body text or caption'),
  script: z.string().optional().describe('Video/Audio script if applicable to the platform'),
  visualDirection: z.string().describe('Instructions for the visual or image/video component'),
  cta: z.string().describe('Call to action'),
  hashtags: z.string().describe('Space or comma separated hashtags'),
  seoTitle: z.string().describe('SEO optimized title'),
  metaDescription: z.string().describe('SEO meta description'),
  primaryKeyword: z.string().describe('The main keyword to target'),
  secondaryKeywords: z.string().describe('Other keywords to target'),
  complianceNotes: z.string().optional().describe('Any legal or compliance notes to keep in mind'),
});

// Medical-specific schema — compliance notes and clinical sources are REQUIRED, not optional
const MedicalContentPackSchema = z.object({
  topic: z.string().describe('The main educational topic'),
  objective: z.string().describe('The educational objective — must relate to awareness, literacy, stigma reduction, or caregiver support'),
  audience: z.string().describe('The target audience'),
  intent: z.string().describe('The intent — must be educational'),
  hook: z.string().describe('An empathetic, non-sensational hook'),
  caption: z.string().describe('The body text. Must be general education only. No diagnoses, no treatment claims, no recovery guarantees.'),
  script: z.string().optional().describe('Video/Audio script if applicable'),
  visualDirection: z.string().describe('Visual direction — must be non-stigmatising and empathetic'),
  cta: z.string().describe('Call to action — e.g. "Speak to a mental health professional" or "Learn more at WHO.int"'),
  hashtags: z.string().describe('Relevant hashtags — no patient identifiers'),
  seoTitle: z.string().describe('SEO title — no diagnostic or superiority claims'),
  metaDescription: z.string().describe('SEO meta description'),
  primaryKeyword: z.string().describe('Primary keyword — general and educational'),
  secondaryKeywords: z.string().describe('Secondary keywords'),
  complianceNotes: z.string().describe('REQUIRED. List all clinical sources cited. State clearly: "This content is for educational purposes only and does not constitute medical advice." Note any limitations or caveats.'),
});

@Injectable()
export class ContentPacksService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly aiService: AiService
  ) {}

  async generate(workspaceId: string, dto: GenerateContentPackDto) {
    const workspace = await (this.prisma as any).workspace.findUnique({ where: { id: workspaceId } });

    const isMedical = workspace?.type === 'MEDICAL';

    let prompt = `Create a complete content pack for the platform: ${dto.platform}. 
    Topic: ${dto.topic}. 
    Target Audience: ${dto.audience}. 
    Make it highly engaging, optimized for the platform, and professional.`;

    if (isMedical) {
      prompt = `Create a mental health educational content pack for the platform: ${dto.platform}.
      Topic: ${dto.topic}.
      Target Audience: ${dto.audience}.

      CRITICAL MEDICAL CONTENT RULES — you MUST follow all of these:
      - Focus ONLY on: general education, mental-health awareness, myths and facts, help-seeking, caregiver education, treatment literacy, stigma reduction.
      - Do NOT generate: diagnoses, individualized treatment recommendations, guarantees of recovery, comparative superiority claims ("best psychiatrist"), patient outcome claims, or public speculation about any identifiable person's mental health.
      - Cite credible sources (WHO, medical journals, national mental health associations) for any clinical claim.
      - The complianceNotes field is REQUIRED. State "This content is for educational purposes only and does not constitute medical advice." List sources used.`;
    }

    const generated = await this.aiService.generateStructuredOutput(
      prompt,
      isMedical ? MedicalContentPackSchema : ContentPackSchema,
      isMedical ? 'MedicalContentPack' : 'ContentPack'
    );

    return this.prisma.withWorkspace(workspaceId).contentPack.create({
      data: {
        workspaceId,
        platform: dto.platform,
        status: isMedical ? 'CLINICAL_REVIEW_REQUIRED' : 'DRAFT',
        ...generated
      }
    });
  }

  async findAll(workspaceId: string) {
    return this.prisma.withWorkspace(workspaceId).contentPack.findMany({
      orderBy: { createdAt: 'desc' }
    });
  }

  async findOne(workspaceId: string, id: string) {
    const pack = await this.prisma.withWorkspace(workspaceId).contentPack.findUnique({
      where: { id }
    });
    if (!pack) throw new NotFoundException('Content pack not found');
    return pack;
  }

  async update(workspaceId: string, id: string, dto: UpdateContentPackDto) {
    const existing = await this.prisma.withWorkspace(workspaceId).contentPack.findUnique({
      where: { id }
    });
    if (!existing) throw new NotFoundException('Content pack not found');

    const workspace = await (this.prisma as any).workspace.findUnique({ where: { id: workspaceId } });

    if (workspace.type === 'MEDICAL') {
      if (dto.status === 'APPROVED' && existing.status !== 'PROFESSIONALLY_REVIEWED' && dto.status !== existing.status) {
        throw new Error('Medical content must be PROFESSIONALLY_REVIEWED before it can be APPROVED.');
      }
      if (dto.status === 'PROFESSIONALLY_REVIEWED' && existing.status !== 'CLINICAL_REVIEW_REQUIRED' && dto.status !== existing.status) {
        throw new Error('Medical content must go through CLINICAL_REVIEW_REQUIRED first.');
      }
    }

    if (dto.status === 'SCHEDULED' && existing.status !== 'APPROVED' && dto.status !== existing.status) {
      throw new Error('Only approved content can move to SCHEDULED status.');
    }

    const data: any = { ...dto };
    if (dto.scheduledAt) {
      data.scheduledAt = new Date(dto.scheduledAt);
    }

    let externalPostId = existing.externalPostId;

    // The social publishing integration (Postiz) was removed.
    // If the content is scheduled, we just save the status.

    return this.prisma.contentPack.update({
      where: { id },
      data
    });
  }

  async remove(workspaceId: string, id: string) {
    return this.prisma.contentPack.delete({
      where: { id }
    });
  }
}