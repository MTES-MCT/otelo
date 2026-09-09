import { ConfigModule } from '@nestjs/config'
import { Test, TestingModule } from '@nestjs/testing'
import {
  AUTUNOIS,
  createEpciGroup,
  createSimulation,
  createUser,
  GRAND_CHALON,
  insertPastRequest,
  resetDatabase,
  seedReferenceData,
} from '@test/fixtures'
import { env } from '~/config/env'
import { PrismaModule } from '~/db/prisma.module'
import { PrismaService } from '~/db/prisma.service'
import { PowerpointRequestsService } from './powerpoint-requests.service'

/**
 * Ces tests visent ce que les tests unitaires ne peuvent pas voir : la sémantique
 * réelle de Postgres. L'égalité de tableaux y est ordonnée, la comparaison de dates
 * se fait sur des `timestamp` et non sur des objets JavaScript, et le regroupement
 * par `request_id` traverse plusieurs lignes.
 */
describe('PowerpointRequestsService (intégration)', () => {
  let module: TestingModule
  let prisma: PrismaService
  let service: PowerpointRequestsService

  let userId: string
  let groupId: string
  let scenarioHaut: string
  let scenarioBas: string

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [ConfigModule.forRoot({ isGlobal: true, load: [() => env] }), PrismaModule],
      providers: [PowerpointRequestsService],
    }).compile()

    await module.init()
    prisma = module.get(PrismaService)
    service = module.get(PowerpointRequestsService)
  })

  afterAll(async () => {
    await resetDatabase(prisma)
    await module.close()
  })

  beforeEach(async () => {
    await resetDatabase(prisma)
    await seedReferenceData(prisma)

    const user = await createUser(prisma)
    userId = user.id
    groupId = (await createEpciGroup(prisma, userId)).id

    scenarioHaut = (await createSimulation(prisma, { userId, epciGroupId: groupId, name: 'Scénario haut' })).id
    scenarioBas = (await createSimulation(prisma, { userId, epciGroupId: groupId, name: 'Scénario bas' })).id
  })

  const minutesAgo = (minutes: number) => new Date(Date.now() - minutes * 60_000)

  describe('record', () => {
    it('écrit une ligne par scénario sous un même requestId, avec les codes EPCI triés', async () => {
      const requestId = await service.record([scenarioHaut, scenarioBas], {
        privilegedSimulationId: scenarioBas,
        documentType: 'SCoT',
        epciCodes: [GRAND_CHALON.code, AUTUNOIS.code],
        periodStart: 2026,
        periodEnd: 2032,
      })

      const rows = await prisma.export.findMany({ where: { requestId }, orderBy: { isPrivileged: 'asc' } })

      expect(rows).toHaveLength(2)
      expect(rows.every((row) => row.requestId === requestId)).toBe(true)
      expect(rows.map((row) => row.isPrivileged)).toEqual([false, true])
      // Triés à l'écriture : `text[] = text[]` est ordonné en Postgres.
      expect(rows[0].epciCodes).toEqual([AUTUNOIS.code, GRAND_CHALON.code])
      expect(rows[0].documentType).toBe('SCoT')
      expect(rows[0].supersededAt).toBeNull()
    })
  })

  describe('findReplaceable', () => {
    it("ne renvoie rien quand la simulation n'appartient à aucun groupe EPCI", async () => {
      const orpheline = await createSimulation(prisma, { userId, name: 'Hors tableau de bord' })
      await insertPastRequest(prisma, {
        simulationIds: [orpheline.id],
        createdAt: minutesAgo(5),
        epciCodes: [GRAND_CHALON.code],
      })

      expect(await service.findReplaceable(userId, [orpheline.id], [GRAND_CHALON.code])).toBeNull()
    })

    it('signale une demande faite dans la fenêtre', async () => {
      const requestId = await insertPastRequest(prisma, {
        simulationIds: [scenarioHaut],
        createdAt: minutesAgo(8),
        epciCodes: [GRAND_CHALON.code],
      })

      const replaceable = await service.findReplaceable(userId, [scenarioBas], [GRAND_CHALON.code])

      expect(replaceable?.requestId).toBe(requestId)
      expect(replaceable?.reasons).toEqual(['RECENT', 'SAME_DAY'])
      expect(replaceable?.epciNames).toEqual([GRAND_CHALON.name])
      expect(replaceable?.simulationNames).toEqual(['Scénario haut'])
    })

    it('signale une demande du même jour hors fenêtre sans la dire récente', async () => {
      // 90 minutes : au-delà de la fenêtre de 30, mais toujours le même jour, sauf à
      // tourner juste après minuit — d'où le saut de ce cas en début de journée.
      const earlier = minutesAgo(90)
      if (earlier.getDate() !== new Date().getDate()) return

      await insertPastRequest(prisma, {
        simulationIds: [scenarioHaut],
        createdAt: earlier,
        epciCodes: [GRAND_CHALON.code],
      })

      const replaceable = await service.findReplaceable(userId, [scenarioBas], [GRAND_CHALON.code])

      expect(replaceable?.reasons).toEqual(['SAME_DAY'])
    })

    it('signale un livrable identique demandé des semaines plus tôt', async () => {
      await insertPastRequest(prisma, {
        simulationIds: [scenarioHaut],
        createdAt: new Date(Date.now() - 45 * 24 * 3600_000),
        epciCodes: [GRAND_CHALON.code],
      })

      const replaceable = await service.findReplaceable(userId, [scenarioHaut], [GRAND_CHALON.code])

      expect(replaceable?.reasons).toEqual(['SAME_SCENARIOS_AND_TERRITORY'])
    })

    it("reconnaît le territoire quel que soit l'ordre des codes fournis", async () => {
      await service.record([scenarioHaut], { epciCodes: [GRAND_CHALON.code, AUTUNOIS.code] })
      await prisma.export.updateMany({ data: { createdAt: new Date(Date.now() - 45 * 24 * 3600_000) } })

      const replaceable = await service.findReplaceable(userId, [scenarioHaut], [AUTUNOIS.code, GRAND_CHALON.code])

      expect(replaceable?.reasons).toEqual(['SAME_SCENARIOS_AND_TERRITORY'])
    })

    it('ne rapproche pas deux demandes portant sur des territoires différents', async () => {
      await insertPastRequest(prisma, {
        simulationIds: [scenarioHaut],
        createdAt: new Date(Date.now() - 45 * 24 * 3600_000),
        epciCodes: [AUTUNOIS.code],
      })

      expect(await service.findReplaceable(userId, [scenarioHaut], [GRAND_CHALON.code])).toBeNull()
    })

    it('ignore une demande déjà remplacée', async () => {
      await insertPastRequest(prisma, {
        simulationIds: [scenarioHaut],
        createdAt: minutesAgo(8),
        epciCodes: [GRAND_CHALON.code],
        supersededAt: new Date(),
      })

      expect(await service.findReplaceable(userId, [scenarioBas], [GRAND_CHALON.code])).toBeNull()
    })

    it('ignore les demandes des autres utilisateurs', async () => {
      const autre = await createUser(prisma)
      const autreGroupe = await createEpciGroup(prisma, autre.id, 'DDT 21')
      const sienne = await createSimulation(prisma, { userId: autre.id, epciGroupId: autreGroupe.id, name: 'Scénario haut' })

      await insertPastRequest(prisma, {
        simulationIds: [sienne.id],
        createdAt: minutesAgo(8),
        epciCodes: [GRAND_CHALON.code],
      })

      expect(await service.findReplaceable(userId, [scenarioHaut], [GRAND_CHALON.code])).toBeNull()
    })

    it("ne compare pas le contenu des demandes antérieures à l'enregistrement du territoire", async () => {
      await insertPastRequest(prisma, {
        simulationIds: [scenarioHaut],
        createdAt: new Date(Date.now() - 45 * 24 * 3600_000),
        epciCodes: [],
      })

      expect(await service.findReplaceable(userId, [scenarioHaut], [GRAND_CHALON.code])).toBeNull()
    })

    it("rassemble les scénarios d'une demande sans les dupliquer entre les deux lectures", async () => {
      // Récente ET de contenu identique : la demande remonte par les deux requêtes.
      await insertPastRequest(prisma, {
        simulationIds: [scenarioHaut, scenarioBas],
        createdAt: minutesAgo(8),
        epciCodes: [GRAND_CHALON.code],
      })

      const replaceable = await service.findReplaceable(userId, [scenarioHaut, scenarioBas], [GRAND_CHALON.code])

      expect(replaceable?.reasons).toEqual(['RECENT', 'SAME_DAY', 'SAME_SCENARIOS_AND_TERRITORY'])
      expect([...(replaceable?.simulationNames ?? [])].sort()).toEqual(['Scénario bas', 'Scénario haut'])
    })

    it('propose la plus récente quand plusieurs demandes sont suspectes', async () => {
      await insertPastRequest(prisma, {
        simulationIds: [scenarioHaut],
        createdAt: minutesAgo(25),
        epciCodes: [GRAND_CHALON.code],
      })
      const recente = await insertPastRequest(prisma, {
        simulationIds: [scenarioBas],
        createdAt: minutesAgo(3),
        epciCodes: [GRAND_CHALON.code],
      })

      expect((await service.findReplaceable(userId, [scenarioHaut], [GRAND_CHALON.code]))?.requestId).toBe(recente)
    })
  })

  describe('supersede', () => {
    it('marque toutes les lignes de la demande visée et elles seules', async () => {
      const remplacee = await insertPastRequest(prisma, {
        simulationIds: [scenarioHaut, scenarioBas],
        createdAt: minutesAgo(20),
        epciCodes: [GRAND_CHALON.code],
      })
      const voisine = await insertPastRequest(prisma, {
        simulationIds: [scenarioHaut],
        createdAt: minutesAgo(15),
        epciCodes: [AUTUNOIS.code],
      })

      await service.supersede(remplacee, 'request-de-remplacement')

      const marquees = await prisma.export.findMany({ where: { requestId: remplacee } })
      expect(marquees).toHaveLength(2)
      expect(marquees.every((row) => row.supersededAt !== null)).toBe(true)
      expect(marquees.every((row) => row.supersededByRequestId === 'request-de-remplacement')).toBe(true)

      const intactes = await prisma.export.findMany({ where: { requestId: voisine } })
      expect(intactes.every((row) => row.supersededAt === null)).toBe(true)
    })

    it('ne réécrit pas une demande déjà remplacée', async () => {
      const dejaRemplacee = new Date(Date.now() - 3600_000)
      const requestId = await insertPastRequest(prisma, {
        simulationIds: [scenarioHaut],
        createdAt: minutesAgo(120),
        epciCodes: [GRAND_CHALON.code],
        supersededAt: dejaRemplacee,
      })

      await service.supersede(requestId, 'request-tardive')

      const [row] = await prisma.export.findMany({ where: { requestId } })
      expect(row.supersededAt).toEqual(dejaRemplacee)
      expect(row.supersededByRequestId).toBeNull()
    })
  })
})
