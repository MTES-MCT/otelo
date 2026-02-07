import { createMock } from '@golevelup/ts-jest'
import { Test, TestingModule } from '@nestjs/testing'
import { CalculationContext } from '~/calculation/needs-calculation/base-calculator'
import { DemographicEvolutionService } from '~/calculation/needs-calculation/besoins-flux/evolution-demographique-b21/demographic-evolution.service'
import { RenewalHousingStockService } from '~/calculation/needs-calculation/besoins-flux/occupation-renouvellement-parc-logements-b22/renewal-housing-stock.service'
import { DemographicEvolutionCustomService } from '~/demographic-evolution-custom/demographic-evolution-custom.service'
import { StockRequirementsService } from '~/stock-requirements/stock-requirements.service'
import { FlowRequirementService } from './flow-requirement.service'

describe('FlowRequirementService', () => {
  let service: FlowRequirementService

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FlowRequirementService,
        { provide: 'CalculationContext', useValue: createMock<CalculationContext>() },
        { provide: RenewalHousingStockService, useValue: createMock<RenewalHousingStockService>() },
        { provide: DemographicEvolutionService, useValue: createMock<DemographicEvolutionService>() },
        { provide: DemographicEvolutionCustomService, useValue: createMock<DemographicEvolutionCustomService>() },
        { provide: StockRequirementsService, useValue: createMock<StockRequirementsService>() },
      ],
    }).compile()

    service = module.get<FlowRequirementService>(FlowRequirementService)
  })

  it('should be defined', () => {
    expect(service).toBeDefined()
  })
})
