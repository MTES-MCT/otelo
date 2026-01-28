import { createMock } from '@golevelup/ts-jest'
import { ExecutionContext } from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import { Test, TestingModule } from '@nestjs/testing'
import { AuthService } from '~/auth/auth.service'
import { ACCESS_CONTROL_KEY, TModelAccess } from '~/common/decorators/control-access.decorator'
import { IS_PUBLIC_KEY } from '~/common/decorators/public.decorator'
import { AuthorizationGuard } from '~/common/guards/authorization.guard'
import { TUser } from '~/schemas/users/user'

describe('AuthorizationGuard', () => {
  let guard: AuthorizationGuard
  let reflector: jest.Mocked<Reflector>
  let authService: jest.Mocked<AuthService>

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthorizationGuard,
        {
          provide: Reflector,
          useValue: createMock<Reflector>(),
        },
        {
          provide: AuthService,
          useValue: createMock<AuthService>(),
        },
      ],
    }).compile()

    guard = module.get<AuthorizationGuard>(AuthorizationGuard)
    reflector = module.get(Reflector)
    authService = module.get(AuthService)
  })

  it('should allow access to public routes', async () => {
    const context = createMock<ExecutionContext>()
    reflector.getAllAndOverride.mockReturnValueOnce(true)

    const result = await guard.canActivate(context)

    expect(result).toBe(true)
    expect(reflector.getAllAndOverride).toHaveBeenCalledWith(IS_PUBLIC_KEY, [context.getHandler(), context.getClass()])
  })

  it('should deny access if no model access is defined', async () => {
    const context = createMock<ExecutionContext>()
    const mockRequest = { user: {} }
    context.switchToHttp().getRequest.mockReturnValue(mockRequest)

    reflector.getAllAndOverride.mockImplementation((key) => {
      if (key === IS_PUBLIC_KEY) return false
      if (key === ACCESS_CONTROL_KEY) return undefined
      return undefined
    })

    const result = await guard.canActivate(context)

    expect(result).toBe(false)
    expect(reflector.getAllAndOverride).toHaveBeenCalledWith(IS_PUBLIC_KEY, [context.getHandler(), context.getClass()])
    expect(reflector.getAllAndOverride).toHaveBeenCalledWith(ACCESS_CONTROL_KEY, [context.getHandler(), context.getClass()])
  })

  it('should deny access if user does not have required role', async () => {
    const context = createMock<ExecutionContext>()
    const mockUser: TUser = createMock<TUser>()
    const mockRequest = { user: mockUser }
    context.switchToHttp().getRequest.mockReturnValue(mockRequest)

    reflector.getAllAndOverride.mockReturnValueOnce(false).mockReturnValueOnce({ roles: ['ADMIN'] })
    authService.hasRole.mockReturnValue(false)

    const result = await guard.canActivate(context)

    expect(result).toBe(false)
    expect(authService.hasRole).toHaveBeenCalledWith(mockUser, ['ADMIN'])
  })

  it('should allow access if user has required role and no entity check is needed', async () => {
    const context = createMock<ExecutionContext>()
    const mockUser: TUser = createMock<TUser>()
    const mockRequest = { user: mockUser }
    context.switchToHttp().getRequest.mockReturnValue(mockRequest)

    reflector.getAllAndOverride.mockReturnValueOnce(false).mockReturnValueOnce({ roles: ['USER'] })
    authService.hasRole.mockReturnValue(true)

    const result = await guard.canActivate(context)

    expect(result).toBe(true)
    expect(authService.hasRole).toHaveBeenCalledWith(mockUser, ['USER'])
  })

  it('should allow access if user has required role and can access the entity', async () => {
    const context = createMock<ExecutionContext>()
    const mockUser: TUser = createMock<TUser>()
    const mockRequest = { user: mockUser }
    context.switchToHttp().getRequest.mockReturnValue(mockRequest)

    const modelAccess: TModelAccess = { entity: {}, paramName: 'id', roles: ['USER'] }
    reflector.getAllAndOverride.mockReturnValueOnce(false).mockReturnValueOnce(modelAccess)
    authService.hasRole.mockReturnValue(true)
    authService.canAccessEntity.mockResolvedValue(true)

    const result = await guard.canActivate(context)

    expect(result).toBe(true)
    expect(authService.hasRole).toHaveBeenCalledWith(mockUser, ['USER'])
    expect(authService.canAccessEntity).toHaveBeenCalledWith(modelAccess.entity, modelAccess.paramName, mockUser, mockRequest)
  })

  it('should deny access if user has required role but cannot access the entity', async () => {
    const context = createMock<ExecutionContext>()
    const mockUser: TUser = createMock<TUser>()
    const mockRequest = { user: mockUser }
    context.switchToHttp().getRequest.mockReturnValue(mockRequest)

    const modelAccess: TModelAccess = { entity: {}, paramName: 'id', roles: ['USER'] }
    reflector.getAllAndOverride.mockReturnValueOnce(false).mockReturnValueOnce(modelAccess)
    authService.hasRole.mockReturnValue(true)
    authService.canAccessEntity.mockResolvedValue(false)

    const result = await guard.canActivate(context)

    expect(result).toBe(false)
    expect(authService.hasRole).toHaveBeenCalledWith(mockUser, ['USER'])
    expect(authService.canAccessEntity).toHaveBeenCalledWith(modelAccess.entity, modelAccess.paramName, mockUser, mockRequest)
  })
})
