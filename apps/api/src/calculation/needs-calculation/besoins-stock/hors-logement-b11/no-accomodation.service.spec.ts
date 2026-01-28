import { createMock } from '@golevelup/ts-jest'
import { Test, TestingModule } from '@nestjs/testing'
import { PrismaService } from '~/db/prisma.service'
import { ESourceB11 } from '~/schemas/scenarios/scenario'
import { NoAccomodationService } from './no-accomodation.service'

describe('NoAccomodationService', () => {
  let service: NoAccomodationService

  const mockContext = {
    coefficient: 1,
    simulation: {
      scenario: {
        b11_etablissement: ['CHRS'],
        b11_fortune: true,
        b11_hotel: true,
        b11_part_etablissement: 50,
        b11_sa: true,
        source_b11: ESourceB11.RP,
      },
    },
  }

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NoAccomodationService,
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

    service = module.get<NoAccomodationService>(NoAccomodationService)
  })

  it('should be defined', () => {
    expect(service).toBeDefined()
  })

  // describe('calculate', () => {
  //   it('should calculate correctly using RP source', () => {
  //     const result = service.calculate();
  //     expect(result).toBe(600);
  //   });

  //   it('should calculate correctly using SNE source', async () => {
  //     const contextWithSNE = {
  //       ...mockContext,
  //       scenario: {
  //         ...mockContext.scenario,
  //         source_b11: ESourceB11.SNE,
  //       },
  //     };

  //     const sneService = (
  //       await Test.createTestingModule({
  //         providers: [
  //           NoAccomodationService,
  //           {
  //             provide: 'CalculationContext',
  //             useValue: contextWithSNE,
  //           },
  //         ],
  //       }).compile()
  //     ).get<NoAccomodationService>(NoAccomodationService);

  //     const result = sneService.calculate();
  //     expect(result).toBe(700);
  //   });

  //   it('should apply coefficient correctly', async () => {
  //     const contextWithCoefficient = {
  //       ...mockContext,
  //       coefficient: 1.5,
  //     };

  //     const coefficientService = (
  //       await Test.createTestingModule({
  //         providers: [
  //           NoAccomodationService,
  //           {
  //             provide: 'CalculationContext',
  //             useValue: contextWithCoefficient,
  //           },
  //         ],
  //       }).compile()
  //     ).get<NoAccomodationService>(NoAccomodationService);

  //     const result = coefficientService.calculate();
  //     expect(result).toBe(900);
  //   });

  //   it('should handle disabled categories', async () => {
  //     const contextWithDisabledCategories = {
  //       ...mockContext,
  //       scenario: {
  //         ...mockContext.scenario,
  //         b11_sa: false,
  //         b11_fortune: false,
  //         b11_hotel: true,
  //       },
  //     };

  //     const disabledService = (
  //       await Test.createTestingModule({
  //         providers: [
  //           NoAccomodationService,
  //           {
  //             provide: 'CalculationContext',
  //             useValue: contextWithDisabledCategories,
  //           },
  //         ],
  //       }).compile()
  //     ).get<NoAccomodationService>(NoAccomodationService);

  //     const result = disabledService.calculate();
  //     expect(result).toBe(300);
  //   });

  //   it('should handle empty establishment categories', async () => {
  //     const contextWithNoEstablishments = {
  //       ...mockContext,
  //       scenario: {
  //         ...mockContext.scenario,
  //         b11_etablissement: [],
  //       },
  //     };

  //     const emptyEstablishmentService = (
  //       await Test.createTestingModule({
  //         providers: [
  //           NoAccomodationService,
  //           {
  //             provide: 'CalculationContext',
  //             useValue: contextWithNoEstablishments,
  //           },
  //         ],
  //       }).compile()
  //     ).get<NoAccomodationService>(NoAccomodationService);

  //     const result = emptyEstablishmentService.calculate();
  //     expect(result).toBe(600);
  //   });
  // });
})
