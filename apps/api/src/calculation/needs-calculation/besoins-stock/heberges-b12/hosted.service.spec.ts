import { createMock } from '@golevelup/ts-jest'
import { Test, TestingModule } from '@nestjs/testing'
import { CalculationContext } from '~/calculation/needs-calculation/base-calculator'
import { PrismaService } from '~/db/prisma.service'
import { TScenario } from '~/schemas/scenarios/scenario'
import { HostedService } from './hosted.service'

describe('HostedService', () => {
  let service: HostedService
  let calculationContext: CalculationContext

  beforeEach(async () => {
    calculationContext = {
      coefficient: 1,
      periodProjection: 2024,
      simulation: {
        epci: {
          code: '123456',
        },
        scenario: {
          b12_cohab_interg_subie: 50,
          b12_heberg_gratuit: false,
          b12_heberg_particulier: false,
          b12_heberg_temporaire: false,
        } as TScenario,
        createdAt: new Date(),
        updatedAt: new Date(),
        id: '123456',
        epcis: [],
      },
    } as CalculationContext

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        HostedService,
        {
          provide: 'CalculationContext',
          useValue: calculationContext,
        },
        {
          provide: PrismaService,
          useValue: createMock<PrismaService>(),
        },
      ],
    }).compile()

    service = module.get<HostedService>(HostedService)
    // biome-ignore lint/suspicious/noExplicitAny: TODO
    jest.spyOn(service as any, 'applyCoefficient').mockImplementation((value) => value)
  })

  it('should be defined', () => {
    expect(service).toBeDefined()
  })

  // describe('calculate', () => {
  //   const mockData: TData = {
  //     b12: {
  //       cohab_interg: {
  //         filocom: 100,
  //       },
  //       cohab_hors_interg: {
  //         sne: {
  //           particulier: 100,
  //           gratuit: 100,
  //           temp: 100,
  //         },
  //       },
  //     },
  //   } as TData;

  //   it('should calculate with only cohab_interg_subie enabled', () => {
  //     calculationContext.simulation.scenario = {
  //       b12_cohab_interg_subie: 50,
  //       b12_heberg_particulier: false,
  //       b12_heberg_gratuit: false,
  //       b12_heberg_temporaire: false,
  //     } as TScenario;

  //     const result = service.calculate();
  //     expect(result).toBe(50);
  //   });

  //   it('should calculate with all options enabled', () => {
  //     calculationContext.simulation.scenario = {
  //       b12_cohab_interg_subie: 100,
  //       b12_heberg_particulier: true,
  //       b12_heberg_gratuit: true,
  //       b12_heberg_temporaire: true,
  //     } as TScenario;

  //     const result = service.calculate();
  //     expect(result).toBe(400);
  //   });

  //   it('should calculate with partial options enabled', () => {
  //     calculationContext.simulation.scenario = {
  //       b12_cohab_interg_subie: 50,
  //       b12_heberg_particulier: true,
  //       b12_heberg_gratuit: false,
  //       b12_heberg_temporaire: true,
  //     } as TScenario;

  //     const result = service.calculate();
  //     expect(result).toBe(250);
  //   });
  // });
})
