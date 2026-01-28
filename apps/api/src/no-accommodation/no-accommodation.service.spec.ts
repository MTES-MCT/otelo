import { Test, TestingModule } from '@nestjs/testing'
import { NoAccommodationService } from './no-accommodation.service'

describe('NoAccommodationService', () => {
  let service: NoAccommodationService

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [NoAccommodationService],
    }).compile()

    service = module.get<NoAccommodationService>(NoAccommodationService)
  })

  it('should be defined', () => {
    expect(service).toBeDefined()
  })
})
