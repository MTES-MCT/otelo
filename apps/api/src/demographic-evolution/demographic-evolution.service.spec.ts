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

  describe("agrégat 'all' du périmètre", () => {
    it('somme les EPCI et neutralise le scénario absent chez l un d eux', async () => {
      // Deux EPCI, dont le second sans projection « basse ».
      prisma.$queryRaw = jest.fn().mockResolvedValue([
        { epci_code: '200071819', year: 2022, central: 15184, haute: 15184, basse: 15184 },
        { epci_code: '200071819', year: 2030, central: 14668, haute: 15005, basse: 14000 },
        { epci_code: '200070001', year: 2022, central: 1000, haute: 1200, basse: null },
        { epci_code: '200070001', year: 2030, central: 900, haute: 1100, basse: null },
      ]) as never

      const result = await service.getDemographicEvolutionPopulationByEpci('200071819,200070001', '2022')

      // « basse » manque chez un EPCI : la sommer comme un zéro ferait « rétrécir » le territoire.
      expect(result.all.data.every((d) => d.basse === null)).toBe(true)
      expect(result.all.data.find((d) => d.year === 2030)?.central).toBe(15568)
      // Les null n'entrent pas dans les bornes : sinon l'axe des ordonnées partait de 0.
      expect(result.all.metadata.min).toBe(15568)
      expect(result.all.metadata.max).toBe(16384)
    })

    it('ne retient que les années communes à tous les EPCI', async () => {
      prisma.$queryRaw = jest.fn().mockResolvedValue([
        { epci_code: '200071819', year: 2022, central: 100, haute: 100, basse: 100 },
        { epci_code: '200071819', year: 2030, central: 100, haute: 100, basse: 100 },
        { epci_code: '200071819', year: 2050, central: 100, haute: 100, basse: 100 },
        { epci_code: '200070001', year: 2022, central: 10, haute: 10, basse: 10 },
        { epci_code: '200070001', year: 2030, central: 10, haute: 10, basse: 10 },
      ]) as never

      const result = await service.getDemographicEvolutionPopulationByEpci('200071819,200070001', '2022')

      expect(result.all.data.map((d) => d.year)).toEqual([2022, 2030])
    })

    it('agrège aussi la série des ménages', async () => {
      prisma.$queryRaw = jest.fn().mockResolvedValue([
        {
          epci_code: '200071819',
          year: 2022,
          centralB: 100,
          centralC: 200,
          centralH: 300,
          phB: 1,
          phC: 2,
          phH: 3,
          pbB: null,
          pbC: 5,
          pbH: 6,
        },
        { epci_code: '200070001', year: 2022, centralB: 10, centralC: 20, centralH: 30, phB: 1, phC: 2, phH: 3, pbB: 4, pbC: 5, pbH: 6 },
      ]) as never

      const result = await service.getDemographicEvolution('200071819,200070001', '2022')

      expect(result.all.data[0].centralC).toBe(220)
      expect(result.all.data[0].pbB).toBeNull()
      expect(result.all.data[0].pbC).toBe(10)
    })
  })
})
