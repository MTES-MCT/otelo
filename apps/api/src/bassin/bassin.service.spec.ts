import { Test, TestingModule } from '@nestjs/testing'
import { BassinService } from './bassin.service'

describe('BassinService', () => {
  let service: BassinService

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [BassinService],
    }).compile()

    service = module.get<BassinService>(BassinService)
  })

  it('should be defined', () => {
    expect(service).toBeDefined()
  })
})
