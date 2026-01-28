import { createMock } from '@golevelup/ts-jest'
import { Test, TestingModule } from '@nestjs/testing'
import { CalculationContext } from '~/calculation/needs-calculation/base-calculator'
import { PrismaService } from '~/db/prisma.service'
import { BadQualityService } from './bad-quality.service'

describe('BadQualityService', () => {
  let service: BadQualityService
  let mockContext: CalculationContext

  // const mockData = {
  //   b11: {} as unknown,
  //   b12: {} as unknown,
  //   b13: {} as unknown,
  //   b14: {
  //     mv_quali: {
  //       rp: {
  //         sani_loc_nonHLM: 100,
  //         sani_ppT: 200,
  //         sani_chfl_loc_nonHLM: 150,
  //         sani_chfl_ppT: 250,
  //       },
  //       filocom: {
  //         pppi_lp: 300,
  //         pppi_po: 400,
  //       },
  //       ff: {
  //         pp_ss_wc_loc: 500,
  //         pp_ss_wc_ppt: 600,
  //         pp_ss_ent_wc_loc: 700,
  //         pp_ss_ent_wc_ppt: 800,
  //         pp_ss_quali_ent_wc_loc: 900,
  //         pp_ss_quali_ent_wc_ppt: 1000,
  //         pp_ss_3elts_loc: 1100,
  //         pp_ss_3elts_ppt: 1200,
  //       },
  //     },
  //   },
  //   b15: {} as unknown,
  //   b16: {} as unknown,
  //   b17: {} as unknown,
  //   b21: {} as unknown,
  //   b22: {} as unknown,
  // } as TData;

  beforeEach(async () => {
    mockContext = createMock<CalculationContext>({
      coefficient: 1,
      simulation: {
        scenario: {
          b14_confort: 'RP_abs_sani',
          b14_occupation: 'loc',
          b14_qualite: 'FF_Ind',
          b14_taux_reallocation: 10,
          source_b14: 'RP',
        },
      },
    })

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BadQualityService,
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

    service = module.get<BadQualityService>(BadQualityService)
  })

  it('should be defined', () => {
    expect(service).toBeDefined()
  })

  // describe('RP source calculations', () => {
  //   it('should calculate for RP_abs_sani with locataire only', () => {
  //     mockContext.simulation.scenario = {
  //       ...mockContext.simulation.scenario,
  //       source_b14: 'RP',
  //       b14_confort: 'RP_abs_sani',
  //       b14_occupation: 'loc',
  //       b14_taux_reallocation: 10,
  //     };

  //     const result = service.calculate();
  //     expect(result).toBe(90);
  //   });

  //   it('should calculate for RP_abs_sani with proprietaire only', () => {
  //     mockContext.simulation.scenario = {
  //       ...mockContext.simulation.scenario,
  //       source_b14: 'RP',
  //       b14_confort: 'RP_abs_sani',
  //       b14_occupation: 'prop',
  //       b14_taux_reallocation: 10,
  //     };

  //     const result = service.calculate();
  //     expect(result).toBe(180);
  //   });

  //   it('should calculate for RP_abs_sani_chfl with both loc and prop', () => {
  //     mockContext.simulation.scenario = {
  //       ...mockContext.simulation.scenario,
  //       source_b14: 'RP',
  //       b14_confort: 'RP_abs_sani_chfl',
  //       b14_occupation: 'loc,prop',
  //       b14_taux_reallocation: 10,
  //     };

  //     const result = service.calculate();
  //     expect(result).toBe(360);
  //   });
  // });

  // describe('Filo source calculations', () => {
  //   it('should calculate for locataire only', () => {
  //     mockContext.simulation.scenario = {
  //       ...mockContext.simulation.scenario,
  //       source_b14: 'Filo',
  //       b14_occupation: 'loc',
  //       b14_taux_reallocation: 20,
  //     };

  //     const result = service.calculate();
  //     expect(result).toBe(240);
  //   });

  //   it('should calculate for both loc and prop', () => {
  //     mockContext.simulation.scenario = {
  //       ...mockContext.simulation.scenario,
  //       source_b14: 'Filo',
  //       b14_occupation: 'loc,prop',
  //       b14_taux_reallocation: 20,
  //     };

  //     const result = service.calculate();
  //     expect(result).toBe(560);
  //   });
  // });

  // describe('FF source calculations', () => {
  //   it('should calculate for FF_Ind with FF_abs_wc', () => {
  //     mockContext.simulation.scenario = {
  //       ...mockContext.simulation.scenario,
  //       source_b14: 'FF',
  //       b14_qualite: 'FF_Ind',
  //       b14_confort: 'FF_abs_wc',
  //       b14_occupation: 'loc',
  //       b14_taux_reallocation: 15,
  //     };

  //     const result = service.calculate();
  //     expect(result).toBe(425);
  //   });

  //   it('should calculate for FF_ss_ent with FF_abs_wc_sani_chauf', () => {
  //     mockContext.simulation.scenario = {
  //       ...mockContext.simulation.scenario,
  //       source_b14: 'FF',
  //       b14_qualite: 'FF_ss_ent',
  //       b14_confort: 'FF_abs_wc_sani_chauf',
  //       b14_occupation: 'loc,prop',
  //       b14_taux_reallocation: 15,
  //     };

  //     const result = service.calculate();
  //     expect(result).toBe(0);
  //   });
  // });

  // describe('Edge cases', () => {
  //   it('should return 0 for invalid source', () => {
  //     mockContext.simulation.scenario = {
  //       ...mockContext.simulation.scenario,
  //       source_b14: 'INVALID' as any,
  //       b14_taux_reallocation: 10,
  //     };

  //     const result = service.calculate();
  //     expect(result).toBe(0);
  //   });

  //   it('should apply coefficient correctly', () => {
  //     mockContext.simulation.scenario = {
  //       ...mockContext.simulation.scenario,
  //       source_b14: 'Filo',
  //       b14_occupation: 'loc',
  //       b14_taux_reallocation: 10,
  //     };
  //     mockContext.coefficient = 1.5;

  //     const result = service.calculate();
  //     expect(result).toBe(405);
  //   });
  // });
})
