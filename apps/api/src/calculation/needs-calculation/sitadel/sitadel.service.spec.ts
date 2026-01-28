import { Test, TestingModule } from '@nestjs/testing'
import { SitadelService } from './sitadel.service'

describe('SitadelService', () => {
  let service: SitadelService

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [SitadelService],
    }).compile()

    service = module.get<SitadelService>(SitadelService)
  })

  it('should be defined', () => {
    expect(service).toBeDefined()
  })
})
