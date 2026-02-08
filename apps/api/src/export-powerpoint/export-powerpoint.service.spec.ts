import { createMock } from '@golevelup/ts-jest'
import { Test, TestingModule } from '@nestjs/testing'
import { AccommodationRatesService } from '~/accommodation-rates/accommodation-rates.service'
import { NeedsCalculationService } from '~/calculation/needs-calculation/needs-calculation.service'
import { DataVisualisationService } from '~/data-visualisation/data-visualisation.service'
import { DemographicEvolutionService } from '~/demographic-evolution/demographic-evolution.service'
import { EpcisService } from '~/epcis/epcis.service'
import { PlaceholderGenerationService } from '~/export-powerpoint/placeholder-generation/placeholder-generation.service'
import { ZipService } from '~/export-powerpoint/zip/zip.service'
import { RpInseeService } from '~/rp-insee/rp-insee.service'
import { SimulationsService } from '~/simulations/simulations.service'
import { ExportPowerpointService } from './export-powerpoint.service'

describe('ExportPowerpointService', () => {
  let service: ExportPowerpointService

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ExportPowerpointService,
        { provide: ZipService, useValue: createMock<ZipService>() },
        { provide: PlaceholderGenerationService, useValue: createMock<PlaceholderGenerationService>() },
        { provide: DemographicEvolutionService, useValue: createMock<DemographicEvolutionService>() },
        { provide: EpcisService, useValue: createMock<EpcisService>() },
        { provide: NeedsCalculationService, useValue: createMock<NeedsCalculationService>() },
        { provide: SimulationsService, useValue: createMock<SimulationsService>() },
        { provide: DataVisualisationService, useValue: createMock<DataVisualisationService>() },
        { provide: RpInseeService, useValue: createMock<RpInseeService>() },
        { provide: AccommodationRatesService, useValue: createMock<AccommodationRatesService>() },
      ],
    }).compile()

    service = await module.resolve<ExportPowerpointService>(ExportPowerpointService)
  })

  it('should be defined', () => {
    expect(service).toBeDefined()
  })
})
