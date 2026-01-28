import { Test, TestingModule } from '@nestjs/testing'
import { HouseholdSizesService } from './household-sizes.service'

describe('HouseholdSizesService', () => {
  let service: HouseholdSizesService

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [HouseholdSizesService],
    }).compile()

    service = module.get<HouseholdSizesService>(HouseholdSizesService)
  })

  it('should be defined', () => {
    expect(service).toBeDefined()
  })
})
