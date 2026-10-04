import { Test, TestingModule } from '@nestjs/testing';
import { InstagramService } from './instagram.service';
import { PrismaService } from '../prisma/prisma.service';
import { AiService } from '../ai/ai.service';

describe('InstagramService', () => {
  let service: InstagramService;
  let prisma: PrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        InstagramService,
        {
          provide: PrismaService,
          useValue: {
            withWorkspace: jest.fn().mockReturnThis(),
            integration: {
              upsert: jest.fn(),
              findUnique: jest.fn(),
              deleteMany: jest.fn()
            },
            socialContent: {
              upsert: jest.fn(),
              findMany: jest.fn()
            },
            socialContentMetric: {
              create: jest.fn()
            },
            socialAccountMetric: {
              create: jest.fn(),
              findMany: jest.fn()
            }
          }
        },
        {
          provide: AiService,
          useValue: {
            generateStructuredOutput: jest.fn()
          }
        }
      ],
    }).compile();

    service = module.get<InstagramService>(InstagramService);
    prisma = module.get<PrismaService>(PrismaService);
    
    // Clear env vars
    delete process.env.META_APP_ID;
    delete process.env.META_CALLBACK_URL;
    delete process.env.META_LOGIN_CONFIG_ID;
  });

  describe('getAuthUrl', () => {
    it('should throw error if config is missing', () => {
      expect(() => service.getAuthUrl('workspace-1')).toThrow('Meta API or Login Config ID not configured');
    });

    it('should generate OAuth URL with config_id and no explicit scope', () => {
      process.env.META_APP_ID = 'test_app_id';
      process.env.META_CALLBACK_URL = 'https://example.com/callback';
      process.env.META_LOGIN_CONFIG_ID = 'test_config_id';

      const url = service.getAuthUrl('workspace-1');
      expect(url).toContain('client_id=test_app_id');
      expect(url).toContain('redirect_uri=https%3A%2F%2Fexample.com%2Fcallback');
      expect(url).toContain('config_id=test_config_id');
      expect(url).toContain('state=workspace-1');
      // Should not contain the legacy scope parameter
      expect(url).not.toContain('scope=');
      expect(url).not.toContain('instagram_basic');
    });
  });

  describe('handleCallback', () => {
    it('should upsert integration using workspace isolation', async () => {
      // For tests where NODE_ENV=test (which it is), the service mocks the flow.
      await service.handleCallback('code', 'workspace-1');
      
      expect(prisma.withWorkspace).toHaveBeenCalledWith('workspace-1');
      expect((prisma as any).integration.upsert).toHaveBeenCalledWith(expect.objectContaining({
        where: { workspaceId_provider: { workspaceId: 'workspace-1', provider: 'instagram' } }
      }));
    });
  });
});
