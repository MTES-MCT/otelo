import { createMock } from '@golevelup/ts-jest'
import { ExecutionContext } from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import { Test, TestingModule } from '@nestjs/testing'
import { AuthService } from '~/auth/auth.service'
import { TModelAccess } from '~/common/decorators/control-access.decorator'
import { AuthorizationGuard } from '~/common/guards/authorization.guard'

jest.mock('better-auth/node', () => ({
  fromNodeHeaders: jest.fn().mockReturnValue({}),
}))

jest.mock('~/auth/better-auth', () => ({
  auth: {
    api: {
      getSession: jest.fn(),
    },
  },
}))

import { auth } from '~/auth/better-auth'

const mockGetSession = auth.api.getSession as unknown as jest.Mock

describe('AuthorizationGuard', () => {
  let guard: AuthorizationGuard
  let mockReflector: { getAllAndOverride: jest.Mock }
  let authService: jest.Mocked<AuthService>

  beforeEach(async () => {
    mockReflector = { getAllAndOverride: jest.fn() }

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthorizationGuard,
        { provide: Reflector, useValue: mockReflector },
        { provide: AuthService, useValue: createMock<AuthService>() },
      ],
    }).compile()

    guard = module.get<AuthorizationGuard>(AuthorizationGuard)
    authService = module.get(AuthService)
  })

  it('should allow access when no user and no model access defined', async () => {
    const context = createMock<ExecutionContext>()
    mockGetSession.mockResolvedValueOnce(null)
    mockReflector.getAllAndOverride.mockReturnValueOnce(undefined)

    const result = await guard.canActivate(context)
    expect(result).toBe(true)
  })

  it('should deny access when no user but model access is defined', async () => {
    const context = createMock<ExecutionContext>()
    mockGetSession.mockResolvedValueOnce(null)
    mockReflector.getAllAndOverride.mockReturnValueOnce({ roles: ['USER'] })

    const result = await guard.canActivate(context)
    expect(result).toBe(false)
  })

  it('should allow access for admin users', async () => {
    const context = createMock<ExecutionContext>()
    mockGetSession.mockResolvedValueOnce({
      user: { role: 'ADMIN', hasAccess: true },
      session: {},
    })
    mockReflector.getAllAndOverride.mockReturnValueOnce({ roles: ['USER'] })

    const result = await guard.canActivate(context)
    expect(result).toBe(true)
  })

  it('should deny access when user does not have hasAccess', async () => {
    const context = createMock<ExecutionContext>()
    mockGetSession.mockResolvedValueOnce({
      user: { role: 'USER', hasAccess: false },
      session: {},
    })
    mockReflector.getAllAndOverride.mockReturnValueOnce({ roles: ['USER'] })

    const result = await guard.canActivate(context)
    expect(result).toBe(false)
  })

  it('should allow access if user has required role and no entity check is needed', async () => {
    const context = createMock<ExecutionContext>()
    mockGetSession.mockResolvedValueOnce({
      user: { role: 'USER', hasAccess: true },
      session: {},
    })
    mockReflector.getAllAndOverride.mockReturnValueOnce({ roles: ['USER'] })
    authService.hasRole.mockReturnValue(true)

    const result = await guard.canActivate(context)
    expect(result).toBe(true)
  })

  it('should deny access if user does not have required role', async () => {
    const context = createMock<ExecutionContext>()
    mockGetSession.mockResolvedValueOnce({
      user: { role: 'USER', hasAccess: true },
      session: {},
    })
    mockReflector.getAllAndOverride.mockReturnValueOnce({ roles: ['ADMIN'] })
    authService.hasRole.mockReturnValue(false)

    const result = await guard.canActivate(context)
    expect(result).toBe(false)
  })

  it('should allow access when user hasAccess was recently granted (no stale cache)', async () => {
    const context = createMock<ExecutionContext>()
    // Simulates: admin granted hasAccess=true, getSession reads fresh DB value
    mockGetSession.mockResolvedValueOnce({
      user: { role: 'USER', hasAccess: true },
      session: {},
    })
    mockReflector.getAllAndOverride.mockReturnValueOnce({ roles: ['USER'] })
    authService.hasRole.mockReturnValue(true)

    const result = await guard.canActivate(context)
    expect(result).toBe(true)
  })

  it('should deny then allow access when hasAccess changes between requests', async () => {
    const context = createMock<ExecutionContext>()
    mockReflector.getAllAndOverride.mockReturnValue({ roles: ['USER'] })

    // First request: user has no access yet
    mockGetSession.mockResolvedValueOnce({
      user: { role: 'USER', hasAccess: false },
      session: {},
    })
    expect(await guard.canActivate(context)).toBe(false)

    // Second request: admin/CRON granted access, getSession returns fresh data
    mockGetSession.mockResolvedValueOnce({
      user: { role: 'USER', hasAccess: true },
      session: {},
    })
    authService.hasRole.mockReturnValue(true)
    expect(await guard.canActivate(context)).toBe(true)
  })

  it('should allow admin access regardless of hasAccess value', async () => {
    const context = createMock<ExecutionContext>()
    mockGetSession.mockResolvedValueOnce({
      user: { role: 'ADMIN', hasAccess: false },
      session: {},
    })
    mockReflector.getAllAndOverride.mockReturnValueOnce({ roles: ['USER'] })

    const result = await guard.canActivate(context)
    expect(result).toBe(true)
  })

  it('should check entity access when entity is defined in model access', async () => {
    const context = createMock<ExecutionContext>()
    mockGetSession.mockResolvedValueOnce({
      user: { role: 'USER', hasAccess: true },
      session: {},
    })
    const modelAccess: TModelAccess = { entity: {}, paramName: 'id', roles: ['USER'] }
    mockReflector.getAllAndOverride.mockReturnValueOnce(modelAccess)
    authService.hasRole.mockReturnValue(true)
    authService.canAccessEntity.mockResolvedValue(true)

    const result = await guard.canActivate(context)
    expect(result).toBe(true)
  })
})
