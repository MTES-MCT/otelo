import { Test, TestingModule } from '@nestjs/testing'
import { RpInseeService } from './rp-insee.service'

describe('RpInseeService', () => {
  let service: RpInseeService

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [RpInseeService],
    }).compile()

    service = module.get<RpInseeService>(RpInseeService)
  })

  it('should be defined', () => {
    expect(service).toBeDefined()
  })
})
