import { Test, TestingModule } from '@nestjs/testing'
import { ExportExcelService } from './export-excel.service'

describe('ExportExcelService', () => {
  let service: ExportExcelService

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ExportExcelService],
    }).compile()

    service = module.get<ExportExcelService>(ExportExcelService)
  })

  it('should be defined', () => {
    expect(service).toBeDefined()
  })
})
