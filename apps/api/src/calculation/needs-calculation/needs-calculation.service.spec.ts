import { createMock } from '@golevelup/ts-jest'
import { Test, TestingModule } from '@nestjs/testing'
import { FlowRequirementService } from '~/calculation/needs-calculation/besoins-flux/flow-requirement.service'
import { SitadelService } from '~/calculation/needs-calculation/sitadel/sitadel.service'
import { StockRequirementsService } from '~/stock-requirements/stock-requirements.service'
import { NeedsCalculationService } from './needs-calculation.service'

describe('NeedsCalculationService', () => {
  let service: NeedsCalculationService

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NeedsCalculationService,
        { provide: FlowRequirementService, useValue: createMock<FlowRequirementService>() },
        { provide: StockRequirementsService, useValue: createMock<StockRequirementsService>() },
        { provide: SitadelService, useValue: createMock<SitadelService>() },
      ],
    }).compile()

    service = module.get<NeedsCalculationService>(NeedsCalculationService)
  })

  it('should be defined', () => {
    expect(service).toBeDefined()
  })
})
