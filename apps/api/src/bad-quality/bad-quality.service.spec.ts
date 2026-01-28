import { Test, TestingModule } from '@nestjs/testing'
import { BadQualityService } from './bad-quality.service'

describe('BadQualityService', () => {
  let service: BadQualityService

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [BadQualityService],
    }).compile()

    service = module.get<BadQualityService>(BadQualityService)
  })

  it('should be defined', () => {
    expect(service).toBeDefined()
  })
})
