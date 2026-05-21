import { createMock } from '@golevelup/ts-jest'
import { Test, TestingModule } from '@nestjs/testing'
import { BadQualityService } from '~/bad-quality/bad-quality.service'
import { DataPackVersionsService } from '~/data-pack-versions/data-pack-versions.service'
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
  let dataPackVersionsService: jest.Mocked<DataPackVersionsService>
  let demographicEvolutionService: jest.Mocked<DemographicEvolutionService>
  let epcisService: jest.Mocked<EpcisService>

  beforeEach(async () => {
    dataPackVersionsService = createMock<DataPackVersionsService>({
      getActive: jest.fn().mockResolvedValue({ millesime: '2024' }),
    })
    demographicEvolutionService = createMock<DemographicEvolutionService>()
    epcisService = createMock<EpcisService>({
      getBassinEpcisByEpciCode: jest
        .fn()
        .mockResolvedValue([{ code: '245901160', name: 'Test EPCI', region: '32', bassinName: 'Test bassin' }]),
    })

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DataVisualisationService,
        { provide: EpcisService, useValue: epcisService },
        { provide: DemographicEvolutionService, useValue: demographicEvolutionService },
        { provide: RpInseeService, useValue: createMock<RpInseeService>() },
        { provide: VacancyService, useValue: createMock<VacancyService>() },
        { provide: HostedService, useValue: createMock<HostedService>() },
        { provide: NoAccommodationService, useValue: createMock<NoAccommodationService>() },
        { provide: BadQualityService, useValue: createMock<BadQualityService>() },
        { provide: FinancialInadequationService, useValue: createMock<FinancialInadequationService>() },
        { provide: PhysicalInadequationService, useValue: createMock<PhysicalInadequationService>() },
        { provide: SitadelService, useValue: createMock<SitadelService>() },
        { provide: HouseholdSizesService, useValue: createMock<HouseholdSizesService>() },
        { provide: DataPackVersionsService, useValue: dataPackVersionsService },
      ],
    }).compile()

    service = module.get<DataVisualisationService>(DataVisualisationService)
  })

  it('should be defined', () => {
    expect(service).toBeDefined()
  })

  it('uses active data pack millesime for population projection when query has no millesime', async () => {
    await service.getDataByType({
      epci: '245901160',
      type: 'projection-population-evolution',
    })

    expect(dataPackVersionsService.getActive).toHaveBeenCalled()
    expect(demographicEvolutionService.getDemographicEvolutionPopulationAndYear).toHaveBeenCalledWith(
      [{ code: '245901160', name: 'Test EPCI', region: '32', bassinName: 'Test bassin' }],
      '2024',
    )
  })
})
