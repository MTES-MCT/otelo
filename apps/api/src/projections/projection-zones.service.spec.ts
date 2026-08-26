import { createMock, type DeepMocked } from '@golevelup/ts-jest'
import { NotFoundException } from '@nestjs/common'
import { Test, type TestingModule } from '@nestjs/testing'
import { DataPackVersionsService } from '~/data-pack-versions/data-pack-versions.service'
import { PrismaService } from '~/db/prisma.service'
import { ProjectionZonesService } from './projection-zones.service'

type ZoneRow = {
  code: string
  level: string
  label: string
  epciCode: string | null
  bassinName: string | null
  millesimes: { isRobust: boolean; firstYear: number; lastYear: number }[]
}

function zone(overrides: Partial<ZoneRow> & Pick<ZoneRow, 'code'>): ZoneRow {
  return {
    level: 'BH',
    label: overrides.code,
    epciCode: null,
    bassinName: null,
    millesimes: [{ isRobust: true, firstYear: 2018, lastYear: 2050 }],
    ...overrides,
  }
}

describe('ProjectionZonesService', () => {
  let service: ProjectionZonesService
  let prisma: DeepMocked<PrismaService>
  let dataPackVersions: DeepMocked<DataPackVersionsService>

  beforeEach(async () => {
    prisma = createMock<PrismaService>()
    dataPackVersions = createMock<DataPackVersionsService>()
    dataPackVersions.getActive.mockResolvedValue({
      millesime: '2022',
      label: 'Millésime 2022',
      isActive: true,
      createdAt: new Date(),
    })

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProjectionZonesService,
        { provide: PrismaService, useValue: prisma },
        { provide: DataPackVersionsService, useValue: dataPackVersions },
      ],
    }).compile()

    service = module.get(ProjectionZonesService)
  })

  it('should be defined', () => {
    expect(service).toBeDefined()
  })

  describe('resolveMillesime', () => {
    it('retombe sur le millésime actif quand aucun n’est demandé', async () => {
      await expect(service.resolveMillesime()).resolves.toBe('2022')
    })

    it('respecte le millésime demandé', async () => {
      await expect(service.resolveMillesime('2021')).resolves.toBe('2021')
      expect(dataPackVersions.getActive).not.toHaveBeenCalled()
    })
  })

  describe('resolveForEpcis', () => {
    it('rend la zone EPCI et celle du bassin pour un EPCI d’au moins 50 000 habitants', async () => {
      prisma.epci.findMany.mockResolvedValue([{ code: '200006682', bassinName: 'BEAUNE' }] as never)
      prisma.projectionZone.findMany.mockResolvedValue([
        zone({ code: '200006682', level: 'EPCI', epciCode: '200006682' }),
        zone({ code: 'R27_21_23', bassinName: 'BEAUNE' }),
      ] as never)

      const [result] = await service.resolveForEpcis(['200006682'])

      expect(result.epciZone?.code).toBe('200006682')
      expect(result.bassinZones.map((entry) => entry.code)).toEqual(['R27_21_23'])
    })

    it('ne rend aucune zone EPCI en dessous du seuil de robustesse Omphale', async () => {
      // Les EPCI de moins de 50 000 habitants ne sont pas projetés à leur niveau : seul le bassin
      // les couvre. C'est le cas le plus fréquent (1 047 EPCI sur 1 261).
      prisma.epci.findMany.mockResolvedValue([{ code: '200035970', bassinName: 'CERGY - VEXIN' }] as never)
      prisma.projectionZone.findMany.mockResolvedValue([
        zone({ code: 'R11_01_23', bassinName: 'CERGY - VEXIN', label: 'CERGY - VEXIN' }),
      ] as never)

      const [result] = await service.resolveForEpcis(['200035970'])

      expect(result.epciZone).toBeNull()
      expect(result.bassinZones).toHaveLength(1)
    })

    it('rend les 12 territoires du Grand Paris et signale ceux qui ne sont pas projetés', async () => {
      // Le bassin « PARIS MÉTROPOLE » porte 12 zones, dont deux sans projection. Un appelant qui
      // les additionnerait sans regarder isRobust amputerait la métropole de 16 % au-delà de 2018.
      prisma.epci.findMany.mockResolvedValue([{ code: '200054781_T1', bassinName: 'PARIS MÉTROPOLE' }] as never)
      prisma.projectionZone.findMany.mockResolvedValue([
        zone({ code: 'Paris_23', bassinName: 'PARIS MÉTROPOLE', epciCode: '200054781_T1' }),
        zone({
          code: 'R11_GOSB_23',
          bassinName: 'PARIS MÉTROPOLE',
          epciCode: '200054781_T12',
          millesimes: [{ isRobust: false, firstYear: 2018, lastYear: 2018 }],
        }),
      ] as never)

      const [result] = await service.resolveForEpcis(['200054781_T1'])

      expect(result.epciZone).toBeNull()
      expect(result.bassinZones).toHaveLength(2)
      expect(result.bassinZones.filter((entry) => !entry.isRobust).map((entry) => entry.code)).toEqual(['R11_GOSB_23'])
    })

    it('rend une entrée vide pour un EPCI sans bassin ni projection', async () => {
      prisma.epci.findMany.mockResolvedValue([] as never)
      prisma.projectionZone.findMany.mockResolvedValue([] as never)

      expect(await service.resolveForEpcis(['999999999'])).toEqual([{ epciCode: '999999999', epciZone: null, bassinZones: [] }])
    })
  })

  describe('requireZones', () => {
    it('lève sur un code inconnu plutôt que de rendre une réponse partielle', async () => {
      prisma.projectionZone.findMany.mockResolvedValue([zone({ code: 'R11_01_23' })] as never)

      await expect(service.requireZones(['R11_01_23', 'INEXISTANT'])).rejects.toThrow(NotFoundException)
      await expect(service.requireZones(['R11_01_23', 'INEXISTANT'])).rejects.toThrow('INEXISTANT')
    })

    it('lève quand une zone ne relève pas du niveau annoncé', async () => {
      prisma.projectionZone.findMany.mockResolvedValue([zone({ code: 'R11_01_23', level: 'BH' })] as never)

      await expect(service.requireZones(['R11_01_23'], 'EPCI')).rejects.toThrow(/hors du niveau EPCI/)
    })

    it('accepte des zones du bon niveau', async () => {
      prisma.projectionZone.findMany.mockResolvedValue([zone({ code: '200006682', level: 'EPCI', epciCode: '200006682' })] as never)

      const result = await service.requireZones(['200006682'], 'EPCI')
      expect(result.get('200006682')?.level).toBe('EPCI')
    })
  })
})
