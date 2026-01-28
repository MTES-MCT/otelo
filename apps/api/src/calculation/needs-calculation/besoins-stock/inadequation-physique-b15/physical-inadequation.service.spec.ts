// import { createMock } from '@golevelup/ts-jest';
// import { Test, TestingModule } from '@nestjs/testing';
// import { CalculationContext } from '~/calculation/needs-calculation/base-calculator';
// import { HebergesService } from '~/calculation/needs-calculation/besoins-stock/heberges-b12/heberges.service';
// import { InadequationFinanciereService } from '~/calculation/needs-calculation/besoins-stock/inadequation-financiere-b13/inadequation-financiere.service';
// import { MauvaiseQualiteService } from '~/calculation/needs-calculation/besoins-stock/mauvaise-qualite-b14/mauvaise-qualite.service';
// import { RatioCalculationService } from '~/calculation/ratio-calculation/ratio-calculation.service';
// import { TData } from '~/schemas/data/data';
// import { PhysicalInadequationService } from './inadequation-physique.service';

import { createMock } from '@golevelup/ts-jest'
import { Test, TestingModule } from '@nestjs/testing'
import { CalculationContext } from '~/calculation/needs-calculation/base-calculator'
import { HostedService } from '~/calculation/needs-calculation/besoins-stock/heberges-b12/hosted.service'
import { FinancialInadequationService } from '~/calculation/needs-calculation/besoins-stock/inadequation-financiere-b13/financial-inadequation.service'
import { PhysicalInadequationService } from '~/calculation/needs-calculation/besoins-stock/inadequation-physique-b15/physical-inadequation.service'
import { BadQualityService } from '~/calculation/needs-calculation/besoins-stock/mauvaise-qualite-b14/bad-quality.service'
import { RatioCalculationService } from '~/calculation/ratio-calculation/ratio-calculation.service'
import { PrismaService } from '~/db/prisma.service'

describe('PhysicalInadequationService', () => {
  let service: PhysicalInadequationService
  let mockContext: CalculationContext
  let mockRatioCalculationService: jest.Mocked<RatioCalculationService>
  let mockMauvaiseQualiteService: jest.Mocked<BadQualityService>
  let mockInadequationFinanciereService: jest.Mocked<FinancialInadequationService>
  let mockHebergesService: jest.Mocked<HostedService>

  beforeEach(async () => {
    mockContext = createMock<CalculationContext>({
      coefficient: 1,
      simulation: {
        scenario: {
          b14_occupation: 'loc',
          b15_surocc: 'Mod',
          b15_taux_reallocation: 10,
          source_b15: 'RP',
        },
      },
    })

    mockRatioCalculationService = createMock<RatioCalculationService>()
    mockMauvaiseQualiteService = createMock<BadQualityService>()
    mockInadequationFinanciereService = createMock<FinancialInadequationService>()
    mockHebergesService = createMock<HostedService>()

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PhysicalInadequationService,
        {
          provide: 'CalculationContext',
          useValue: mockContext,
        },
        {
          provide: PrismaService,
          useValue: createMock<PrismaService>(),
        },
        {
          provide: RatioCalculationService,
          useValue: mockRatioCalculationService,
        },
        {
          provide: BadQualityService,
          useValue: mockMauvaiseQualiteService,
        },
        {
          provide: FinancialInadequationService,
          useValue: mockInadequationFinanciereService,
        },
        {
          provide: HostedService,
          useValue: mockHebergesService,
        },
      ],
    }).compile()

    service = module.get<PhysicalInadequationService>(PhysicalInadequationService)
  })

  it('should be defined', () => {
    expect(service).toBeDefined()
  })

  //   describe('RP source calculations', () => {
  //     it('should calculate for locataire only', () => {
  //       mockContext.scenario = {
  //         ...mockContext.scenario,
  //         source_b15: 'RP',
  //         b14_occupation: 'loc',
  //         b15_taux_reallocation: 10,
  //       };

  //       const result = service.calculate(mockData);
  //       expect(result).toBe(90); // (100 * (1 - 10/100))
  //     });

  //     it('should calculate for proprietaire only', () => {
  //       mockContext.scenario = {
  //         ...mockContext.scenario,
  //         source_b15: 'RP',
  //         b14_occupation: 'prop',
  //         b15_taux_reallocation: 10,
  //       };

  //       const result = service.calculate(mockData);
  //       expect(result).toBe(180); // (200 * (1 - 10/100))
  //     });

  //     it('should calculate for both loc and prop', () => {
  //       mockContext.scenario = {
  //         ...mockContext.scenario,
  //         source_b15: 'RP',
  //         b14_occupation: 'loc,prop',
  //         b15_taux_reallocation: 10,
  //       };

  //       const result = service.calculate(mockData);
  //       expect(result).toBe(270); // ((100 + 200) * (1 - 10/100))
  //     });
  //   });

  //   describe('Filo source calculations', () => {
  //     it('should calculate for locataire only', () => {
  //       mockContext.scenario = {
  //         ...mockContext.scenario,
  //         source_b15: 'Filo',
  //         b14_occupation: 'loc',
  //         b15_taux_reallocation: 20,
  //       };

  //       const result = service.calculate(mockData);
  //       expect(result).toBe(240); // (300 * (1 - 20/100))
  //     });

  //     it('should calculate for both loc and prop', () => {
  //       mockContext.scenario = {
  //         ...mockContext.scenario,
  //         source_b15: 'Filo',
  //         b14_occupation: 'loc,prop',
  //         b15_taux_reallocation: 20,
  //       };

  //       const result = service.calculate(mockData);
  //       expect(result).toBe(560); // ((300 + 400) * (1 - 20/100))
  //     });
  //   });

  //   describe('Edge cases', () => {
  //     it('should return 0 for invalid source', () => {
  //       mockContext.scenario = {
  //         ...mockContext.scenario,
  //         source_b15: 'INVALID' as any,
  //         b15_taux_reallocation: 10,
  //       };

  //       const result = service.calculate(mockData);
  //       expect(result).toBe(0);
  //     });

  //     it('should apply coefficient correctly', () => {
  //       mockContext.scenario = {
  //         ...mockContext.scenario,
  //         source_b15: 'Filo',
  //         b14_occupation: 'loc',
  //         b15_taux_reallocation: 10,
  //       };
  //       mockContext.coefficient = 1.5;

  //       const result = service.calculate(mockData);
  //       expect(result).toBe(405); // (300 * (1 - 10/100) * 1.5)
  //     });
  //   });
})
