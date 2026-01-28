import { createMock } from '@golevelup/ts-jest'
import { Test, TestingModule } from '@nestjs/testing'
import { CalculationContext } from '~/calculation/needs-calculation/base-calculator'
import { DemographicEvolutionService } from '~/calculation/needs-calculation/besoins-flux/evolution-demographique-b21/demographic-evolution.service'
import { RenewalHousingStockService } from '~/calculation/needs-calculation/besoins-flux/occupation-renouvellement-parc-logements-b22/renewal-housing-stock.service'
import { PrismaService } from '~/db/prisma.service'
import { VacancyService } from '~/vacancy/vacancy.service'

describe('RenewalHousingStock', () => {
  let service: RenewalHousingStockService
  let mockCalculationContext: jest.Mocked<CalculationContext>
  let mockEvolutionDemographiqueService: jest.Mocked<DemographicEvolutionService>
  const mockPrismaService = createMock<PrismaService>()
  const mockVacancyService = createMock<VacancyService>()

  beforeEach(async () => {
    mockCalculationContext = createMock<CalculationContext>({
      simulation: {
        epci: {
          code: '01',
        },
        scenario: {
          b2_tx_disparition: 1,
          b2_tx_restructuration: 1,
          b2_tx_rs: 1,
          b2_tx_vacance: 1,
          b2_tx_vacance_longue: 1,
        },
      },
    })

    mockEvolutionDemographiqueService = createMock<DemographicEvolutionService>({
      calculate: jest.fn().mockReturnValue(100),
    })

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RenewalHousingStockService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: VacancyService,
          useValue: mockVacancyService,
        },
        {
          provide: 'CalculationContext',
          useValue: mockCalculationContext,
        },
        {
          provide: DemographicEvolutionService,
          useValue: mockEvolutionDemographiqueService,
        },
      ],
    }).compile()

    service = module.get<RenewalHousingStockService>(RenewalHousingStockService)
  })

  it('should be defined', () => {
    expect(service).toBeDefined()
  })

  // describe('calculate', () => {
  //   it('should calculate the difference between potential demand and b21', () => {
  //     const result = service.calculate();
  //     expect(mockEvolutionDemographiqueService.calculate).toHaveBeenCalled();
  //     expect(result).toBeDefined();
  //     expect(typeof result).toBe('number');
  //   });
  // });

  // describe('getPotentielleDemande', () => {
  //   it('should calculate potential demand based on input parameters', () => {
  //     const b21 = 100;
  //     const result = service.getPotentialNeeds(b21);
  //     expect(result).toBeDefined();
  //     expect(typeof result).toBe('number');
  //   });

  //   it('should handle zero values correctly', () => {
  //     const zeroData = {
  //       b22: {
  //         evol_parc: {
  //           filocom: {
  //             parctot: 0,
  //             txrp_parctot: 0,
  //             txlv_parctot: 0,
  //             txrs_parctot: 0,
  //             txrest_parctot: 0,
  //             txdisp_parctot: 0,
  //           },
  //         },
  //       },
  //     } as TData;

  //     const result = service.getPotentialNeeds(0);
  //     expect(result).toBeDefined();
  //     expect(typeof result).toBe('number');
  //   });
  // });

  // describe('Region-specific calculations', () => {
  //   it('should use coefficient 4.0 for regions 01-04', () => {
  //     mockCalculationContext.simulation.epci.code = '01';
  //     const result = service.calculate();
  //     expect(result).toBeDefined();
  //   });

  //   it('should use coefficient 6.0 for other regions', () => {
  //     mockCalculationContext.simulation.epci.code = '05';
  //     const result = service.calculate();
  //     expect(result).toBeDefined();
  //   });
  // });

  // describe('Scenario impact', () => {
  //   it('should consider scenario parameters in calculations', () => {
  //     const customScenario = {
  //       b2_tx_vacance: 2,
  //       b2_tx_rs: 2,
  //       b2_tx_restructuration: 2,
  //       b2_tx_disparition: 2,
  //     } as unknown as TScenario;

  //     mockCalculationContext.simulation.scenario = customScenario;
  //     const result = service.calculate();
  //     expect(result).toBeDefined();
  //   });

  //   it('should handle negative scenario values', () => {
  //     const negativeScenario = {
  //       b2_tx_vacance: -1,
  //       b2_tx_rs: -1,
  //       b2_tx_restructuration: -1,
  //       b2_tx_disparition: -1,
  //     } as TScenario;

  //     mockCalculationContext.simulation.scenario = negativeScenario;
  //     const result = service.calculate();
  //     expect(result).toBeDefined();
  //   });
  // });

  // describe('Edge cases', () => {
  //   it('should handle maximum values', () => {
  //     // const maxData = {
  //     //   b22: {
  //     //     evol_parc: {
  //     //       filocom: {
  //     //         parctot: Number.MAX_SAFE_INTEGER,
  //     //         txrp_parctot: 1,
  //     //         txlv_parctot: 0,
  //     //         txrs_parctot: 0,
  //     //         txrest_parctot: 0.5,
  //     //         txdisp_parctot: 0.5,
  //     //       },
  //     //     },
  //     //   },
  //     // } as TData;

  //     const result = service.calculate();
  //     expect(result).toBeDefined();
  //     expect(typeof result).toBe('number');
  //   });

  //   it('should handle decimal values correctly', () => {
  //     // const decimalData = {
  //     //   b22: {
  //     //     evol_parc: {
  //     //       filocom: {
  //     //         parctot: 1000.5,
  //     //         txrp_parctot: 0.923,
  //     //         txlv_parctot: 0.0456,
  //     //         txrs_parctot: 0.0314,
  //     //         txrest_parctot: 0.0234,
  //     //         txdisp_parctot: 0.0123,
  //     //       },
  //     //     },
  //     //   },
  //     // } as TData;

  //     const result = service.calculate();
  //     expect(result).toBeDefined();
  //     expect(Number.isInteger(result)).toBeTruthy();
  //   });
  // });
})
