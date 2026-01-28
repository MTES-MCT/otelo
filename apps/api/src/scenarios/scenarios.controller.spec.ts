import { createMock } from '@golevelup/ts-jest'
import { Test, TestingModule } from '@nestjs/testing'
import { ScenariosService } from '~/scenarios/scenarios.service'
import { ScenariosController } from './scenarios.controller'

describe('ScenariosController', () => {
  let controller: ScenariosController

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ScenariosController],
      providers: [
        {
          provide: ScenariosService,
          useValue: createMock<ScenariosService>(),
        },
      ],
    }).compile()

    controller = module.get<ScenariosController>(ScenariosController)
  })

  it('should be defined', () => {
    expect(controller).toBeDefined()
  })
})
