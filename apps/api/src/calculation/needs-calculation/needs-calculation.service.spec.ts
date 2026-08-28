import { createMock, DeepMocked } from '@golevelup/ts-jest'
import { Test, TestingModule } from '@nestjs/testing'
import { FlowRequirementService } from '~/calculation/needs-calculation/besoins-flux/flow-requirement.service'
import { SitadelService } from '~/calculation/needs-calculation/sitadel/sitadel.service'
import { StockRequirementsService } from '~/stock-requirements/stock-requirements.service'
import { makeEpciScenario, makeScenario, makeSimulation, makeStockRequirementsResults } from './__test-utils__/calculation-test-fixtures'
import { NeedsCalculationService } from './needs-calculation.service'

describe('NeedsCalculationService', () => {
  let service: NeedsCalculationService
  let flowService: DeepMocked<FlowRequirementService>
  let stockService: DeepMocked<StockRequirementsService>
  let sitadelService: DeepMocked<SitadelService>

  beforeEach(async () => {
    flowService = createMock<FlowRequirementService>()
    stockService = createMock<StockRequirementsService>()
    sitadelService = createMock<SitadelService>()

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NeedsCalculationService,
        { provide: FlowRequirementService, useValue: flowService },
        { provide: StockRequirementsService, useValue: stockService },
        { provide: SitadelService, useValue: sitadelService },
      ],
    }).compile()

    service = module.get<NeedsCalculationService>(NeedsCalculationService)
  })

  it('should be defined', () => {
    expect(service).toBeDefined()
  })

  describe('calculate', () => {
    it('should orchestrate stock, flow, and sitadel calculations', async () => {
      const stockResults = makeStockRequirementsResults('200000001')
      stockService.calculateStock.mockResolvedValue(stockResults)
      stockService.calculateProrataStockByEpci.mockReturnValue({
        total: 500,
        prePeakTotal: 400,
        postPeakTotal: 100,
      })

      flowService.calculate.mockResolvedValue({
        epcis: [
          {
            code: '200000001',
            data: { peakYear: 2031, parcEvolution: {}, housingNeeds: {}, surplusHousing: {} },
            totals: {
              demographicEvolution: 200,
              renewalNeeds: 50,
              secondaryResidenceAccomodationEvolution: -10,
              housingNeeds: 300,
              surplusHousing: 0,
              vacantAccomodation: -20,
              shortTermVacantAccomodation: -10,
              longTermVacantAccomodation: -10,
            },
            metadata: { max: 2041, min: 2021 },
          },
        ],
      })

      sitadelService.calculate.mockResolvedValue({ epcis: [] } as any)

      const simulation = makeSimulation({
        scenario: makeScenario({ projection: 2041 }),
      })
      const result = await service.calculate(simulation)

      expect(stockService.calculateStock).toHaveBeenCalledWith(simulation)
      expect(flowService.calculate).toHaveBeenCalledWith(simulation, stockResults)
      expect(sitadelService.calculate).toHaveBeenCalledWith(simulation)
      expect(result.flowRequirement).toBeDefined()
      expect(result.noAccomodation).toBeDefined()
      expect(result.hosted).toBeDefined()
      expect(result.financialInadequation).toBeDefined()
      expect(result.badQuality).toBeDefined()
      expect(result.physicalInadequation).toBeDefined()
    })

    it('should compute total as sum of flux and stock per EPCI', async () => {
      const stockResults = makeStockRequirementsResults('200000001')
      stockService.calculateStock.mockResolvedValue(stockResults)
      stockService.calculateProrataStockByEpci.mockReturnValue({
        total: 500,
        prePeakTotal: 400,
        postPeakTotal: 100,
      })

      flowService.calculate.mockResolvedValue({
        epcis: [
          {
            code: '200000001',
            data: { peakYear: 2031, parcEvolution: {}, housingNeeds: {}, surplusHousing: {} },
            totals: {
              demographicEvolution: 100,
              renewalNeeds: 50,
              secondaryResidenceAccomodationEvolution: -10,
              housingNeeds: 200,
              surplusHousing: 0,
              vacantAccomodation: -20,
              shortTermVacantAccomodation: -10,
              longTermVacantAccomodation: -10,
            },
            metadata: { max: 2041, min: 2021 },
          },
        ],
      })

      sitadelService.calculate.mockResolvedValue({ epcis: [] } as any)

      const simulation = makeSimulation()
      const result = await service.calculate(simulation)

      expect(result.totalFlux).toBeDefined()
      expect(result.totalStock).toBeDefined()
      expect(result.total).toBeDefined()
      expect(result.epcisTotals).toHaveLength(1)
      expect(result.epcisTotals[0].epciCode).toBe('200000001')
    })

    it('should handle multiple EPCIs', async () => {
      const makeResult = (epciCode: string, value: number) => ({
        epcis: [{ epciCode, value, prorataValue: value }],
        total: value,
        prorataTotal: value,
      })
      stockService.calculateStock.mockResolvedValue({
        noAccomodation: makeResult('200000001', 50),
        hosted: makeResult('200000001', 50),
        financialInadequation: makeResult('200000001', 50),
        badQuality: makeResult('200000001', 50),
        physicalInadequation: makeResult('200000001', 50),
      })
      stockService.calculateProrataStockByEpci.mockReturnValue({
        total: 250,
        prePeakTotal: 200,
        postPeakTotal: 50,
      })

      flowService.calculate.mockResolvedValue({
        epcis: [
          {
            code: '200000001',
            data: { peakYear: 2031, parcEvolution: {}, housingNeeds: {}, surplusHousing: {} },
            totals: {
              demographicEvolution: 100,
              renewalNeeds: 50,
              secondaryResidenceAccomodationEvolution: 0,
              housingNeeds: 100,
              surplusHousing: 0,
              vacantAccomodation: 0,
              shortTermVacantAccomodation: 0,
              longTermVacantAccomodation: 0,
            },
            metadata: { max: 2041, min: 2021 },
          },
        ],
      })

      sitadelService.calculate.mockResolvedValue({ epcis: [] } as any)

      const simulation = makeSimulation()
      const result = await service.calculate(simulation)
      expect(result.total).toBeDefined()
      expect(typeof result.total).toBe('number')
    })

    it('should not accumulate vacantAccomodation and secondaryAccommodation across EPCIs', async () => {
      stockService.calculateStock.mockResolvedValue(makeStockRequirementsResults('200000001'))
      stockService.calculateProrataStockByEpci.mockReturnValue({
        total: 200,
        prePeakTotal: 150,
        postPeakTotal: 50,
      })

      flowService.calculate.mockResolvedValue({
        epcis: [
          {
            code: '200000001',
            data: { peakYear: 2031, parcEvolution: {}, housingNeeds: {}, surplusHousing: {} },
            totals: {
              demographicEvolution: 100,
              renewalNeeds: 50,
              secondaryResidenceAccomodationEvolution: -10,
              housingNeeds: 200,
              surplusHousing: 0,
              vacantAccomodation: -82,
              shortTermVacantAccomodation: -20,
              longTermVacantAccomodation: -62,
            },
            metadata: { max: 2041, min: 2021 },
          },
          {
            code: '200000002',
            data: { peakYear: 2031, parcEvolution: {}, housingNeeds: {}, surplusHousing: {} },
            totals: {
              demographicEvolution: 80,
              renewalNeeds: 30,
              secondaryResidenceAccomodationEvolution: -5,
              housingNeeds: 150,
              surplusHousing: 0,
              vacantAccomodation: -15,
              shortTermVacantAccomodation: -5,
              longTermVacantAccomodation: -10,
            },
            metadata: { max: 2041, min: 2021 },
          },
        ],
      })

      sitadelService.calculate.mockResolvedValue({ epcis: [] } as any)

      const simulation = makeSimulation({
        epcis: [
          { code: '200000001', name: 'EPCI A', bassinName: null },
          { code: '200000002', name: 'EPCI B', bassinName: null },
        ],
        scenario: makeScenario({
          epciScenarios: [makeEpciScenario({ epciCode: '200000001' }), makeEpciScenario({ epciCode: '200000002' })],
        }),
      })

      const result = await service.calculate(simulation)

      // Each EPCI should have its own value, not the accumulated sum
      expect(result.epcisTotals[0].vacantAccomodation).toBe(-62)
      expect(result.epcisTotals[0].secondaryAccommodation).toBe(-10)
      expect(result.epcisTotals[1].vacantAccomodation).toBe(-10)
      expect(result.epcisTotals[1].secondaryAccommodation).toBe(-5)

      // Global totals should be the sum of all per-EPCI values
      expect(result.vacantAccomodation).toBe(-72)
      expect(result.secondaryAccommodation).toBe(-15)
    })

    it('should judge secondary residences on their own sign, not on the vacancy sign', async () => {
      stockService.calculateStock.mockResolvedValue(makeStockRequirementsResults('200000001'))
      stockService.calculateProrataStockByEpci.mockReturnValue({
        total: 200,
        prePeakTotal: 150,
        postPeakTotal: 50,
      })

      flowService.calculate.mockResolvedValue({
        epcis: [
          {
            code: '200000001',
            data: { peakYear: 2031, parcEvolution: {}, housingNeeds: {}, surplusHousing: {} },
            totals: {
              demographicEvolution: 100,
              renewalNeeds: 50,
              // Résidences secondaires en hausse : aucun logement n'est libéré de ce côté...
              secondaryResidenceAccomodationEvolution: 40,
              housingNeeds: 200,
              surplusHousing: 0,
              vacantAccomodation: -82,
              shortTermVacantAccomodation: -20,
              // ... quand bien même la vacance longue, elle, se résorbe.
              longTermVacantAccomodation: -62,
            },
            metadata: { max: 2041, min: 2021 },
          },
        ],
      })

      sitadelService.calculate.mockResolvedValue({ epcis: [] } as any)

      const result = await service.calculate(makeSimulation())

      expect(result.epcisTotals[0].vacantAccomodation).toBe(-62)
      expect(result.epcisTotals[0].secondaryAccommodation).toBe(0)
      expect(result.secondaryAccommodation).toBe(0)
    })

    it('should keep the total equal to the flux and stock of the EPCIs it retains', async () => {
      stockService.calculateStock.mockResolvedValue(makeStockRequirementsResults('200000001'))
      stockService.calculateProrataStockByEpci.mockReturnValue({
        total: 200,
        prePeakTotal: 150,
        postPeakTotal: 50,
      })

      flowService.calculate.mockResolvedValue({
        epcis: [
          {
            code: '200000001',
            data: { peakYear: 2031, parcEvolution: {}, housingNeeds: {}, surplusHousing: {} },
            totals: {
              demographicEvolution: 100,
              renewalNeeds: 50,
              secondaryResidenceAccomodationEvolution: -10,
              housingNeeds: 200,
              surplusHousing: 0,
              vacantAccomodation: -82,
              shortTermVacantAccomodation: -20,
              longTermVacantAccomodation: -62,
            },
            metadata: { max: 2041, min: 2021 },
          },
          {
            // Flux très négatif : l'EPCI n'a aucun besoin de constructions neuves, il est écarté.
            code: '200000002',
            data: { peakYear: 2031, parcEvolution: {}, housingNeeds: {}, surplusHousing: {} },
            totals: {
              demographicEvolution: -500,
              renewalNeeds: 0,
              secondaryResidenceAccomodationEvolution: 0,
              housingNeeds: 0,
              surplusHousing: 0,
              vacantAccomodation: 0,
              shortTermVacantAccomodation: 0,
              longTermVacantAccomodation: 0,
            },
            metadata: { max: 2041, min: 2021 },
          },
        ],
      })

      sitadelService.calculate.mockResolvedValue({ epcis: [] } as any)

      const simulation = makeSimulation({
        epcis: [
          { code: '200000001', name: 'EPCI A', bassinName: null },
          { code: '200000002', name: 'EPCI B', bassinName: null },
        ],
        scenario: makeScenario({
          epciScenarios: [makeEpciScenario({ epciCode: '200000001' }), makeEpciScenario({ epciCode: '200000002' })],
        }),
      })

      const result = await service.calculate(simulation)

      // `totalStock` accumule les deux EPCI ; `total` et `totalFlux`, eux, ne comptent que le premier.
      expect(result.totalStock).toBe(300)

      const retainedStock = result.epcisTotals.filter((epci) => epci.total > 0).reduce((sum, epci) => sum + epci.prepeakTotalStock, 0)
      expect(retainedStock).toBe(150)
      expect(result.total).toBe(result.totalFlux + retainedStock)
    })
  })
})
