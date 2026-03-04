import { createMock } from '@golevelup/ts-jest'
import { Test, TestingModule } from '@nestjs/testing'
import { PrismaService } from '~/db/prisma.service'
import { VacancyService } from '~/vacancy/vacancy.service'
import { AccommodationRatesService } from './accommodation-rates.service'

describe('AccommodationRatesService', () => {
  let service: AccommodationRatesService
  const mockPrismaService = createMock<PrismaService>()
  const mockVacancyService = createMock<VacancyService>()
  const epciCode = '200000001'

  beforeEach(async () => {
    jest.clearAllMocks()

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AccommodationRatesService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: VacancyService,
          useValue: mockVacancyService,
        },
      ],
    }).compile()

    service = module.get<AccommodationRatesService>(AccommodationRatesService)
    mockVacancyService.getNewestVacancy.mockResolvedValue([
      {
        epciCode,
        nbLogVac2Less: 1000,
        nbLogVac2More: 400,
        nbLogVac5More: 200,
        year: 2024,
      } as any,
    ])
  })

  it('should be defined', () => {
    expect(service).toBeDefined()
  })

  it('should keep /6 annualization for 2021', async () => {
    mockPrismaService.filocomFlux.findMany.mockResolvedValue([
      {
        epciCode,
        millesime: '2021',
        txLvParctot: 0.12,
        txRsParctot: 0.08,
        txRestParctot: 0.018,
        txDispParctot: 0.03,
        parctot: 10000,
      } as any,
    ])

    const result = await service.getAccommodationRates(epciCode, '2021')

    expect(result[epciCode].restructuringRate).toBeCloseTo(0.003)
    expect(result[epciCode].disappearanceRate).toBeCloseTo(0.005)
    expect(mockPrismaService.filocomFlux.findMany).toHaveBeenCalledWith({
      where: {
        epciCode: { in: [epciCode] },
        millesime: '2021',
      },
    })
  })

  it('should not apply /6 for 2022', async () => {
    mockPrismaService.filocomFlux.findMany.mockResolvedValue([
      {
        epciCode,
        millesime: '2022',
        txLvParctot: 0.12,
        txRsParctot: 0.08,
        txRestParctot: 0.018,
        txDispParctot: 0.03,
        parctot: 10000,
      } as any,
    ])

    const result = await service.getAccommodationRates(epciCode, '2022')

    expect(result[epciCode].restructuringRate).toBeCloseTo(0.018)
    expect(result[epciCode].disappearanceRate).toBeCloseTo(0.03)
    expect(mockPrismaService.filocomFlux.findMany).toHaveBeenCalledWith({
      where: {
        epciCode: { in: [epciCode] },
        millesime: '2022',
      },
    })
  })
})
