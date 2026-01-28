import { Test, TestingModule } from '@nestjs/testing'
import { ChartGenerationService } from './chart-generation.service'

describe('ChartGenerationService', () => {
  let service: ChartGenerationService

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ChartGenerationService],
    }).compile()

    service = module.get<ChartGenerationService>(ChartGenerationService)
  })

  it('should be defined', () => {
    expect(service).toBeDefined()
  })
})
