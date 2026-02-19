import { createMock } from '@golevelup/ts-jest'
import { ExecutionContext, UnauthorizedException } from '@nestjs/common'
import { Test, TestingModule } from '@nestjs/testing'
import { createHash } from 'crypto'
import { PrismaService } from '~/db/prisma.service'
import { ApiKeyGuard } from './api-key.guard'

describe('ApiKeyGuard', () => {
  let guard: ApiKeyGuard
  let mockPrismaService: jest.Mocked<PrismaService>

  const validKey = 'otelo_a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2'
  const validHashedKey = createHash('sha256').update(validKey).digest('hex')

  const createMockContext = (authHeader?: string): ExecutionContext => {
    const mockRequest = {
      headers: {
        authorization: authHeader,
      },
    }

    return {
      switchToHttp: () => ({
        getRequest: () => mockRequest,
      }),
    } as unknown as ExecutionContext
  }

  beforeEach(async () => {
    mockPrismaService = createMock<PrismaService>()

    const module: TestingModule = await Test.createTestingModule({
      providers: [ApiKeyGuard, { provide: PrismaService, useValue: mockPrismaService }],
    }).compile()

    guard = module.get<ApiKeyGuard>(ApiKeyGuard)
  })

  it('should be defined', () => {
    expect(guard).toBeDefined()
  })

  it('should reject when no Authorization header', async () => {
    const context = createMockContext()
    await expect(guard.canActivate(context)).rejects.toThrow(UnauthorizedException)
  })

  it('should reject when Authorization header does not start with Bearer otelo_', async () => {
    const context = createMockContext('Bearer some_random_key')
    await expect(guard.canActivate(context)).rejects.toThrow(UnauthorizedException)
  })

  it('should reject when API key is not found in database', async () => {
    mockPrismaService.apiConsumer.findUnique = jest.fn().mockResolvedValue(null)
    const context = createMockContext(`Bearer ${validKey}`)
    await expect(guard.canActivate(context)).rejects.toThrow(UnauthorizedException)
  })

  it('should reject when consumer is inactive', async () => {
    mockPrismaService.apiConsumer.findUnique = jest.fn().mockResolvedValue({
      id: '1',
      hashedKey: validHashedKey,
      active: false,
    })
    const context = createMockContext(`Bearer ${validKey}`)
    await expect(guard.canActivate(context)).rejects.toThrow(UnauthorizedException)
  })

  it('should allow valid active key and set apiConsumer on request', async () => {
    const consumer = {
      id: '1',
      hashedKey: validHashedKey,
      active: true,
    }
    mockPrismaService.apiConsumer.findUnique = jest.fn().mockResolvedValue(consumer)
    mockPrismaService.apiConsumer.update = jest.fn().mockResolvedValue(consumer)

    const context = createMockContext(`Bearer ${validKey}`)
    const result = await guard.canActivate(context)

    expect(result).toBe(true)
    const request = context.switchToHttp().getRequest()
    expect((request as any).apiConsumer).toEqual(consumer)
  })
})
