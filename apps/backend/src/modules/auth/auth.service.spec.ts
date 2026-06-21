import { ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import { CacheService } from '../../common/cache/cache.service';
import { PrismaService } from '../../common/prisma.service';
import { JobsService } from '../jobs/jobs.service';
import { AuthService } from './auth.service';

describe('AuthService', () => {
  let service: AuthService;
  let prismaService: any;
  let jwtService: any;
  let jobsService: any;

  beforeEach(async () => {
    const mockPrismaService: any = {
      user: {
        findFirst: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
      club: {
        findFirst: jest.fn(),
        create: jest.fn(),
      },
      $transaction: jest.fn((callback: (tx: any) => any) =>
        callback(mockPrismaService),
      ),
    };

    const mockJwtService = {
      sign: jest.fn(),
      verify: jest.fn(),
    };

    const mockJobsService = {
      queueEmail: jest.fn().mockResolvedValue(undefined),
    };

    const mockCacheService = {
      get: jest.fn(),
      set: jest.fn(),
      del: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: JwtService, useValue: mockJwtService },
        { provide: JobsService, useValue: mockJobsService },
        { provide: CacheService, useValue: mockCacheService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    prismaService = module.get<PrismaService>(PrismaService);
    jwtService = module.get<JwtService>(JwtService);
    jobsService = module.get<JobsService>(JobsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('register', () => {
    it('should throw ConflictException if user already exists', async () => {
      prismaService.user.findFirst.mockResolvedValue({
        id: '1',
        email: 'test@example.com',
      });
      await expect(
        service.register({
          email: 'test@example.com',
          password: 'password',
          name: 'John Doe',
          gender: 'MALE' as any,
        }),
      ).rejects.toThrow(ConflictException);
    });

    it('should create a new user', async () => {
      prismaService.user.findFirst.mockResolvedValue(null);
      prismaService.user.create.mockResolvedValue({
        id: '1',
        email: 'test@example.com',
        firstName: 'John',
      });

      const result = await service.register({
        email: 'test@example.com',
        password: 'password',
        name: 'John Doe',
        gender: 'MALE',
      });

      expect(result.email).toBe('test@example.com');
      expect(prismaService.user.create).toHaveBeenCalled();
    });
  });
});
