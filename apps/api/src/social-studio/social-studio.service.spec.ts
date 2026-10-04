import { Test, TestingModule } from '@nestjs/testing';
import { SocialStudioService } from './social-studio.service';
import { PrismaService } from '../prisma/prisma.service';
import { AiService } from '../ai/ai.service';
import { SocialService } from '../social/social.service';
import { BadRequestException, ForbiddenException } from '@nestjs/common';

const mockPrisma = {
  brandProfile: { findFirst: jest.fn() },
  workspace: { findUnique: jest.fn().mockResolvedValue({ id: 'ws-1', type: 'marketing' }) },
  seoContentDraft: { findFirst: jest.fn() },
  seoContentBrief: { findFirst: jest.fn() },
  socialPost: {
    create: jest.fn().mockImplementation((args) => Promise.resolve({ id: 'post-1', ...args.data })),
    findFirst: jest.fn(),
    findMany: jest.fn(),
    update: jest.fn().mockImplementation((args) => Promise.resolve({ ...args.data })),
  },
};

const mockAiService = {
  generateStructuredOutput: jest.fn(),
};

const mockSocialService = {
  schedulePost: jest.fn(),
};

describe('SocialStudioService', () => {
  let service: SocialStudioService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SocialStudioService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: AiService, useValue: mockAiService },
        { provide: SocialService, useValue: mockSocialService },
      ],
    }).compile();

    service = module.get<SocialStudioService>(SocialStudioService);
    jest.clearAllMocks();
  });

  it('generates multi-platform social posts safely', async () => {
    mockPrisma.seoContentDraft.findFirst.mockResolvedValueOnce({ id: 'draft-1', content: 'Test Content' });
    
    mockAiService.generateStructuredOutput.mockResolvedValueOnce({
      posts: [
        { platform: 'twitter', text: 'Short tweet', hashtags: [] },
        { platform: 'linkedin', text: 'Longer post', hashtags: [] }
      ]
    });

    const result = await service.generateSocialContent('ws-1', {
      sourceType: 'draft',
      sourceId: 'draft-1',
      platforms: ['twitter', 'linkedin'],
      objective: 'awareness',
      audience: 'devs',
      tone: 'casual'
    });

    expect(result.length).toBe(2);
    expect(mockAiService.generateStructuredOutput).toHaveBeenCalled();
    const promptStr = mockAiService.generateStructuredOutput.mock.calls[0][0];
    expect(promptStr).toContain('untrusted data'); // Prompt injection check
  });

  it('rejects twitter posts over 280 characters', async () => {
    mockPrisma.seoContentBrief.findFirst.mockResolvedValueOnce({ id: 'brief-1', briefData: {} });
    
    mockAiService.generateStructuredOutput.mockResolvedValueOnce({
      posts: [
        { platform: 'twitter', text: 'A'.repeat(281), hashtags: [] }
      ]
    });

    await expect(service.generateSocialContent('ws-1', {
      sourceType: 'brief',
      sourceId: 'brief-1',
      platforms: ['twitter'],
      objective: 'awareness',
      audience: 'devs',
      tone: 'casual'
    })).rejects.toThrow(BadRequestException);
  });

  it('applies medical safety rules for medical workspaces', async () => {
    mockPrisma.workspace.findUnique.mockResolvedValueOnce({ id: 'ws-med', type: 'medical' });
    mockAiService.generateStructuredOutput.mockResolvedValueOnce({ posts: [] });

    await service.generateSocialContent('ws-med', {
      sourceType: 'topic',
      topic: 'headaches',
      platforms: ['facebook'],
      objective: 'education',
      audience: 'patients',
      tone: 'professional'
    });

    const promptStr = mockAiService.generateStructuredOutput.mock.calls[0][0];
    expect(promptStr).toContain('MEDICAL SAFETY RULES');
    expect(promptStr).toContain('Do not diagnose');
  });

  it('prevents VIEWER from approving posts', async () => {

    await expect(service.approvePost('ws-1', 'post-1', 'VIEWER')).rejects.toThrow(ForbiddenException);
  });

  it('schedules an approved post to Postiz', async () => {
    mockPrisma.socialPost.findFirst.mockResolvedValueOnce({
      id: 'post-1',
      platform: 'linkedin',
      content: { text: 'Hello' },
      hashtags: ['test'],
      approvalStatus: 'approved'
    });
    
    mockSocialService.schedulePost.mockResolvedValueOnce('external-123');

    const result = await service.schedulePost('ws-1', 'post-1', new Date(), 'OWNER');
    expect(mockSocialService.schedulePost).toHaveBeenCalled();
    expect((result as any).status).toBe('scheduled');
    expect((result as any).externalPostId).toBe('external-123');
  });

  it('prevents scheduling of unapproved posts', async () => {
    mockPrisma.socialPost.findFirst.mockResolvedValueOnce({
      id: 'post-1',
      approvalStatus: 'pending'
    });

    await expect(service.schedulePost('ws-1', 'post-1', new Date(), 'OWNER')).rejects.toThrow(BadRequestException);
  });

  it('injects brand voice context if a BrandProfile exists', async () => {
    mockPrisma.workspace.findUnique.mockResolvedValueOnce({ id: 'ws-1', type: 'marketing' });
    mockPrisma.brandProfile.findFirst.mockResolvedValueOnce({
      workspaceId: 'ws-1',
      businessName: 'Acme Corp',
      description: 'We make widgets',
      tone: 'funny',
      language: 'English',
      services: 'Widget making'
    });
    mockAiService.generateStructuredOutput.mockResolvedValueOnce({ posts: [] });

    await service.generateSocialContent('ws-1', {
      sourceType: 'topic',
      topic: 'hello',
      platforms: ['facebook'],
      objective: 'awareness',
      audience: 'everyone',
      tone: 'funny'
    });

    const promptStr = mockAiService.generateStructuredOutput.mock.calls[0][0];
    expect(promptStr).toContain('BRAND VOICE CONTEXT');
    expect(promptStr).toContain('Acme Corp');
    expect(promptStr).toContain('funny');
  });

  it('prevents EDITOR from scheduling posts', async () => {
    
    await expect(service.schedulePost('ws-1', 'post-1', new Date(), 'EDITOR')).rejects.toThrow(ForbiddenException);
  });

  it('handles failed Postiz publish gracefully', async () => {
    mockPrisma.socialPost.findFirst.mockResolvedValueOnce({
      id: 'post-1',
      platform: 'linkedin',
      content: { text: 'Hello' },
      hashtags: [],
      approvalStatus: 'approved'
    });
    mockSocialService.schedulePost.mockRejectedValueOnce(new Error('Postiz API Error'));

    await expect(service.schedulePost('ws-1', 'post-1', new Date(), 'OWNER')).rejects.toThrow('Postiz API Error');
  });

});