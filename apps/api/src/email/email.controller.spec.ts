import { createMock } from '@golevelup/ts-jest'
import { ConfigService } from '@nestjs/config'
import { Test, TestingModule } from '@nestjs/testing'
import { EmailService } from '~/email/email.service'
import { EmailController } from './email.controller'

jest.mock('@thallesp/nestjs-better-auth', () => ({
  AllowAnonymous: () => () => {},
}))

describe('EmailController', () => {
  let controller: EmailController

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [EmailController],
      providers: [
        { provide: EmailService, useValue: createMock<EmailService>() },
        {
          provide: ConfigService,
          useValue: { getOrThrow: jest.fn().mockReturnValue('test@test.com') },
        },
      ],
    }).compile()

    controller = module.get<EmailController>(EmailController)
  })

  it('should be defined', () => {
    expect(controller).toBeDefined()
  })
})
