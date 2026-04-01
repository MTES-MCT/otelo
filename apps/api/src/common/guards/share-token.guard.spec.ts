import { createMock } from '@golevelup/ts-jest'
import { ExecutionContext, NotFoundException } from '@nestjs/common'
import { Test, TestingModule } from '@nestjs/testing'
import { PrismaService } from '~/db/prisma.service'
import { ShareTokenGuard } from './share-token.guard'

describe('ShareTokenGuard', () => {
  let guard: ShareTokenGuard
  let mockPrismaService: jest.Mocked<PrismaService>

  const createMockContext = (token?: string): ExecutionContext => {
    const mockRequest = {
      params: { token } as Record<string, string>,
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
      providers: [ShareTokenGuard, { provide: PrismaService, useValue: mockPrismaService }],
    }).compile()

    guard = module.get<ShareTokenGuard>(ShareTokenGuard)
  })

  it('should be defined', () => {
    expect(guard).toBeDefined()
  })

  it('should reject when no token param', async () => {
    const context = createMockContext(undefined)
    await expect(guard.canActivate(context)).rejects.toThrow(NotFoundException)
  })

  it('should reject when token not found in database', async () => {
    mockPrismaService.simulationShareLink.findUnique = jest.fn().mockResolvedValue(null)
    const context = createMockContext('non-existent-token')
    await expect(guard.canActivate(context)).rejects.toThrow(NotFoundException)
  })

  it('should reject when share link is inactive', async () => {
    mockPrismaService.simulationShareLink.findUnique = jest.fn().mockResolvedValue({
      id: 'link-1',
      token: 'valid-token',
      simulationId: 'sim-1',
      active: false,
    })
    const context = createMockContext('valid-token')
    await expect(guard.canActivate(context)).rejects.toThrow(NotFoundException)
  })

  it('should allow active token and set simulationId on request', async () => {
    mockPrismaService.simulationShareLink.findUnique = jest.fn().mockResolvedValue({
      id: 'link-1',
      token: 'valid-token',
      simulationId: 'sim-1',
      active: true,
    })
    const context = createMockContext('valid-token')
    const result = await guard.canActivate(context)

    expect(result).toBe(true)
    const request = context.switchToHttp().getRequest() as any
    expect(request.shareSimulationId).toBe('sim-1')
    expect(request.params.simulationId).toBe('sim-1')
  })

  it('should query database with the provided token', async () => {
    mockPrismaService.simulationShareLink.findUnique = jest.fn().mockResolvedValue({
      id: 'link-1',
      token: 'my-token',
      simulationId: 'sim-1',
      active: true,
    })
    const context = createMockContext('my-token')
    await guard.canActivate(context)

    expect(mockPrismaService.simulationShareLink.findUnique).toHaveBeenCalledWith({
      where: { token: 'my-token' },
    })
  })
})
