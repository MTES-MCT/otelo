import { createMock } from '@golevelup/ts-jest'
import { ExecutionContext } from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import { Test, TestingModule } from '@nestjs/testing'
import { IS_PUBLIC_KEY } from '~/common/decorators/public.decorator'
import { AuthenticationGuard } from '~/common/guards/authentication.guard'
import { TSession } from '~/schemas/sessions/session'
import { TUser } from '~/schemas/users/user'
import { SessionsService } from '~/sessions/sessions.service'
import { UsersService } from '~/users/users.service'

describe('AuthenticationGuard', () => {
  let guard: AuthenticationGuard
  let sessionsService: jest.Mocked<SessionsService>
  let usersService: jest.Mocked<UsersService>
  let reflector: jest.Mocked<Reflector>

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthenticationGuard,
        {
          provide: SessionsService,
          useValue: createMock<SessionsService>(),
        },
        {
          provide: UsersService,
          useValue: createMock<UsersService>(),
        },
        {
          provide: Reflector,
          useValue: createMock<Reflector>(),
        },
      ],
    }).compile()

    guard = module.get<AuthenticationGuard>(AuthenticationGuard)
    sessionsService = module.get(SessionsService)
    usersService = module.get(UsersService)
    reflector = module.get(Reflector)
  })

  it('should allow access to public routes', async () => {
    const context = createMock<ExecutionContext>()
    reflector.getAllAndOverride.mockReturnValue(true)

    const result = await guard.canActivate(context)

    expect(result).toBe(true)
    expect(reflector.getAllAndOverride).toHaveBeenCalledWith(IS_PUBLIC_KEY, [context.getHandler(), context.getClass()])
  })

  it('should deny access when no token is provided', async () => {
    const context = createMock<ExecutionContext>({
      switchToHttp: () => ({
        getRequest: () => ({
          headers: {},
        }),
      }),
    })
    reflector.getAllAndOverride.mockReturnValue(false)

    const result = await guard.canActivate(context)

    expect(result).toBe(false)
  })

  it('should allow access with a valid token', async () => {
    const mockUser: TUser = {
      createdAt: new Date('2024-01-01'),
      email: 'test@example.com',
      firstname: 'John',
      id: '1',
      lastLoginAt: new Date('2024-01-01'),
      lastname: 'Doe',
      provider: 'cerema',
      role: 'USER',
      sub: '1',
      updatedAt: new Date('2024-01-01'),
    }
    const mockRequest = {
      headers: {
        authorization: 'Bearer valid_token',
      },
      user: undefined as TUser | undefined,
    }
    const context = createMock<ExecutionContext>({
      switchToHttp: () => ({
        getRequest: () => mockRequest,
      }),
    })
    reflector.getAllAndOverride.mockReturnValue(false)
    sessionsService.isValidToken.mockResolvedValue({
      accessToken: 'valid_token',
      refreshToken: 'refresh_token',
    } as TSession)
    usersService.getByToken.mockResolvedValue(mockUser)

    const result = await guard.canActivate(context)

    expect(result).toBe(true)
    expect(sessionsService.isValidToken).toHaveBeenCalledWith('valid_token')
    expect(usersService.getByToken).toHaveBeenCalledWith('valid_token')
    expect(mockRequest.user).toEqual(mockUser)
  })

  it('should deny access with an invalid token', async () => {
    const mockRequest = {
      headers: {
        authorization: 'Bearer invalid_token',
      },
      user: undefined,
    }
    const context = createMock<ExecutionContext>({
      switchToHttp: () => ({
        getRequest: () => mockRequest,
      }),
    })
    reflector.getAllAndOverride.mockReturnValue(false)
    sessionsService.isValidToken.mockResolvedValue(null)

    const result = await guard.canActivate(context)

    expect(result).toBe(false)
    expect(sessionsService.isValidToken).toHaveBeenCalledWith('invalid_token')
    expect(usersService.getByToken).not.toHaveBeenCalled()
    expect(mockRequest.user).toBeUndefined()
  })
})
