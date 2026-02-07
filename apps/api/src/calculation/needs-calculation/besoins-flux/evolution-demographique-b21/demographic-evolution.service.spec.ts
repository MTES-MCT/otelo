import { createMock } from '@golevelup/ts-jest'
import { Test, TestingModule } from '@nestjs/testing'
import { CalculationContext } from '~/calculation/needs-calculation/base-calculator'
import { PrismaService } from '~/db/prisma.service'
import { DemographicEvolutionService } from './demographic-evolution.service'

describe('DemographicEvolutionService - Calculation', () => {
  let service: DemographicEvolutionService
  let mockContext: CalculationContext

  beforeEach(async () => {
    mockContext = {
      simulation: {
        coefficient: 1.0,
        epci: {
          code: '123456',
        },
        scenario: {
          b2_scenario_omphale: 'CENTRAL',
        },
      },
    } as unknown as CalculationContext

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DemographicEvolutionService,
        {
          provide: 'CalculationContext',
          useValue: mockContext,
        },
        {
          provide: PrismaService,
          useValue: createMock<PrismaService>(),
        },
      ],
    }).compile()

    service = module.get<DemographicEvolutionService>(DemographicEvolutionService)
  })

  it('should be defined', () => {
    expect(service).toBeDefined()
  })
})
