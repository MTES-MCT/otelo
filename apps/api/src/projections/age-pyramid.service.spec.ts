import { createMock, DeepMocked } from '@golevelup/ts-jest'
import { Test, TestingModule } from '@nestjs/testing'
import { PrismaService } from '~/db/prisma.service'
import { AGE_COUNT } from '~/schemas/data-visualisation/age-pyramid'
import { type TProjectionZoneWithMillesime } from '~/schemas/projections/projections'
import { AgePyramidService, buildAgeSeries, pickZone } from './age-pyramid.service'
import { ProjectionZonesService } from './projection-zones.service'

const zone = (overrides: Partial<TProjectionZoneWithMillesime> = {}): TProjectionZoneWithMillesime => ({
  code: '200006682',
  level: 'EPCI',
  label: 'CA de Beaune',
  epciCode: '200006682',
  bassinName: null,
  isRobust: true,
  firstYear: 2018,
  lastYear: 2050,
  ...overrides,
})

describe('buildAgeSeries', () => {
  it('indexe chaque âge sur les années demandées, par sexe', () => {
    const ages = buildAgeSeries(
      [
        { year: 2022, age: 0, sex: 'HOMME', value: 10 },
        { year: 2023, age: 0, sex: 'HOMME', value: 12 },
        { year: 2022, age: 0, sex: 'FEMME', value: 7 },
      ],
      [2022, 2023],
    )

    expect(ages[0]).toMatchObject({ age: 0, men: [10, 12], women: [7, 0] })
  })

  it('renvoie les 100 âges même quand la source n’en renseigne qu’un', () => {
    const ages = buildAgeSeries([{ year: 2022, age: 42, sex: 'HOMME', value: 5 }], [2022])

    expect(ages).toHaveLength(AGE_COUNT)
    expect(ages.map((entry) => entry.age)).toEqual(Array.from({ length: AGE_COUNT }, (_, index) => index))
    expect(ages[41].men).toEqual([0])
    expect(ages[42].men).toEqual([5])
  })

  it('fait retomber un âge au-delà de 99 sur la dernière tranche ouverte', () => {
    const ages = buildAgeSeries(
      [
        { year: 2022, age: 99, sex: 'FEMME', value: 6 },
        { year: 2022, age: 120, sex: 'FEMME', value: 4 },
      ],
      [2022],
    )

    expect(ages[99].women).toEqual([10])
  })

  it('compte les scénarios non projetés comme 0 plutôt que de propager NaN', () => {
    const ages = buildAgeSeries([{ year: 2022, age: 30, sex: 'HOMME', value: null }], [2022])

    expect(ages[30].men).toEqual([0])
    expect(Number.isNaN(ages[30].men[0])).toBe(false)
  })

  it('ignore les années hors de la plage demandée', () => {
    const ages = buildAgeSeries(
      [
        { year: 2018, age: 30, sex: 'HOMME', value: 99 },
        { year: 2022, age: 30, sex: 'HOMME', value: 12 },
      ],
      [2022],
    )

    expect(ages[30].men).toEqual([12])
  })
})

describe('pickZone', () => {
  it('préfère la projection propre de l’EPCI', () => {
    expect(pickZone(zone(), [zone({ code: 'R11_01_23', level: 'BH' })])).toEqual({
      kind: 'found',
      zone: zone(),
      coverage: 'EPCI',
    })
  })

  it('retombe sur le bassin quand l’EPCI n’est pas projeté', () => {
    const bassin = zone({ code: 'R11_01_23', level: 'BH', epciCode: null, bassinName: 'BEAUNE' })

    expect(pickZone(null, [bassin])).toEqual({ kind: 'found', zone: bassin, coverage: 'BASSIN' })
  })

  it('ignore une zone EPCI hors seuil de robustesse et retombe sur le bassin', () => {
    const bassin = zone({ code: 'R11_01_23', level: 'BH', epciCode: null, bassinName: 'BEAUNE' })

    expect(pickZone(zone({ isRobust: false }), [bassin])).toMatchObject({ coverage: 'BASSIN' })
  })

  it('refuse d’additionner un bassin partagé par plusieurs zones', () => {
    // Métropole du Grand Paris : 12 territoires, dont deux non projetés.
    const zones = [
      zone({ code: '200054781_T1', isRobust: true }),
      zone({ code: '200054781_T2', isRobust: true }),
      zone({ code: '200054781_T3', isRobust: false }),
    ]

    expect(pickZone(null, zones)).toEqual({ kind: 'none', reason: 'AMBIGUOUS_BASSIN' })
  })

  it('signale l’absence totale de projection', () => {
    expect(pickZone(null, [])).toEqual({ kind: 'none', reason: 'NO_PROJECTION' })
    expect(pickZone(zone({ isRobust: false }), [zone({ isRobust: false })])).toEqual({
      kind: 'none',
      reason: 'NO_PROJECTION',
    })
  })
})

