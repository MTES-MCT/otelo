import { createMock } from '@golevelup/ts-jest'
import { Test, TestingModule } from '@nestjs/testing'
import { AuthService } from '~/auth/auth.service'
import { AuthController } from './auth.controller'

jest.mock('@thallesp/nestjs-better-auth', () => ({
  AllowAnonymous: () => () => Promise.resolve(true),
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
})
