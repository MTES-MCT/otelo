import { Test, TestingModule } from '@nestjs/testing'
import { HostedService } from './hosted.service'

describe('HostedService', () => {
  let service: HostedService

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [HostedService],
    }).compile()

    service = module.get<HostedService>(HostedService)
  })

  it('should be defined', () => {
    expect(service).toBeDefined()
  })
})
