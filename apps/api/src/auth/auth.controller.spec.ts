import { createMock } from '@golevelup/ts-jest'
import { Test, TestingModule } from '@nestjs/testing'
import { AuthService } from '~/auth/auth.service'
import { TSignupCallback, ZSignupCallback } from '~/schemas/auth/sign-in-callback'
import { AuthController } from './auth.controller'

jest.mock('@thallesp/nestjs-better-auth', () => ({
  AllowAnonymous: () => () => Promise.resolve(true),
}))

jest.mock('~/schemas/auth/sign-in-callback', () => ({
  ZSignupCallback: {
    parse: jest.fn(),
  },
}))

describe('AuthController', () => {
  let controller: AuthController
  const authService = createMock<AuthService>()

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: authService,
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
})
