import { ConfigModule } from '@nestjs/config'
import { Test, TestingModule } from '@nestjs/testing'
import { type TPublicStatistics, ZPublicStatistics } from '@otelo/shared'
import {
  AUTUNOIS,
  createApiConsumer,
  createEpciGroup,
  createExport,
  createSimulation,
  createUser,
  GRAND_CHALON,
  resetDatabase,
  seedReferenceData,
  softDeleteSimulation,
} from '@test/fixtures'
import { env } from '~/config/env'
import { PrismaModule } from '~/db/prisma.module'
import { PrismaService } from '~/db/prisma.service'
import { Role, UserType } from '~/generated/prisma/enums'
import { ImpactStatisticsService } from './impact-statistics.service'
import { PublicStatisticsService } from './public-statistics.service'

const NOW = new Date('2026-11-16T12:00:00.000Z')

const territory = (epci: { code: string; name: string }, status: 'SIMULATED' | 'EXPORTED') => ({
  code: epci.code,
  name: epci.name,
  department: 'Saône-et-Loire',
  region: 'Bourgogne-Franche-Comté',
  status,
})

/**
 * La réponse est publique : ces tests portent sur ce qui est compté et sur ce qui
 * n'en sort pas. Les requêtes s'exécutent sur un vrai Postgres, faute de quoi les
 * jointures par `epci_scenarios` et les dédoublonnages ne seraient pas vérifiés.
 */
