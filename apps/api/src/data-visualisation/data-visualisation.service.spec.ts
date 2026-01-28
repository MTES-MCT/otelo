import { Test, TestingModule } from '@nestjs/testing'
import { DataVisualisationService } from './data-visualisation.service'

describe('DataVisualisationService', () => {
  let service: DataVisualisationService

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [DataVisualisationService],
    }).compile()

    service = module.get<DataVisualisationService>(DataVisualisationService)
  })

  it('should be defined', () => {
    expect(service).toBeDefined()
  })
})
