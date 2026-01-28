import { Test, TestingModule } from '@nestjs/testing'
import { ExportPowerpointService } from './export-powerpoint.service'

describe('ExportPowerpointService', () => {
  let service: ExportPowerpointService

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ExportPowerpointService],
    }).compile()

    service = module.get<ExportPowerpointService>(ExportPowerpointService)
  })

  it('should be defined', () => {
    expect(service).toBeDefined()
  })
})
