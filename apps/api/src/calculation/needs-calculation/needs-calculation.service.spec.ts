import { createMock, DeepMocked } from '@golevelup/ts-jest'
import { Test, TestingModule } from '@nestjs/testing'
import { FlowRequirementService } from '~/calculation/needs-calculation/besoins-flux/flow-requirement.service'
import { SitadelService } from '~/calculation/needs-calculation/sitadel/sitadel.service'
import { StockRequirementsService } from '~/stock-requirements/stock-requirements.service'
import { makeScenario, makeSimulation, makeStockRequirementsResults } from './__test-utils__/calculation-test-fixtures'
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
  })
})
