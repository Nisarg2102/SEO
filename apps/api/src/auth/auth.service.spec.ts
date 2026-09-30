import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { PrismaService } from '../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { ConflictException, UnauthorizedException } from '@nestjs/common';
import * as bcryptjs from 'bcryptjs';

jest.mock('@prisma/client', () => ({
  PrismaClient: class {}
}));

const mockPrismaService = {
  user: {
    findUnique: jest.fn(),
    create: jest.fn(),
  },
};

const mockJwtService = {
  sign: jest.fn(() => 'test-jwt-token'),
};

describe('AuthService', () => {
  let authService: AuthService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: JwtService, useValue: mockJwtService },
      ],
    }).compile();

    authService = module.get<AuthService>(AuthService);
    jest.clearAllMocks();
  });

  describe('register', () => {
    it('should register a new user successfully', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);
      mockPrismaService.user.create.mockResolvedValue({
        id: 'user-1',
        email: 'test@test.com',
        name: 'Test',
        role: 'USER',
        passwordHash: 'hashed-password',
      });

      const result = await authService.register({
        email: 'test@test.com',
        name: 'Test',
        password: 'password123',
      });

      expect(result.accessToken).toEqual('test-jwt-token');
      expect(result.user.email).toEqual('test@test.com');
      expect(mockPrismaService.user.create).toHaveBeenCalled();
    });

    it('should throw ConflictException if email exists', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue({ id: 'user-1' });

      await expect(authService.register({
        email: 'test@test.com',
        name: 'Test',
        password: 'password123',
      })).rejects.toThrow(ConflictException);
    });
  });

  describe('login', () => {
    it('should login successfully', async () => {
      const passwordHash = await bcryptjs.hash('password123', 10);
      mockPrismaService.user.findUnique.mockResolvedValue({
        id: 'user-1',
        email: 'test@test.com',
        name: 'Test',
        role: 'USER',
        passwordHash,
      });

      const result = await authService.login({
        email: 'test@test.com',
        password: 'password123',
      });

      expect(result.accessToken).toEqual('test-jwt-token');
      expect(result.user.email).toEqual('test@test.com');
    });

    it('should throw UnauthorizedException on invalid password', async () => {
      const passwordHash = await bcryptjs.hash('password123', 10);
      mockPrismaService.user.findUnique.mockResolvedValue({
        id: 'user-1',
        email: 'test@test.com',
        name: 'Test',
        role: 'USER',
        passwordHash,
      });

      await expect(authService.login({
        email: 'test@test.com',
        password: 'wrongpassword',
      })).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException on non-existent user', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);

      await expect(authService.login({
        email: 'unknown@test.com',
        password: 'password123',
      })).rejects.toThrow(UnauthorizedException);
    });
  });
});
