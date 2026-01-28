import { createMock } from '@golevelup/ts-jest'
import { Test, TestingModule } from '@nestjs/testing'
import { AuthService } from '~/auth/auth.service'
import { RefreshTokenGuard } from '~/common/guards/refreshtoken.guard'
import { TSignupCallback, ZSignupCallback } from '~/schemas/auth/sign-in-callback'
import { TUser } from '~/schemas/users/user'
import { SessionsService } from '~/sessions/sessions.service'
import { AuthController } from './auth.controller'

jest.mock('~/schemas/auth/sign-in-callback', () => ({
  ZSignupCallback: {
    parse: jest.fn(),
  },
}))

describe('AuthController', () => {
  let controller: AuthController
  const authService = createMock<AuthService>()
  let mockRefreshTokenGuard: jest.Mocked<RefreshTokenGuard>

  beforeEach(async () => {
    mockRefreshTokenGuard = {
      canActivate: jest.fn(),
      extractTokenFromHeader: jest.fn(),
      // biome-ignore lint: TODO
    } as any

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: authService,
        },
        {
          provide: RefreshTokenGuard,
          useValue: mockRefreshTokenGuard,
        },
        {
          provide: SessionsService,
          useValue: createMock<SessionsService>(),
        },
      ],
    }).compile()

    controller = module.get<AuthController>(AuthController)
  })

  it('should be defined', () => {
    expect(controller).toBeDefined()
  })

  describe('validate', () => {
    it('should call the authService.validateSignIn method', () => {
      ;(ZSignupCallback.parse as jest.Mock).mockReturnValue({})

      controller.validate({} as TSignupCallback)
      expect(authService.validateProConnectSignIn).toHaveBeenCalled()
    })
  })

  // describe('refresh', () => {
  //   const mockRequest = {
  //     headers: {
  //       authorization: 'Bearer mock-refresh-token',
  //     },
  //     user: undefined,
  //   } as unknown as Request;

  //   const mockRefreshedSession = {
  //     user: { id: 'user-123', email: 'test@example.com' },
  //     accessToken: 'new-access-token',
  //     refreshToken: 'new-refresh-token',
  //   };

  //   beforeEach(() => {
  //     authService.refreshToken.mockReset();
  //     mockRefreshTokenGuard.canActivate.mockReset();
  //   });

  //   it('should refresh token successfully', async () => {
  //     mockRefreshTokenGuard.canActivate.mockResolvedValue(true);

  //     authService.refreshToken.mockResolvedValue({
  //       session: mockRefreshedSession as unknown as TSession,
  //       user: {} as TUser,
  //     });

  //     const result = await controller.refresh(mockRequest);

  //     expect(result).toEqual(mockRefreshedSession);
  //     expect(authService.refreshToken).toHaveBeenCalledWith(
  //       'mock-refresh-token',
  //     );
  //   });

  //   it('should throw UnauthorizedException when refresh token is invalid', async () => {
  //     mockRefreshTokenGuard.canActivate.mockRejectedValue(
  //       new UnauthorizedException('Refresh token not found'),
  //     );

  //     await expect(controller.refresh(mockRequest)).rejects.toThrow(
  //       UnauthorizedException,
  //     );
  //     expect(authService.refreshToken).not.toHaveBeenCalled();
  //   });

  //   it('should handle missing authorization header', async () => {
  //     const requestWithoutAuth = {
  //       headers: {},
  //     } as Request;

  //     await expect(controller.refresh(requestWithoutAuth)).rejects.toThrow(
  //       UnauthorizedException,
  //     );
  //     expect(authService.refreshToken).not.toHaveBeenCalled();
  //   });
  // });

  describe('logout', () => {
    it('should call authService.logout with userId', async () => {
      const mockUser = { id: 'user-123' } as TUser
      await controller.logout(mockUser)
      expect(authService.logout).toHaveBeenCalledWith(mockUser.id)
    })
  })
})
