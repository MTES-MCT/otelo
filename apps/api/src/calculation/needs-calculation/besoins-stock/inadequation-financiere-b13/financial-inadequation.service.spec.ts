import { createMock } from '@golevelup/ts-jest'
import { Test, TestingModule } from '@nestjs/testing'
import { CalculationContext } from '~/calculation/needs-calculation/base-calculator'
import { BadQualityService } from '~/calculation/needs-calculation/besoins-stock/mauvaise-qualite-b14/bad-quality.service'
import { RatioCalculationService } from '~/calculation/ratio-calculation/ratio-calculation.service'
import { PrismaService } from '~/db/prisma.service'
import { FinancialInadequationService } from './financial-inadequation.service'

describe('FinancialInadequationService', () => {
  let service: FinancialInadequationService
  const mockRatioCalculationService = createMock<RatioCalculationService>()
  const mockBadQualityService = createMock<BadQualityService>()
  const mockCalculationContext = createMock<CalculationContext>()

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FinancialInadequationService,
        {
          provide: 'CalculationContext',
          useValue: mockCalculationContext,
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
          useValue: mockBadQualityService,
        },
      ],
    }).compile()

    service = module.get<FinancialInadequationService>(FinancialInadequationService)
  })

  it('should be defined', () => {
    expect(service).toBeDefined()
  })
})
