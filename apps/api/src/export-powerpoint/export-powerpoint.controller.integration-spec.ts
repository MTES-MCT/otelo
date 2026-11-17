import { createMock } from '@golevelup/ts-jest'
import { ConflictException } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { Test, TestingModule } from '@nestjs/testing'
import { createEpciGroup, createSimulation, createUser, GRAND_CHALON, resetDatabase, seedReferenceData } from '@test/fixtures'
import { env } from '~/config/env'
import { PrismaModule } from '~/db/prisma.module'
import { PrismaService } from '~/db/prisma.service'
import { EmailService } from '~/email/email.service'
import { ExportExcelService } from '~/export-excel/export-excel.service'
import { TRequestPowerpoint } from '~/schemas/export-powerpoint/export-powerpoint'
import { TUser } from '~/schemas/users/user'
import { SimulationsService } from '~/simulations/simulations.service'
import { ExportPowerpointController } from './export-powerpoint.controller'
import { ExportPowerpointService } from './export-powerpoint.service'
import { PowerpointRequestsService } from './powerpoint-requests.service'

/**
 * Le parcours complet d'une demande, avec la vraie base.
 *
 * Seuls sont simulés les coûts externes : génération du PowerPoint, des classeurs
 * Excel et envoi du mail. Le contrôle d'accès et la lecture des simulations passent
 * par Prisma, comme en production.
 */
