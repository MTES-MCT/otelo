import { createMock } from '@golevelup/ts-jest'
import { Test, TestingModule } from '@nestjs/testing'
import { AccommodationRatesService } from '~/accommodation-rates/accommodation-rates.service'
import { NeedsCalculationService } from '~/calculation/needs-calculation/needs-calculation.service'
import { DataVisualisationService } from '~/data-visualisation/data-visualisation.service'
import { DemographicEvolutionService } from '~/demographic-evolution/demographic-evolution.service'
import { DemographicEvolutionCustomService } from '~/demographic-evolution-custom/demographic-evolution-custom.service'
import { EpcisService } from '~/epcis/epcis.service'
import { ChartGenerationService } from '~/export-powerpoint/chart-generation/chart-generation.service'
import { PlaceholderGenerationService } from '~/export-powerpoint/placeholder-generation/placeholder-generation.service'
import { ZipService } from '~/export-powerpoint/zip/zip.service'
import { RpInseeService } from '~/rp-insee/rp-insee.service'
import { SimulationsService } from '~/simulations/simulations.service'
import { ExportPowerpointService } from './export-powerpoint.service'

describe('ExportPowerpointService', () => {
  let service: ExportPowerpointService
  let zipService: jest.Mocked<ZipService>
  let demographicEvolutionService: jest.Mocked<DemographicEvolutionService>
  let chartGenerationService: jest.Mocked<ChartGenerationService>
  let placeholderService: jest.Mocked<PlaceholderGenerationService>

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
        { provide: DemographicEvolutionCustomService, useValue: createMock<DemographicEvolutionCustomService>() },
        { provide: ChartGenerationService, useValue: createMock<ChartGenerationService>() },
      ],
    }).compile()

    service = await module.resolve<ExportPowerpointService>(ExportPowerpointService)
    zipService = module.get(ZipService)
    demographicEvolutionService = module.get(DemographicEvolutionService)
    chartGenerationService = module.get(ChartGenerationService)
    placeholderService = module.get(PlaceholderGenerationService)
  })

  it('should be defined', () => {
    expect(service).toBeDefined()
  })

  // Les données des diapositives ne dépendent que de la demande : les recalculer
  // pour chaque diapositive multipliait la durée de l'export par leur nombre.
  it('calcule les données des diapositives une seule fois par PowerPoint', async () => {
    const zip = {
      files: { 'ppt/slides/slide1.xml': { async: async () => '' }, 'ppt/slides/slide2.xml': { async: async () => '' } },
      file: jest.fn(),
    }
    zipService.unzipPptx.mockResolvedValue(zip as never)
    zipService.generatePptx.mockResolvedValue(Buffer.from('pptx'))
    const generatePlaceholders = jest.spyOn(service as never, 'generatePlaceholders').mockResolvedValue({} as never)

    await service.generateFromTemplate({} as never)

    expect(generatePlaceholders).toHaveBeenCalledTimes(1)
  })

  it("rend tous les graphiques de l'export dans un même Chromium", async () => {
    const browser = { id: 'chromium' }
    chartGenerationService.withBrowser.mockImplementation(async (task) => task(browser as never))
    zipService.unzipPptx.mockResolvedValue({
      files: { 'ppt/slides/slide1.xml': { async: async () => '' }, 'ppt/slides/slide2.xml': { async: async () => '' } },
      file: jest.fn(),
    } as never)
    zipService.generatePptx.mockResolvedValue(Buffer.from('pptx'))
    placeholderService.processSlide.mockResolvedValue('')
    jest.spyOn(service as never, 'generatePlaceholders').mockResolvedValue({} as never)

    await service.generateFromTemplate({} as never)

    expect(chartGenerationService.withBrowser).toHaveBeenCalledTimes(1)
    expect(placeholderService.processSlide).toHaveBeenCalledTimes(2)
    for (const call of placeholderService.processSlide.mock.calls) {
      expect(call[4]).toBe(browser)
    }
  })

  // Les périodes d'évolution annuelle commencent à l'année du millésime : un
  // scénario 2022 n'a pas de période « 2021-2030 », et la lire faisait échouer
  // les diapositives 10 et 11.
  describe("diapositives d'évolution démographique", () => {
    const epci = { code: '246600449', name: 'CC des Aspres' }
    const evolution = (start: number) => ({
      [`${start}-2030`]: {
        basse: { percent: '0.1', value: 1 },
        central: { percent: '0.2', value: 2 },
        haute: { percent: '0.3', value: 3 },
      },
      '2030-2040': { basse: { percent: '0.4', value: 4 }, central: { percent: '0.5', value: 5 }, haute: { percent: '0.6', value: 6 } },
      '2040-2050': { basse: { percent: '0.7', value: 7 }, central: { percent: '0.8', value: 8 }, haute: { percent: '0.9', value: 9 } },
    })
    type TSlideCalculator = (data: unknown) => Promise<{ text: Record<string, string> }>
    const slides = () => service as never as { calculateSlide10Data: TSlideCalculator; calculateSlide11Data: TSlideCalculator }
    const commonData = (millesime: string) => ({
      baseLayout: {},
      data: { epci },
      epcis: [epci],
      privilegedScenario: { scenario: { millesime, b2_scenario: 'Central_C' } },
    })

    it.each(['2021', '2022'])('remplit la diapositive 10 pour un scénario %s', async (millesime) => {
      demographicEvolutionService.getDemographicEvolutionPopulationAndYear.mockResolvedValue({
        tableData: { [epci.code]: { annualEvolution: evolution(Number(millesime)) } },
      } as never)
      demographicEvolutionService.getDemographicEvolutionPopulationByEpci.mockResolvedValue({
        [epci.code]: { data: [], metadata: {} },
      } as never)

      const { text } = await slides().calculateSlide10Data(commonData(millesime))

      expect(text).toMatchObject({ firstPeriodStart: millesime, pb1: '0.1', pc1: '0.2', ph1: '0.3', pb3: '0.7', ph3: '0.9' })
    })

    it.each(['2021', '2022'])('remplit la diapositive 11 pour un scénario %s', async (millesime) => {
      demographicEvolutionService.getDemographicEvolutionOmphaleAndYear.mockResolvedValue({
        tableData: { [epci.code]: { annualEvolution: evolution(Number(millesime)) } },
        linearChart: {},
      } as never)

      const { text } = await slides().calculateSlide11Data(commonData(millesime))

      expect(text).toMatchObject({
        firstPeriodStart: millesime,
        pcA1: '0.3',
        pcT1: '0.2',
        pcD1: '0.1',
        phT1: '0.2',
        pbT1: '0.2',
        pbT3: '0.8',
      })
    })

    it("affiche N/D quand une période manque plutôt que d'échouer", async () => {
      demographicEvolutionService.getDemographicEvolutionPopulationAndYear.mockResolvedValue({
        tableData: { [epci.code]: { annualEvolution: {} } },
      } as never)
      demographicEvolutionService.getDemographicEvolutionPopulationByEpci.mockResolvedValue({
        [epci.code]: { data: [], metadata: {} },
      } as never)

      const { text } = await slides().calculateSlide10Data(commonData('2022'))

      expect(text).toMatchObject({ pb1: 'N/D', pc2: 'N/D', ph3: 'N/D' })
    })
  })
})
