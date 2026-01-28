import { Test, TestingModule } from '@nestjs/testing'
import { PhysicalInadequationService } from './physical-inadequation.service'

describe('PhysicalInadequationService', () => {
  let service: PhysicalInadequationService

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PhysicalInadequationService],
    }).compile()

    service = module.get<PhysicalInadequationService>(PhysicalInadequationService)
  })

  it('should be defined', () => {
    expect(service).toBeDefined()
  })
})