describe('PublicStatisticsService (intégration)', () => {
  let module: TestingModule
  let prisma: PrismaService
  let service: PublicStatisticsService

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [ConfigModule.forRoot({ isGlobal: true, load: [() => env] }), PrismaModule],
      providers: [ImpactStatisticsService, PublicStatisticsService],
    }).compile()

    await module.init()
    prisma = module.get(PrismaService)
    service = module.get(PublicStatisticsService)
  })

  afterAll(async () => {
    await resetDatabase(prisma)
    await module.close()
  })

  beforeEach(async () => {
    await resetDatabase(prisma)
    await seedReferenceData(prisma)
  })

  const monthOf = (stats: TPublicStatistics, month: string) => stats.monthly.find((row) => row.month === month)

  it('base vide : tout à zéro', async () => {
    const s = await service.getPublicStatistics(new Date('2026-11-16'))

    expect(s.keyFigures).toEqual({
      epcisWithSimulation: 0,
      epcisWithExport: 0,
      coveredPopulation: 0,
      coveredPopulationShare: 0,
      studiedPopulation: 0,
      studiedPopulationShare: 0,
      powerpointRequests: 0,
      engagedDepartments: 0,
      totalDepartments: 1,
      engagedLocalAuthorityAccounts: 0,
    })
    expect(s.epcis).toEqual([])
    expect(s.monthly).toHaveLength(24)
    expect(s.monthly[0].month).toBe('2024-12')
    expect(s.monthly.at(-1)).toEqual({ month: '2026-11', simulations: 0, exports: 0, activeEpcis: 0 })
    expect(s.planningDocumentsByType).toEqual([
      { key: 'PLH_PLUI', count: 0 },
      { key: 'SCOT', count: 0 },
      { key: 'AUTRES', count: 0 },
    ])
  })

  it('simulation seule : SIMULATED ; exportée : EXPORTED prioritaire', async () => {
    const user = await createUser(prisma, { type: UserType.DDT })
    await createSimulation(prisma, { userId: user.id, name: 'A', epciCodes: [GRAND_CHALON.code, AUTUNOIS.code] })
    const b = await createSimulation(prisma, { userId: user.id, name: 'B', epciCodes: [GRAND_CHALON.code] })
    await createExport(prisma, { simulationId: b.id })

    const s = await service.getPublicStatistics(NOW)

    // Triés par région, département puis nom : « CA Le Grand Chalon » avant « CC Le Grand Autunois Morvan ».
    expect(s.epcis).toEqual([territory(GRAND_CHALON, 'EXPORTED'), territory(AUTUNOIS, 'SIMULATED')])
    expect(s.keyFigures).toMatchObject({
      epcisWithSimulation: 2,
      epcisWithExport: 1,
      coveredPopulation: 110000,
      coveredPopulationShare: 75.9,
      studiedPopulation: 145000,
      studiedPopulationShare: 100,
      engagedDepartments: 1,
    })
  })

  it('simulation supprimée non exportée : EPCI absent ; supprimée après export : EXPORTED', async () => {
    const user = await createUser(prisma)
    const nonExportee = await createSimulation(prisma, { userId: user.id, name: 'Brouillon', epciCodes: [AUTUNOIS.code] })
    const exportee = await createSimulation(prisma, { userId: user.id, name: 'Présentée', epciCodes: [GRAND_CHALON.code] })
    await createExport(prisma, { simulationId: exportee.id })
    await softDeleteSimulation(prisma, nonExportee.id)
    await softDeleteSimulation(prisma, exportee.id)

    const s = await service.getPublicStatistics(NOW)

    expect(s.epcis).toEqual([territory(GRAND_CHALON, 'EXPORTED')])
    // L'EPCI exporté reste étudié : les couverts sont un sous-ensemble des étudiés.
    expect(s.keyFigures).toMatchObject({
      epcisWithSimulation: 1,
      epcisWithExport: 1,
      coveredPopulation: 110000,
      studiedPopulation: 110000,
    })
  })

  it('usage uniquement par un ADMIN : rien de compté', async () => {
    const admin = await createUser(prisma, { role: Role.ADMIN, type: UserType.DDT })
    const group = await createEpciGroup(prisma, admin.id)
    await prisma.epciGroup.update({ where: { id: group.id }, data: { planningDocumentType: 'PLH_PLUI' } })
    const sim = await createSimulation(prisma, {
      userId: admin.id,
      epciGroupId: group.id,
      name: 'Essai équipe',
      epciCodes: [GRAND_CHALON.code, AUTUNOIS.code],
    })
    await createExport(prisma, { simulationId: sim.id, createdAt: NOW })
    await prisma.simulation.update({ where: { id: sim.id }, data: { createdAt: NOW } })

    const s = await service.getPublicStatistics(NOW)

    expect(s.keyFigures).toEqual({
      epcisWithSimulation: 0,
      epcisWithExport: 0,
      coveredPopulation: 0,
      coveredPopulationShare: 0,
      studiedPopulation: 0,
      studiedPopulationShare: 0,
      powerpointRequests: 0,
      engagedDepartments: 0,
      totalDepartments: 1,
      engagedLocalAuthorityAccounts: 0,
    })
    expect(s.epcis).toEqual([])
    expect(s.planningDocumentsByType.every((row) => row.count === 0)).toBe(true)
    expect(s.monthly.every((row) => row.simulations === 0 && row.exports === 0 && row.activeEpcis === 0)).toBe(true)
    expect(s.targetReductions.every((row) => row.scenarios === 0)).toBe(true)
  })

  it('export Excel seul : SIMULATED, ni couverture ni dossier ni réduction', async () => {
    const user = await createUser(prisma)
    const group = await createEpciGroup(prisma, user.id)
    await prisma.epciGroup.update({ where: { id: group.id }, data: { planningDocumentType: 'PLH_PLUI' } })
    const sim = await createSimulation(prisma, { userId: user.id, epciGroupId: group.id, name: 'Excel', epciCodes: [GRAND_CHALON.code] })
    await createExport(prisma, { simulationId: sim.id, createdAt: NOW, type: 'EXCEL' })

    const s = await service.getPublicStatistics(NOW)

    expect(s.epcis).toEqual([territory(GRAND_CHALON, 'SIMULATED')])
    expect(s.keyFigures).toMatchObject({
      epcisWithSimulation: 1,
      epcisWithExport: 0,
      coveredPopulation: 0,
      studiedPopulation: 110000,
      studiedPopulationShare: 75.9,
      powerpointRequests: 0,
    })
    expect(s.targetReductions.every((row) => row.scenarios === 0)).toBe(true)
    expect(s.monthly.every((row) => row.exports === 0)).toBe(true)
  })

  it('compte exclu des statistiques : rien de compté, comme un compte de l’équipe', async () => {
    const excluded = await createUser(prisma, { type: UserType.EPCI, engaged: true, excludedFromStatistics: true })
    const group = await createEpciGroup(prisma, excluded.id)
    await prisma.epciGroup.update({ where: { id: group.id }, data: { planningDocumentType: 'PLH_PLUI' } })
    const sim = await createSimulation(prisma, {
      userId: excluded.id,
      epciGroupId: group.id,
      name: 'Usage en masse',
      epciCodes: [GRAND_CHALON.code, AUTUNOIS.code],
    })
    await createExport(prisma, { simulationId: sim.id, createdAt: NOW })
    await prisma.simulation.update({ where: { id: sim.id }, data: { createdAt: NOW } })

    const s = await service.getPublicStatistics(NOW)

    expect(s.epcis).toEqual([])
    expect(s.keyFigures).toMatchObject({
      epcisWithSimulation: 0,
      epcisWithExport: 0,
      powerpointRequests: 0,
      engagedLocalAuthorityAccounts: 0,
    })
    expect(s.monthly.every((row) => row.simulations === 0 && row.exports === 0 && row.activeEpcis === 0)).toBe(true)
    expect(s.targetReductions.every((row) => row.scenarios === 0)).toBe(true)
  })

  it('clé d’API exclue des statistiques : rien de compté', async () => {
    const consumer = await createApiConsumer(prisma, { excludedFromStatistics: true })
    const sim = await createSimulation(prisma, {
      apiConsumerId: consumer.id,
      name: 'Génération en masse',
      epciCodes: [GRAND_CHALON.code, AUTUNOIS.code],
    })
    await createExport(prisma, { simulationId: sim.id, createdAt: NOW })
    await prisma.simulation.update({ where: { id: sim.id }, data: { createdAt: NOW } })

    const s = await service.getPublicStatistics(NOW)

    expect(s.epcis).toEqual([])
    expect(s.keyFigures).toMatchObject({ epcisWithSimulation: 0, epcisWithExport: 0 })
    expect(s.monthly.every((row) => row.simulations === 0 && row.exports === 0 && row.activeEpcis === 0)).toBe(true)
    expect(s.targetReductions.every((row) => row.scenarios === 0)).toBe(true)
  })

  it('clé d’API non exclue : son usage reste compté', async () => {
    const consumer = await createApiConsumer(prisma)
    const sim = await createSimulation(prisma, { apiConsumerId: consumer.id, name: 'Usage via l’API' })
    await createExport(prisma, { simulationId: sim.id, createdAt: NOW })

    const s = await service.getPublicStatistics(NOW)

    expect(s.epcis).toEqual([territory(GRAND_CHALON, 'EXPORTED')])
    expect(s.keyFigures).toMatchObject({ epcisWithSimulation: 1, epcisWithExport: 1 })
  })

  it('collectivités utilisatrices : comptes de collectivités engagés, hors DDT et équipe', async () => {
    await createUser(prisma, { type: UserType.EPCI, engaged: true })
    await createUser(prisma, { type: UserType.Commune, engaged: true })
    await createUser(prisma, { type: UserType.Collectivite, engaged: true })
    await createUser(prisma, { type: UserType.SCOTPETR, engaged: true })
    await createUser(prisma, { type: UserType.EPCI, engaged: false })
    await createUser(prisma, { type: UserType.DDT, engaged: true })
    await createUser(prisma, { type: UserType.BureauEtudes, engaged: true })
    await createUser(prisma, { role: Role.ADMIN, type: UserType.EPCI, engaged: true })

    const s = await service.getPublicStatistics(NOW)

    expect(s.keyFigures.engagedLocalAuthorityAccounts).toBe(4)
  })

  it('dossier PLH_PLUI avec export compté, dossier SCOT sans export non compté', async () => {
    const user = await createUser(prisma)
    const plh = await createEpciGroup(prisma, user.id, 'PLH Grand Chalon')
    const scot = await createEpciGroup(prisma, user.id, 'SCoT Autunois')
    await prisma.epciGroup.update({ where: { id: plh.id }, data: { planningDocumentType: 'PLH_PLUI' } })
    await prisma.epciGroup.update({ where: { id: scot.id }, data: { planningDocumentType: 'SCOT' } })
    const first = await createSimulation(prisma, { userId: user.id, epciGroupId: plh.id, name: 'PLH haut' })
    const second = await createSimulation(prisma, { userId: user.id, epciGroupId: plh.id, name: 'PLH bas' })
    await createSimulation(prisma, { userId: user.id, epciGroupId: scot.id, name: 'SCoT', epciCodes: [AUTUNOIS.code] })
    await createExport(prisma, { simulationId: first.id })
    await createExport(prisma, { simulationId: second.id })

    const s = await service.getPublicStatistics(NOW)

    expect(s.planningDocumentsByType).toEqual([
      { key: 'PLH_PLUI', count: 1 },
      { key: 'SCOT', count: 0 },
      { key: 'AUTRES', count: 0 },
    ])
  })

  it('demandes d’export PowerPoint : une par personne et par territoire, hors Excel, équipe et clés d’API', async () => {
    const alice = await createUser(prisma)
    const bob = await createUser(prisma)
    const excelOnly = await createUser(prisma)
    const admin = await createUser(prisma, { role: Role.ADMIN })
    const consumer = await createApiConsumer(prisma)
    // Alice : trois demandes successives sur le Grand Chalon, une sur l'Autunois → 2
    const aliceChalon = await createSimulation(prisma, { userId: alice.id, name: 'Chalon haut' })
    const aliceChalonBis = await createSimulation(prisma, { userId: alice.id, name: 'Chalon bas' })
    const aliceAutun = await createSimulation(prisma, { userId: alice.id, name: 'Autun', epciCodes: [AUTUNOIS.code] })
    await createExport(prisma, { simulationId: aliceChalon.id })
    await createExport(prisma, { simulationId: aliceChalon.id })
    await createExport(prisma, { simulationId: aliceChalonBis.id })
    await createExport(prisma, { simulationId: aliceAutun.id })
    // Bob : même territoire qu'Alice, mais une autre personne → 1, même après suppression du scénario
    const bobChalon = await createSimulation(prisma, { userId: bob.id, name: 'Bob' })
    await createExport(prisma, { simulationId: bobChalon.id })
    await softDeleteSimulation(prisma, bobChalon.id)
    // Non comptés : export Excel, équipe, clé d'API
    const excelSim = await createSimulation(prisma, { userId: excelOnly.id, name: 'Excel' })
    await createExport(prisma, { simulationId: excelSim.id, type: 'EXCEL' })
    const adminSim = await createSimulation(prisma, { userId: admin.id, name: 'Équipe' })
    await createExport(prisma, { simulationId: adminSim.id })
    const apiSim = await createSimulation(prisma, { apiConsumerId: consumer.id, name: 'API' })
    await createExport(prisma, { simulationId: apiSim.id })

    const s = await service.getPublicStatistics(NOW)

    expect(s.keyFigures.powerpointRequests).toBe(3)
  })

  it('utilisateur non DDT : engagedDepartments à 0', async () => {
    const user = await createUser(prisma, { type: UserType.Collectivite })
    const sim = await createSimulation(prisma, { userId: user.id, name: 'Collectivité' })
    await createExport(prisma, { simulationId: sim.id })

    const s = await service.getPublicStatistics(NOW)

    expect(s.keyFigures.engagedDepartments).toBe(0)
    expect(s.keyFigures.epcisWithSimulation).toBe(1)
  })

  it('monthly : export de deux scénarios au même horodatage = 1 demande', async () => {
    const user = await createUser(prisma)
    const otherUser = await createUser(prisma)
    const haut = await createSimulation(prisma, { userId: user.id, name: 'Haut', epciCodes: [GRAND_CHALON.code] })
    const bas = await createSimulation(prisma, { userId: user.id, name: 'Bas', epciCodes: [GRAND_CHALON.code, AUTUNOIS.code] })
    const ancien = await createSimulation(prisma, { userId: otherUser.id, name: 'Ancien', epciCodes: [AUTUNOIS.code] })
    const supprime = await createSimulation(prisma, { userId: otherUser.id, name: 'Supprimé' })
    await softDeleteSimulation(prisma, supprime.id)

    const november = new Date('2026-11-03T09:00:00.000Z')
    await prisma.simulation.updateMany({ where: { id: { in: [haut.id, bas.id, supprime.id] } }, data: { createdAt: november } })
    await prisma.simulation.update({ where: { id: ancien.id }, data: { createdAt: new Date('2026-09-30T23:30:00.000Z') } })

    const requestedAt = new Date('2026-11-04T10:00:00.000Z')
    await createExport(prisma, { simulationId: haut.id, createdAt: requestedAt })
    await createExport(prisma, { simulationId: bas.id, createdAt: requestedAt })
    await createExport(prisma, { simulationId: ancien.id, createdAt: new Date('2026-10-01T00:30:00.000Z') })
    // Hors de la fenêtre de 24 mois.
    await createExport(prisma, { simulationId: ancien.id, createdAt: new Date('2024-11-30T12:00:00.000Z') })

    const s = await service.getPublicStatistics(NOW)

    expect(s.monthly).toHaveLength(24)
    expect(monthOf(s, '2026-11')).toEqual({ month: '2026-11', simulations: 2, exports: 1, activeEpcis: 2 })
    expect(monthOf(s, '2026-10')).toEqual({ month: '2026-10', simulations: 0, exports: 1, activeEpcis: 0 })
    expect(monthOf(s, '2026-09')).toEqual({ month: '2026-09', simulations: 1, exports: 0, activeEpcis: 1 })
    expect(s.monthly.reduce((sum, row) => sum + row.exports, 0)).toBe(2)
  })

  it('la réponse ne contient aucune clé hors schéma', async () => {
    const user = await createUser(prisma, { type: UserType.DDT })
    const group = await createEpciGroup(prisma, user.id)
    await prisma.epciGroup.update({ where: { id: group.id }, data: { planningDocumentType: 'AUTRES' } })
    const sim = await createSimulation(prisma, { userId: user.id, epciGroupId: group.id, name: 'Complet' })
    await createExport(prisma, { simulationId: sim.id })

    const s = await service.getPublicStatistics(NOW)

    expect(() => ZPublicStatistics.parse(s)).not.toThrow()
    expect(JSON.stringify(s)).not.toMatch(/email|userId|totalFlux|nbScenarios/)
    expect(JSON.stringify(s)).not.toContain(user.email)
    expect(JSON.stringify(s)).not.toContain(user.id)
  })
})
