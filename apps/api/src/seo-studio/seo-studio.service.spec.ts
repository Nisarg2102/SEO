import { Test, TestingModule } from '@nestjs/testing';
import { SeoStudioService, ContentBriefOutput } from './seo-studio.service';
import { PrismaService } from '../prisma/prisma.service';
import { AiService } from '../ai/ai.service';

const mockPrisma = {
  workspace: { findUnique: jest.fn().mockResolvedValue({ id: 'ws-1', type: 'marketing' }) },
  seoAudit: { findFirst: jest.fn().mockResolvedValue(null) },
  seoAuditPage: { findMany: jest.fn().mockResolvedValue([]) },
  seoContentBrief: {
    create: jest.fn().mockImplementation((args) => Promise.resolve({ id: 'brief-1', ...args.data })),
    findFirst: jest.fn(),
    findMany: jest.fn(),
  },
  seoContentDraft: {
    create: jest.fn().mockImplementation((args) => Promise.resolve({ id: 'draft-1', ...args.data })),
    findFirst: jest.fn(),
    findMany: jest.fn(),
  }
};

const mockAiService = {
  generateStructuredOutput: jest.fn(),
  generateText: jest.fn(),
};

describe('SeoStudioService', () => {
  let service: SeoStudioService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SeoStudioService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: AiService, useValue: mockAiService },
      ],
    }).compile();

    service = module.get<SeoStudioService>(SeoStudioService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('generates a brief securely', async () => {
    const mockBriefOutput: ContentBriefOutput = {
      topic: 'Test Topic',
      primaryKeyword: 'test kw',
      secondaryKeywords: [],
      searchIntent: { intent: 'informational', confidence: 'high', reason: '' },
      audience: 'Everyone',
      contentType: 'Blog',
      titleOptions: ['Test'],
      recommendedOutline: [{ level: 2, heading: 'Intro', purpose: '', topicsToCover: [] }],
      questionsToAnswer: [],
      relatedTopics: [],
      internalLinkOpportunities: [],
      technicalRequirements: [],
      metadata: { title: 'Test', description: 'Test', slug: 'test' },
      contentGuidance: { tone: 'Friendly', style: 'Pro', importantPoints: [], thingsToAvoid: [] }
    };

    mockAiService.generateStructuredOutput.mockResolvedValueOnce(mockBriefOutput);

    const result = await service.generateBrief('ws-1', {
      primaryKeyword: 'test kw'
    });

    expect(result.id).toBe('brief-1');
    expect(mockAiService.generateStructuredOutput).toHaveBeenCalled();
  });

  it('adds medical safety rules for psychiatric workspaces', async () => {
    mockPrisma.workspace.findUnique.mockResolvedValueOnce({ id: 'ws-med', type: 'psychiatrist' });
    mockAiService.generateStructuredOutput.mockResolvedValueOnce({});
    
    await service.generateBrief('ws-med', { primaryKeyword: 'anxiety' });
    
    const callArgs = mockAiService.generateStructuredOutput.mock.calls[0][0];
    expect(callArgs).toContain('MEDICAL SAFETY RULES MUST BE FOLLOWED');
    expect(callArgs).toContain('Do not diagnose conditions');
  });

  it('generates a draft from an approved brief', async () => {
    mockPrisma.seoContentBrief.findFirst.mockResolvedValueOnce({
      id: 'brief-1',
      briefData: { topic: 'test', primaryKeyword: 'kw' }
    });
    mockAiService.generateStructuredOutput.mockResolvedValueOnce({
      title: 'Generated Title',
      content: '# Generated Title\\n\\nSome body content.',
      metadata: { title: 'Meta', description: 'Desc' }
    });

    const result = await service.generateDraft('ws-1', 'brief-1');
    expect(result.title).toBe('Generated Title');
    expect(result.version).toBe(1);
    expect(result.status).toBe('draft');
  });

  it('regenerates a section securely', async () => {
    mockPrisma.seoContentDraft.findFirst.mockResolvedValueOnce({
      id: 'draft-1',
      briefId: 'brief-1',
      content: '# Hello\\nSome intro text.',
    });
    mockPrisma.seoContentBrief.findFirst.mockResolvedValueOnce({ id: 'brief-1' });
    mockAiService.generateText.mockResolvedValueOnce('New rewritten intro.');

    const result = await service.regenerateSection('ws-1', 'draft-1', 'Intro', 'Make it shorter');
    
    expect(result.newSectionContent).toBe('New rewritten intro.');
    const callArgs = mockAiService.generateText.mock.calls[0][0];
    expect(callArgs).toContain('untrusted data'); // Prompt injection protection
  });
});
