import { createMock } from '@golevelup/ts-jest'
import { Test, TestingModule } from '@nestjs/testing'
import { SimulationsService } from '~/simulations/simulations.service'
import { SimulationsController } from './simulations.controller'

describe('SimulationsController', () => {
  let controller: SimulationsController
  const simulationsService = createMock<SimulationsService>()

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SimulationsController],
      providers: [
        {
          provide: SimulationsService,
          useValue: simulationsService,
        },
      ],
    }).compile()

    controller = module.get<SimulationsController>(SimulationsController)
  })

  it('should be defined', () => {
    expect(controller).toBeDefined()
  })
})
