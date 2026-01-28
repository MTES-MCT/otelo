import { createMock } from '@golevelup/ts-jest'
import { Test, TestingModule } from '@nestjs/testing'
import { ResultsService } from '~/results/results.service'
import { ResultsController } from './results.controller'

describe('ResultsController', () => {
  let controller: ResultsController

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ResultsController],
      providers: [
        {
          provide: ResultsService,
          useValue: createMock<ResultsService>(),
        },
      ],
    }).compile()

    controller = module.get<ResultsController>(ResultsController)
  })

  it('should be defined', () => {
    expect(controller).toBeDefined()
  })
})
