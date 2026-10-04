import { Test, TestingModule } from '@nestjs/testing';
import { ContentPacksService } from './content-packs.service';
import { PrismaService } from '../prisma/prisma.service';
import { AiService } from '../ai/ai.service';

import { GenerateContentPackDto } from './dto';

jest.mock('@prisma/client', () => ({
  PrismaClient: class {
    $connect() {}
    $disconnect() {}
  }
}));

// Create basic mock implementations
const mockPrismaService = {
  withWorkspace: jest.fn().mockReturnThis(),
  contentPack: {
    create: jest.fn(),
    findMany: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  workspace: {
    findUnique: jest.fn(),
  }
};

const mockAiService = {
  generateStructuredOutput: jest.fn(),
};

describe('ContentPacksService', () => {
  let service: ContentPacksService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ContentPacksService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: AiService, useValue: mockAiService },
      ],
    }).compile();

    service = module.get<ContentPacksService>(ContentPacksService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('generate', () => {
    it('should generate a content pack using the AI service and save it to the database', async () => {
      const workspaceId = 'workspace-123';
      const dto: GenerateContentPackDto = {
        topic: 'Coffee',
        platform: 'LinkedIn',
        audience: 'Professionals',
      };

      const aiMockResponse = {
        topic: 'Coffee',
        objective: 'Engage',
        audience: 'Professionals',
        intent: 'Educational',
        hook: 'Did you know?',
        caption: 'This is a caption.',
        visualDirection: 'Show coffee cup',
        cta: 'Click here',
        hashtags: '#coffee',
        seoTitle: 'Coffee SEO',
        metaDescription: 'Coffee meta',
        primaryKeyword: 'coffee',
        secondaryKeywords: 'espresso',
      };

      mockAiService.generateStructuredOutput.mockResolvedValueOnce(aiMockResponse);
      mockPrismaService.contentPack.create.mockResolvedValueOnce({
        id: 'pack-123',
        workspaceId,
        status: 'draft',
        platform: dto.platform,
        ...aiMockResponse,
      });

      const result = await service.generate(workspaceId, dto);

      // Verify AI was called
      expect(mockAiService.generateStructuredOutput).toHaveBeenCalled();
      
      // Verify DB save was called with the right data
      expect(mockPrismaService.withWorkspace).toHaveBeenCalledWith(workspaceId);
      expect(mockPrismaService.contentPack.create).toHaveBeenCalledWith({
        data: {
          platform: dto.platform,
          status: 'DRAFT',
          workspaceId,
          ...aiMockResponse,
        },
      });

      expect(result).toHaveProperty('id', 'pack-123');
      expect(result).toHaveProperty('status', 'draft');
    });
  });
});
