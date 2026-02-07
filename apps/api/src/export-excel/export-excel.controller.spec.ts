import { createMock } from '@golevelup/ts-jest'
import { Test, TestingModule } from '@nestjs/testing'
import { ExportExcelService } from '~/export-excel/export-excel.service'
import { ExportExcelController } from './export-excel.controller'

describe('ExportExcelController', () => {
  let controller: ExportExcelController

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ExportExcelController],
      providers: [{ provide: ExportExcelService, useValue: createMock<ExportExcelService>() }],
    }).compile()

    controller = module.get<ExportExcelController>(ExportExcelController)
  })

  it('should be defined', () => {
    expect(controller).toBeDefined()
  })
})