describe('ExportPowerpointController (intégration)', () => {
  let module: TestingModule
  let prisma: PrismaService
  let controller: ExportPowerpointController
  let emailService: jest.Mocked<EmailService>

  let user: TUser
  let scenarioHaut: string
  let scenarioBas: string

  const demande = (overrides: Partial<TRequestPowerpoint> = {}): TRequestPowerpoint =>
    ({
      nextStep: 'Présentation aux élus',
      resultDate: '2026-10-01',
      selectedSimulations: [scenarioHaut],
      privilegedSimulation: scenarioHaut,
      documentType: 'PLH',
      periodStart: '2026',
      periodEnd: '2032',
      epci: { code: GRAND_CHALON.code, name: GRAND_CHALON.name },
      ...overrides,
    }) as TRequestPowerpoint

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [ConfigModule.forRoot({ isGlobal: true, load: [() => env] }), PrismaModule],
      controllers: [ExportPowerpointController],
      providers: [
        PowerpointRequestsService,
        { provide: ExportPowerpointService, useValue: createMock<ExportPowerpointService>() },
        { provide: ExportExcelService, useValue: createMock<ExportExcelService>() },
        { provide: SimulationsService, useValue: createMock<SimulationsService>() },
        { provide: EmailService, useValue: createMock<EmailService>() },
      ],
    }).compile()

    await module.init()
    prisma = module.get(PrismaService)
    controller = module.get(ExportPowerpointController)
    emailService = module.get(EmailService)

    module.get<jest.Mocked<ExportPowerpointService>>(ExportPowerpointService).generateFromTemplate.mockResolvedValue(Buffer.from('pptx'))
    module.get<jest.Mocked<ExportExcelService>>(ExportExcelService).exportScenario.mockResolvedValue({
      workbook: { xlsx: { writeBuffer: async () => Buffer.from('xlsx') } },
    } as never)

    // Le contrôle d'accès et la lecture des simulations restent adossés à la base.
    const simulations = module.get<jest.Mocked<SimulationsService>>(SimulationsService)
    simulations.hasUserAccessToAll.mockImplementation(
      async (ids, userId) => (await prisma.simulation.count({ where: { id: { in: ids }, userId } })) === ids.length,
    )
    simulations.getMany.mockImplementation(async (ids) => (await prisma.simulation.findMany({ where: { id: { in: ids } } })) as never)
  })

  afterAll(async () => {
    await resetDatabase(prisma)
    await module.close()
  })

  beforeEach(async () => {
    await resetDatabase(prisma)
    await seedReferenceData(prisma)

    const created = await createUser(prisma)
    user = { id: created.id, email: created.email, firstname: created.firstname, lastname: created.lastname } as TUser

    const groupId = (await createEpciGroup(prisma, created.id)).id
    scenarioHaut = (await createSimulation(prisma, { userId: created.id, epciGroupId: groupId, name: 'Scénario haut' })).id
    scenarioBas = (await createSimulation(prisma, { userId: created.id, epciGroupId: groupId, name: 'Scénario bas' })).id

    emailService.sendEmail.mockReset()
    emailService.sendEmail.mockResolvedValue(undefined as never)
  })

  const activeRequestIds = async () => {
    const rows = await prisma.export.findMany({ where: { supersededAt: null }, select: { requestId: true } })
    return [...new Set(rows.map((row) => row.requestId))]
  }

  it('ne signale aucun doublon sur une première demande', async () => {
    const result = await controller.checkDuplicate(user, { selectedSimulations: [scenarioHaut], epciCodes: [GRAND_CHALON.code] })

    expect(result.previousRequest).toBeNull()
    expect(result.windowMinutes).toBe(30)
  })

  it('enregistre la demande et envoie le mail sans mention de remplacement', async () => {
    const result = await controller.requestPowerpoint(user, demande())

    expect(result.success).toBe(true)

    const rows = await prisma.export.findMany()
    expect(rows).toHaveLength(1)
    expect(rows[0].epciCodes).toEqual([GRAND_CHALON.code])
    expect(rows[0].isPrivileged).toBe(true)
    expect(rows[0].supersededAt).toBeNull()

    const email = emailService.sendEmail.mock.calls[0][0]
    expect(email.subject).toBe('Nouvelle demande de PowerPoint')
    expect(email.html).not.toContain('remplace une demande précédente')
  })

  it('signale ensuite la demande précédente avec ses motifs', async () => {
    await controller.requestPowerpoint(user, demande())

    const result = await controller.checkDuplicate(user, { selectedSimulations: [scenarioHaut], epciCodes: [GRAND_CHALON.code] })

    expect(result.previousRequest?.reasons).toEqual(['RECENT', 'SAME_DAY', 'SAME_SCENARIOS_AND_TERRITORY'])
    expect(result.previousRequest?.epciNames).toEqual([GRAND_CHALON.name])
  })

  it("refuse une seconde demande non confirmée et n'écrit rien", async () => {
    await controller.requestPowerpoint(user, demande())
    const avant = await prisma.export.count()

    await expect(controller.requestPowerpoint(user, demande({ selectedSimulations: [scenarioBas] }))).rejects.toBeInstanceOf(
      ConflictException,
    )

    expect(await prisma.export.count()).toBe(avant)
  })

  it("refuse un remplacement désignant une demande qui n'est plus la dernière", async () => {
    await controller.requestPowerpoint(user, demande())
    const [premiere] = await activeRequestIds()

    await controller.requestPowerpoint(user, demande({ replacesRequestId: premiere }))

    // `premiere` est désormais remplacée : la redésigner ne doit plus passer.
    await expect(controller.requestPowerpoint(user, demande({ replacesRequestId: premiere }))).rejects.toBeInstanceOf(ConflictException)
  })

  it('remplace la demande précédente et le signale dans le mail', async () => {
    await controller.requestPowerpoint(user, demande())
    const [premiere] = await activeRequestIds()

    const result = await controller.requestPowerpoint(user, demande({ selectedSimulations: [scenarioBas], replacesRequestId: premiere }))

    expect(result.success).toBe(true)

    const remplacees = await prisma.export.findMany({ where: { requestId: premiere } })
    expect(remplacees.every((row) => row.supersededAt !== null)).toBe(true)

    const [active] = await activeRequestIds()
    expect(remplacees.every((row) => row.supersededByRequestId === active)).toBe(true)

    const envois = emailService.sendEmail.mock.calls
    const email = envois[envois.length - 1][0]
    expect(email.subject).toBe('Demande de PowerPoint remplaçant une demande précédente')
    expect(email.html).toContain('Cette demande remplace une demande précédente')
    // Les scénarios diffèrent entre les deux demandes : seuls les motifs de date
    // s'appliquent, et le mail ne doit annoncer que ceux-là.
    expect(email.html).toContain('demande faite il y a moins de 30 minutes')
    expect(email.html).not.toContain('mêmes scénarios et même territoire')
  })

  it('laisse la demande précédente active quand le mail ne part pas', async () => {
    await controller.requestPowerpoint(user, demande())
    const [premiere] = await activeRequestIds()

    emailService.sendEmail.mockRejectedValueOnce(new Error('Brevo indisponible'))
    const result = await controller.requestPowerpoint(user, demande({ selectedSimulations: [scenarioBas], replacesRequestId: premiere }))

    expect(result.success).toBe(false)

    const premieres = await prisma.export.findMany({ where: { requestId: premiere } })
    expect(premieres.every((row) => row.supersededAt === null)).toBe(true)
  })

  it('ne compte pas une demande remplacée dans les PowerPoint livrés', async () => {
    await controller.requestPowerpoint(user, demande())
    const [premiere] = await activeRequestIds()
    await controller.requestPowerpoint(user, demande({ replacesRequestId: premiere }))

    const livres = await prisma.export.count({
      where: { type: 'POWERPOINT', isPrivileged: true, supersededAt: null, simulation: { NOT: { user: { role: 'ADMIN' } } } },
    })

    expect(await prisma.export.count({ where: { isPrivileged: true } })).toBe(2)
    expect(livres).toBe(1)
  })
})
