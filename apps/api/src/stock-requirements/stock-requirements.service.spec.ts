import { Test, TestingModule } from '@nestjs/testing'
import { StockRequirementsService } from './stock-requirements.service'

describe('StockRequirementsService', () => {
  let service: StockRequirementsService

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [StockRequirementsService],
    }).compile()

    service = module.get<StockRequirementsService>(StockRequirementsService)
  })

  it('should be defined', () => {
    expect(service).toBeDefined()
  })
})