describe('AgePyramidService', () => {
  let service: AgePyramidService
  let prisma: DeepMocked<PrismaService>
  let zones: DeepMocked<ProjectionZonesService>

  beforeEach(async () => {
    prisma = createMock<PrismaService>()
    zones = createMock<ProjectionZonesService>()

    const module: TestingModule = await Test.createTestingModule({
      providers: [AgePyramidService, { provide: PrismaService, useValue: prisma }, { provide: ProjectionZonesService, useValue: zones }],
    }).compile()

    service = module.get(AgePyramidService)
    zones.resolveMillesime.mockResolvedValue('2022')
  })

  it('prend le millésime comme année de référence et lit la colonne du scénario', async () => {
    zones.resolveForEpcis.mockResolvedValue([{ epciCode: '200006682', epciZone: zone(), bassinZones: [] }])
    prisma.projectionPopulationByAgeSex.findMany.mockResolvedValue([
      { year: 2022, age: 30, sex: 'HOMME', centralC: 100 },
      { year: 2023, age: 30, sex: 'HOMME', centralC: 110 },
    ] as never)

    const result = await service.getAgePyramid('200006682', 'central')

    expect(result).toMatchObject({ available: true, coverage: 'EPCI', referenceYear: 2022, years: [2022, 2023] })
    expect(prisma.projectionPopulationByAgeSex.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ zoneCode: '200006682', year: { gte: 2022, lte: 2050 } }),
        select: expect.objectContaining({ centralC: true }),
      }),
    )
  })

  it('sélectionne la colonne correspondant à la variante de population', async () => {
    zones.resolveForEpcis.mockResolvedValue([{ epciCode: '200006682', epciZone: zone(), bassinZones: [] }])
    prisma.projectionPopulationByAgeSex.findMany.mockResolvedValue([{ year: 2022, age: 30, sex: 'HOMME', pbC: 42 }] as never)

    const result = await service.getAgePyramid('200006682', 'basse')

    expect(prisma.projectionPopulationByAgeSex.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ select: expect.objectContaining({ pbC: true }) }),
    )
    expect(result).toMatchObject({ available: true, populationType: 'basse' })
    if (result.available) expect(result.ages[30].men).toEqual([42])
  })

  it('renvoie une réponse indisponible plutôt qu’une pyramide vide', async () => {
    zones.resolveForEpcis.mockResolvedValue([{ epciCode: '240100610', epciZone: null, bassinZones: [] }])

    await expect(service.getAgePyramid('240100610', 'central')).resolves.toEqual({
      available: false,
      epciCode: '240100610',
      reason: 'NO_PROJECTION',
    })
    expect(prisma.projectionPopulationByAgeSex.findMany).not.toHaveBeenCalled()
  })

  it('renvoie une réponse indisponible quand la zone existe mais ne porte aucune année', async () => {
    zones.resolveForEpcis.mockResolvedValue([{ epciCode: '200006682', epciZone: zone(), bassinZones: [] }])
    prisma.projectionPopulationByAgeSex.findMany.mockResolvedValue([] as never)

    await expect(service.getAgePyramid('200006682', 'central')).resolves.toMatchObject({
      available: false,
      reason: 'NO_PROJECTION',
    })
  })
})
