import { createMock } from '@golevelup/ts-jest'
import { Test, TestingModule } from '@nestjs/testing'
import { NeedsCalculationService } from '~/calculation/needs-calculation/needs-calculation.service'
import { SimulationsService } from '~/simulations/simulations.service'
import { ResultsService } from './results.service'

describe('ResultsService', () => {
  let service: ResultsService

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ResultsService,
        {
          provide: SimulationsService,
          useValue: createMock<SimulationsService>(),
        },
        {
          provide: NeedsCalculationService,
          useValue: createMock<NeedsCalculationService>(),
        },
      ],
    }).compile()

    service = module.get<ResultsService>(ResultsService)
  })

  it('should be defined', () => {
    expect(service).toBeDefined()
  })
})
