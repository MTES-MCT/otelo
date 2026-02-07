import { createMock } from '@golevelup/ts-jest'
import { Test, TestingModule } from '@nestjs/testing'
import { CalculationContext } from '~/calculation/needs-calculation/base-calculator'
import { HostedService } from '~/calculation/needs-calculation/besoins-stock/heberges-b12/hosted.service'
import { NoAccomodationService } from '~/calculation/needs-calculation/besoins-stock/hors-logement-b11/no-accomodation.service'
import { FinancialInadequationService } from '~/calculation/needs-calculation/besoins-stock/inadequation-financiere-b13/financial-inadequation.service'
import { PhysicalInadequationService } from '~/calculation/needs-calculation/besoins-stock/inadequation-physique-b15/physical-inadequation.service'
import { BadQualityService } from '~/calculation/needs-calculation/besoins-stock/mauvaise-qualite-b14/bad-quality.service'
import { StockRequirementsService } from './stock-requirements.service'

describe('StockRequirementsService', () => {
  let service: StockRequirementsService

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StockRequirementsService,
        { provide: 'CalculationContext', useValue: createMock<CalculationContext>() },
        { provide: NoAccomodationService, useValue: createMock<NoAccomodationService>() },
        { provide: HostedService, useValue: createMock<HostedService>() },
        { provide: FinancialInadequationService, useValue: createMock<FinancialInadequationService>() },
        { provide: BadQualityService, useValue: createMock<BadQualityService>() },
        { provide: PhysicalInadequationService, useValue: createMock<PhysicalInadequationService>() },
      ],
    }).compile()

    service = module.get<StockRequirementsService>(StockRequirementsService)
  })

  it('should be defined', () => {
    expect(service).toBeDefined()
  })
})
