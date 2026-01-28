import { createMock } from '@golevelup/ts-jest'
import { ExecutionContext } from '@nestjs/common'
import { Test, TestingModule } from '@nestjs/testing'
import { RefreshTokenGuard } from '~/common/guards/refreshtoken.guard'
import { TSession } from '~/schemas/sessions/session'
import { SessionsService } from '~/sessions/sessions.service'

describe('RefreshtokenGuard', () => {
  let guard: RefreshTokenGuard
  let sessionsService: jest.Mocked<SessionsService>

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RefreshTokenGuard,
        {
          provide: SessionsService,
          useValue: createMock<SessionsService>(),
        },
      ],
    }).compile()

    guard = module.get<RefreshTokenGuard>(RefreshTokenGuard)
    sessionsService = module.get(SessionsService)
  })

  it('should allow access when a valid refresh token is provided', async () => {
    const mockRequest = {
      headers: {
        authorization: 'Bearer valid_token',
      },
    }
    const context = createMock<ExecutionContext>({
      switchToHttp: () => ({
        getRequest: () => mockRequest,
      }),
    })

    sessionsService.isValidRefreshToken.mockResolvedValue({} as TSession)

    const result = await guard.canActivate(context)

    expect(sessionsService.isValidRefreshToken).toHaveBeenCalledWith('valid_token')
    expect(result).toBe(true)
  })
})
