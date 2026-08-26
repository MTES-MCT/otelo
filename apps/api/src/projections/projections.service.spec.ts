import { createMock, type DeepMocked } from '@golevelup/ts-jest'
import { Test, type TestingModule } from '@nestjs/testing'
import { PrismaService } from '~/db/prisma.service'
import type { TProjectionZoneWithMillesime } from '~/schemas/projections/projections'
import { ProjectionZonesService } from './projection-zones.service'
import { ProjectionsService } from './projections.service'

const EPCI_ZONE: TProjectionZoneWithMillesime = {
  code: '200006682',
  level: 'EPCI',
  label: 'CA Beaune',
  epciCode: '200006682',
  bassinName: null,
  isRobust: true,
  firstYear: 2018,
  lastYear: 2050,
}

describe('ProjectionsService', () => {
  let service: ProjectionsService
  let prisma: DeepMocked<PrismaService>
  let zonesService: DeepMocked<ProjectionZonesService>

  beforeEach(async () => {
    prisma = createMock<PrismaService>()
    zonesService = createMock<ProjectionZonesService>()
    zonesService.resolveMillesime.mockResolvedValue('2022')
    zonesService.requireZones.mockResolvedValue(new Map([[EPCI_ZONE.code, EPCI_ZONE]]))
    zonesService.robustnessByZone.mockResolvedValue(new Map([[EPCI_ZONE.code, true]]))

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProjectionsService,
        { provide: PrismaService, useValue: prisma },
        { provide: ProjectionZonesService, useValue: zonesService },
      ],
    }).compile()

    service = module.get(ProjectionsService)
  })

  it('should be defined', () => {
    expect(service).toBeDefined()
  })

  it('indexe la réponse par code de zone et joint les métadonnées de la zone', async () => {
    prisma.projectionPopulationTotal.findMany.mockResolvedValue([
      { zoneCode: '200006682', year: 2018, centralC: 51392 },
      { zoneCode: '200006682', year: 2050, centralC: 47896 },
    ] as never)

    const result = await service.getPopulation({
      zoneCodes: ['200006682'],
      fromYear: 2018,
      toYear: 2050,
      scenarios: ['centralC'],
    })

    expect(Object.keys(result)).toEqual(['200006682'])
    expect(result['200006682'].zone).toEqual({
      code: '200006682',
      level: 'EPCI',
      label: 'CA Beaune',
      epciCode: '200006682',
      bassinName: null,
    })
    expect(result['200006682'].data).toEqual([
      { year: 2018, centralC: 51392 },
      { year: 2050, centralC: 47896 },
    ])
    expect(result['200006682'].metadata).toEqual({
      min: 47896,
      max: 51392,
      firstYear: 2018,
      lastYear: 2050,
    })
  })

  it('exclut les scénarios non projetés des bornes plutôt que de les compter pour zéro', async () => {
    // Cas des bassins de Dordogne : la population basse n'est pas projetée au-delà de 2018.
    // Compter ces null comme des zéros ferait partir l'échelle du graphique de l'origine.
    prisma.projectionPopulationTotal.findMany.mockResolvedValue([
      { zoneCode: '200006682', year: 2018, pbC: 80504, centralC: 80504 },
      { zoneCode: '200006682', year: 2019, pbC: null, centralC: 79988 },
    ] as never)

    const result = await service.getPopulation({
      zoneCodes: ['200006682'],
      fromYear: 2018,
      toYear: 2019,
      scenarios: ['pbC', 'centralC'],
    })

    expect(result['200006682'].data[1].pbC).toBeNull()
    expect(result['200006682'].metadata.min).toBe(79988)
    expect(result['200006682'].metadata.max).toBe(80504)
  })

  it('rend une série vide plutôt qu’une absence, et propage isRobust', async () => {
    // Une zone non projetée doit se distinguer d'une erreur : l'appelant a besoin de savoir que
    // l'unique point 2018 est une valeur observée, pas une projection plate.
    zonesService.robustnessByZone.mockResolvedValue(new Map([[EPCI_ZONE.code, false]]))
    prisma.projectionPopulationTotal.findMany.mockResolvedValue([] as never)

    const result = await service.getPopulation({
      zoneCodes: ['200006682'],
      fromYear: 2019,
      toYear: 2050,
    })

    expect(result['200006682'].isRobust).toBe(false)
    expect(result['200006682'].data).toEqual([])
    expect(result['200006682'].metadata).toEqual({
      min: null,
      max: null,
      firstYear: null,
      lastYear: null,
    })
  })

  it('sélectionne les 9 scénarios par défaut et restreint sur demande', async () => {
    prisma.projectionPopulationTotal.findMany.mockResolvedValue([] as never)

    await service.getPopulation({ zoneCodes: ['200006682'], fromYear: 2018, toYear: 2050 })
    const allScenarios = prisma.projectionPopulationTotal.findMany.mock.calls[0][0]?.select
    expect(Object.keys(allScenarios ?? {})).toEqual([
      'zoneCode',
      'year',
      'centralB',
      'centralC',
      'centralH',
      'phB',
      'phC',
      'phH',
      'pbB',
      'pbC',
      'pbH',
    ])

    await service.getPopulation({
      zoneCodes: ['200006682'],
      fromYear: 2018,
      toYear: 2050,
      scenarios: ['centralC'],
    })
    const restricted = prisma.projectionPopulationTotal.findMany.mock.calls[1][0]?.select
    expect(Object.keys(restricted ?? {})).toEqual(['zoneCode', 'year', 'centralC'])
  })

  it('borne la requête au millésime et à l’intervalle d’années demandés', async () => {
    prisma.projectionPopulationTotal.findMany.mockResolvedValue([] as never)

    await service.getPopulation({ zoneCodes: ['200006682'], fromYear: 2030, toYear: 2040 })

    expect(prisma.projectionPopulationTotal.findMany.mock.calls[0][0]?.where).toEqual({
      zoneCode: { in: ['200006682'] },
      millesime: '2022',
      year: { gte: 2030, lte: 2040 },
    })
  })

  it('filtre le détail par âge sur les âges et le sexe demandés', async () => {
    prisma.projectionPopulationByAgeSex.findMany.mockResolvedValue([] as never)

    await service.getPopulationByAge({
      zoneCodes: ['200006682'],
      fromYear: 2050,
      toYear: 2050,
      ages: [0, 99],
      sex: 'FEMME',
    })

    expect(prisma.projectionPopulationByAgeSex.findMany.mock.calls[0][0]?.where).toMatchObject({
      sex: 'FEMME',
      age: { in: [0, 99] },
    })
  })

  it('filtre la typologie de ménages sur les modalités demandées', async () => {
    prisma.projectionHouseholdByType.findMany.mockResolvedValue([] as never)

    await service.getHouseholdsByType({
      zoneCodes: ['200006682'],
      fromYear: 2050,
      toYear: 2050,
      householdTypes: ['COUPLE', 'PERSONNE_SEULE'],
    })

    expect(prisma.projectionHouseholdByType.findMany.mock.calls[0][0]?.where).toMatchObject({
      householdType: { in: ['COUPLE', 'PERSONNE_SEULE'] },
    })
  })
})
