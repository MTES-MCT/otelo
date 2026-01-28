import { createMock } from '@golevelup/ts-jest'
import { Test, TestingModule } from '@nestjs/testing'
import { DemographicEvolutionService } from '~/demographic-evolution/demographic-evolution.service'
import { DemographicEvolutionController } from './demographic-evolution.controller'

describe('DemographicEvolutionController', () => {
  let controller: DemographicEvolutionController

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [DemographicEvolutionController],
      providers: [
        {
          provide: DemographicEvolutionService,
          useValue: createMock<DemographicEvolutionService>(),
        },
      ],
    }).compile()

    controller = module.get<DemographicEvolutionController>(DemographicEvolutionController)
  })

  it('should be defined', () => {
    expect(controller).toBeDefined()
  })
})
