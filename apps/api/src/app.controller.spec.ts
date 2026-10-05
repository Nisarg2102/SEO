import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AiService } from './ai/ai.service';

describe('AppController', () => {
  let appController: AppController;
  let appService: AppService;

  beforeEach(async () => {
    const mockAiService = {
      checkHealth: jest.fn().mockResolvedValue({ provider: 'mock', available: true })
    };

    const app: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [
        AppService,
        { provide: AiService, useValue: mockAiService }
      ],
    }).compile();

    appController = app.get<AppController>(AppController);
    appService = app.get<AppService>(AppService);
  });

  describe('root', () => {
    it('should return health status', async () => {
      jest.spyOn(appService, 'checkDatabaseConnection').mockResolvedValue('connected');
      
      expect(await appController.getHealth()).toEqual({
        status: 'ok',
        service: 'api',
        database: 'connected'
      });
    });
  });
});
