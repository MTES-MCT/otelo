import { createMock, DeepMocked } from '@golevelup/ts-jest'
import { Test, TestingModule } from '@nestjs/testing'
import { PrismaService } from '~/db/prisma.service'
import { DemographicEvolutionService } from './demographic-evolution.service'

describe('DemographicEvolutionService', () => {
  let service: DemographicEvolutionService
  let prisma: DeepMocked<PrismaService>

  beforeEach(async () => {
    prisma = createMock<PrismaService>()
    const module: TestingModule = await Test.createTestingModule({
      providers: [DemographicEvolutionService, { provide: PrismaService, useValue: prisma }],
    }).compile()

    service = module.get<DemographicEvolutionService>(DemographicEvolutionService)
  })

  it('should be defined', () => {
    expect(service).toBeDefined()
  })

  describe('getDemographicEvolutionPopulationByEpci with a missing scenario', () => {
    it('preserves null (basse absent) and excludes it from metadata min/max', async () => {
      // EPCI sans projection « basse » : les lignes de projection ont basse = null.
      prisma.$queryRaw = jest.fn().mockResolvedValue([
        { epci_code: '200071819', year: 2022, central: 15184, haute: 15184, basse: null },
        { epci_code: '200071819', year: 2030, central: 14668, haute: 15005, basse: null },
        { epci_code: '200071819', year: 2050, central: 13601, haute: 15086, basse: null },
      ]) as never

      const result = await service.getDemographicEvolutionPopulationByEpci('200071819', '2022')

      // La valeur basse reste null (l'UI la détecte comme indisponible).
      expect(result['200071819'].data.every((d) => d.basse === null)).toBe(true)
      // Les null ne corrompent pas les bornes (min ≠ 0), calculées sur central/haute.
      expect(result['200071819'].metadata.min).toBe(13601)
      expect(result['200071819'].metadata.max).toBe(15184)
    })
  })
})
