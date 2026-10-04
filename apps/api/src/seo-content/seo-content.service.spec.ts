import { Test, TestingModule } from '@nestjs/testing';
import { SeoContentService, SeoAnalysisOutput } from './seo-content.service';
import { PrismaService } from '../prisma/prisma.service';
import { AiService } from '../ai/ai.service';
import { GscService } from '../gsc/gsc.service';

const mockPrisma = {
  seoAudit: { findFirst: jest.fn() },
  seoAuditPage: { findFirst: jest.fn() },
  seoAuditIssue: { findMany: jest.fn() },
  seoLink: { count: jest.fn() },
  seoContentAnalysis: {
    create: jest.fn().mockImplementation((args) => Promise.resolve({ id: 'test-id', ...args.data })),
    findMany: jest.fn().mockResolvedValue([]),
    findFirst: jest.fn(),
  },
};

const mockAiService = {
  generateStructuredOutput: jest.fn(),
};

const mockGscService = {};

// Mock fetch globally for the SSRF validation and page downloading


jest.mock('@ai-marketing/seo', () => ({
  validateUrl: jest.fn().mockImplementation((url: string) => Promise.resolve(new URL(url))),
}));

jest.mock('@ai-marketing/shared', () => ({
  safeFetch: jest.fn(),
}));

describe('SeoContentService', () => {
  let service: SeoContentService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SeoContentService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: AiService, useValue: mockAiService },
        { provide: GscService, useValue: mockGscService },
      ],
    }).compile();

    service = module.get<SeoContentService>(SeoContentService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('analyzes a page securely and calls AI', async () => {
    const mockHtml = `
      <html>
        <head>
          <title>Test Page</title>
          <meta name="description" content="Test description" />
        </head>
        <body>
          <h1>Hello World</h1>
          <p>This is a test page content.</p>
        </body>
      </html>
    `;

    (require('@ai-marketing/shared').safeFetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      status: 200,
      text: async () => mockHtml,
    });

    const mockAiResponse: SeoAnalysisOutput = {
      summary: 'Test summary',
      keywordAnalysis: {
        primaryKeyword: 'test',
        usage: 'Good',
        placement: 'Title',
        relatedTerms: [],
      },
      title: { current: 'Test Page', recommended: 'Test Page Updated', reason: 'Better' },
      metaDescription: { current: 'Test description', recommended: 'Updated', reason: 'Better' },
      headings: { issues: [], recommendations: [] },
      content: { strengths: [], weaknesses: [], missingTopics: [], recommendations: [] },
      internalLinks: { recommendations: [] },
      technical: { issues: [], recommendations: [] },
      searchIntent: { detected: 'informational', confidence: 'high', reason: 'Because' },
      priorityActions: [],
    };

    mockAiService.generateStructuredOutput.mockResolvedValueOnce(mockAiResponse);
    mockPrisma.seoAudit.findFirst.mockResolvedValueOnce(null);

    const result = await service.analyze('ws-1', {
      url: 'https://example.com/test',
      primaryKeyword: 'test'
    });

    expect(require('@ai-marketing/shared').safeFetch).toHaveBeenCalledWith('https://example.com/test', expect.any(Object));
    expect(mockAiService.generateStructuredOutput).toHaveBeenCalled();
    expect(result.id).toBe('test-id');
    expect(result.url).toBe('https://example.com/test');
    expect((result.sourceSnapshot as any).title).toBe('Test Page');
    expect((result.sourceSnapshot as any).metaDesc).toBe('Test description');
    expect((result.sourceSnapshot as any).h1).toBe('Hello World');
  });

  it('throws error on bad HTTP status', async () => {
    (require('@ai-marketing/shared').safeFetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      status: 404,
    });

    await expect(service.analyze('ws-1', { url: 'https://example.com/404', primaryKeyword: 'test' }))
      .rejects.toThrow('Page returned status 404');
  });
});
