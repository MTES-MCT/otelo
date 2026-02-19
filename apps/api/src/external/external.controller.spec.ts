import { createMock } from '@golevelup/ts-jest'
import { Test, TestingModule } from '@nestjs/testing'
import { PrismaService } from '~/db/prisma.service'
import { ExternalController } from './external.controller'
import { ExternalService } from './external.service'

jest.mock('@thallesp/nestjs-better-auth', () => ({
  // biome-ignore lint/suspicious/noEmptyBlockStatements: allow empty block
  AllowAnonymous: () => () => {},
}))

describe('ExternalController', () => {
  let controller: ExternalController

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ExternalController],
      providers: [
        {
          provide: ExternalService,
          useValue: createMock<ExternalService>(),
        },
        {
          provide: PrismaService,
          useValue: createMock<PrismaService>(),
        },
      ],
    }).compile()

    controller = module.get<ExternalController>(ExternalController)
  })

  it('should be defined', () => {
    expect(controller).toBeDefined()
  })
})
