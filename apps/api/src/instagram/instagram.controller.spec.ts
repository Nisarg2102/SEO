import { Test, TestingModule } from '@nestjs/testing';
import { InstagramController, InstagramPublicController } from './instagram.controller';
import { InstagramService } from './instagram.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { WorkspaceGuard } from '../auth/workspace.guard';
import { ExecutionContext } from '@nestjs/common';

describe('InstagramPublicController', () => {
  let controller: InstagramPublicController;
  let service: InstagramService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [InstagramPublicController],
      providers: [
        {
          provide: InstagramService,
          useValue: {
            handleCallback: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<InstagramPublicController>(InstagramPublicController);
    service = module.get<InstagramService>(InstagramService);
  });

  describe('callback', () => {
    it('should redirect to root with error if state is invalid UUID', async () => {
      const res = { redirect: jest.fn() };
      await controller.callback('valid_code', 'invalid_state_uuid', res);
      expect(res.redirect).toHaveBeenCalledWith('http://localhost:3000?error=invalid_state');
    });

    it('should redirect to settings with error if code is missing', async () => {
      const res = { redirect: jest.fn() };
      const validUuid = '123e4567-e89b-42d3-a456-426614174000';
      await controller.callback(undefined as any, validUuid, res);
      expect(res.redirect).toHaveBeenCalledWith(`http://localhost:3000/workspaces/${validUuid}/settings?error=invalid_code`);
    });

    it('should call handleCallback and redirect on success', async () => {
      const res = { redirect: jest.fn() };
      const validUuid = '123e4567-e89b-42d3-a456-426614174000';
      (service.handleCallback as jest.Mock).mockResolvedValue(undefined);
      await controller.callback('valid_code', validUuid, res);
      expect(service.handleCallback).toHaveBeenCalledWith('valid_code', validUuid);
      expect(res.redirect).toHaveBeenCalledWith(`http://localhost:3000/workspaces/${validUuid}/settings?instagram=success`);
    });

    it('should redirect to settings with error if token failure occurs', async () => {
      const res = { redirect: jest.fn() };
      const validUuid = '123e4567-e89b-42d3-a456-426614174000';
      (service.handleCallback as jest.Mock).mockRejectedValue(new Error('Token exchange failed'));
      await controller.callback('valid_code', validUuid, res);
      expect(res.redirect).toHaveBeenCalledWith(`http://localhost:3000/workspaces/${validUuid}/settings?error=callback_failed`);
    });
  });
});

describe('InstagramController', () => {
  let controller: InstagramController;
  let service: InstagramService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [InstagramController],
      providers: [
        {
          provide: InstagramService,
          useValue: {
            getAuthUrl: jest.fn(),
          },
        },
      ],
    })
    .overrideGuard(JwtAuthGuard).useValue({ canActivate: () => true })
    .overrideGuard(WorkspaceGuard).useValue({ canActivate: () => true })
    .compile();

    controller = module.get<InstagramController>(InstagramController);
    service = module.get<InstagramService>(InstagramService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should return auth url', () => {
    (service.getAuthUrl as jest.Mock).mockReturnValue('https://example.com/oauth');
    const result = controller.getAuthUrl('workspace-1');
    expect(result).toEqual({ url: 'https://example.com/oauth' });
    expect(service.getAuthUrl).toHaveBeenCalledWith('workspace-1');
  });
});
