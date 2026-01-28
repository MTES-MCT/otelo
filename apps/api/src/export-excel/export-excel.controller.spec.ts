import { Test, TestingModule } from '@nestjs/testing'
import { ExportExcelController } from './export-excel.controller'

describe('ExportExcelController', () => {
  let controller: ExportExcelController

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ExportExcelController],
    }).compile()

    controller = module.get<ExportExcelController>(ExportExcelController)
  })

  it('should be defined', () => {
    expect(controller).toBeDefined()
  })
})
