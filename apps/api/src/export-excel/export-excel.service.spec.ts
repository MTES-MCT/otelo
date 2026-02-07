import { createMock } from '@golevelup/ts-jest'
import { Test, TestingModule } from '@nestjs/testing'
import { AccommodationRatesService } from '~/accommodation-rates/accommodation-rates.service'
import { PrismaService } from '~/db/prisma.service'
import { DemographicEvolutionService } from '~/demographic-evolution/demographic-evolution.service'
import { ResultsService } from '~/results/results.service'
import { ExportExcelService } from './export-excel.service'

describe('ExportExcelService', () => {
  let service: ExportExcelService

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ExportExcelService,
        { provide: PrismaService, useValue: createMock<PrismaService>() },
        { provide: ResultsService, useValue: createMock<ResultsService>() },
        { provide: AccommodationRatesService, useValue: createMock<AccommodationRatesService>() },
        { provide: DemographicEvolutionService, useValue: createMock<DemographicEvolutionService>() },
      ],
    }).compile()

    service = module.get<ExportExcelService>(ExportExcelService)
  })

  it('should be defined', () => {
    expect(service).toBeDefined()
  })
})
