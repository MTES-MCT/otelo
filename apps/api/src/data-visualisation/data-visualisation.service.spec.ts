import { createMock } from '@golevelup/ts-jest'
import { Test, TestingModule } from '@nestjs/testing'
import { BadQualityService } from '~/bad-quality/bad-quality.service'
import { DemographicEvolutionService } from '~/demographic-evolution/demographic-evolution.service'
import { EpcisService } from '~/epcis/epcis.service'
import { FinancialInadequationService } from '~/financial-inadequation/financial-inadequation.service'
import { HostedService } from '~/hosted/hosted.service'
import { HouseholdSizesService } from '~/household-sizes/household-sizes.service'
import { NoAccommodationService } from '~/no-accommodation/no-accommodation.service'
import { PhysicalInadequationService } from '~/physical-inadequation/physical-inadequation.service'
import { RpInseeService } from '~/rp-insee/rp-insee.service'
import { SitadelService } from '~/sitadel/sitadel.service'
import { VacancyService } from '~/vacancy/vacancy.service'
import { DataVisualisationService } from './data-visualisation.service'

describe('DataVisualisationService', () => {
  let service: DataVisualisationService

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DataVisualisationService,
        { provide: EpcisService, useValue: createMock<EpcisService>() },
        { provide: DemographicEvolutionService, useValue: createMock<DemographicEvolutionService>() },
        { provide: RpInseeService, useValue: createMock<RpInseeService>() },
        { provide: VacancyService, useValue: createMock<VacancyService>() },
        { provide: HostedService, useValue: createMock<HostedService>() },
        { provide: NoAccommodationService, useValue: createMock<NoAccommodationService>() },
        { provide: BadQualityService, useValue: createMock<BadQualityService>() },
        { provide: FinancialInadequationService, useValue: createMock<FinancialInadequationService>() },
        { provide: PhysicalInadequationService, useValue: createMock<PhysicalInadequationService>() },
        { provide: SitadelService, useValue: createMock<SitadelService>() },
        { provide: HouseholdSizesService, useValue: createMock<HouseholdSizesService>() },
      ],
    }).compile()

    service = module.get<DataVisualisationService>(DataVisualisationService)
  })

  it('should be defined', () => {
    expect(service).toBeDefined()
  })
})
