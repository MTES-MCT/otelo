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

    // biome-ignore lint/suspicious/noExplicitAny: TODO
    jest.spyOn(service as any, 'applyCoefficient').mockImplementation((value) => value)
  })

  it('should be defined', () => {
    expect(service).toBeDefined()
  })

  // describe('calculate', () => {
  //   it('should calculate demographic evolution correctly for CENTRAL scenario', () => {
  //     const result = service.calculate();
  //     expect(result).toBe(500);
  //   });

  //   it('should apply coefficient correctly', () => {
  //     mockContext.coefficient = 0.5;

  //     const result = service.calculate();
  //     expect(result).toBe(500);
  //   });

  //   it('should handle different scenarios (HAUT scenario)', () => {
  //     mockContext.simulation.scenario.b2_scenario_omphale = 'HAUT';

  //     const result = service.calculate();
  //     expect(result).toBe(1000);
  //   });

  //   it('should handle negative evolution', () => {
  //     const result = service.calculate();
  //     expect(result).toBe(-500);
  //   });

  //   it('should handle zero evolution', () => {
  //     const result = service.calculate();
  //     expect(result).toBe(0);
  //   });
  // });
})
