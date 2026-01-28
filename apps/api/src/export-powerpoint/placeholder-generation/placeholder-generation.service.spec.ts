import { Test, TestingModule } from '@nestjs/testing'
import { PlaceholderGenerationService } from './placeholder-generation.service'

describe('PlaceholderGenerationService', () => {
  let service: PlaceholderGenerationService

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PlaceholderGenerationService],
    }).compile()

    service = module.get<PlaceholderGenerationService>(PlaceholderGenerationService)
  })

  it('should be defined', () => {
    expect(service).toBeDefined()
  })
})
