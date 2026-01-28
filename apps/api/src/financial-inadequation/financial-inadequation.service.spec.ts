import { Test, TestingModule } from '@nestjs/testing'
import { FinancialInadequationService } from './financial-inadequation.service'

describe('FinancialInadequationService', () => {
  let service: FinancialInadequationService

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [FinancialInadequationService],
    }).compile()

    service = module.get<FinancialInadequationService>(FinancialInadequationService)
  })

  it('should be defined', () => {
    expect(service).toBeDefined()
  })
})
