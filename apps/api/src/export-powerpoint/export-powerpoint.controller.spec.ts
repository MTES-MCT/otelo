import { createMock } from '@golevelup/ts-jest'
import { ConflictException } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { Test, TestingModule } from '@nestjs/testing'
import { EmailService } from '~/email/email.service'
import { ExportExcelService } from '~/export-excel/export-excel.service'
import { TRequestPowerpoint } from '~/schemas/export-powerpoint/export-powerpoint'
import { TUser } from '~/schemas/users/user'
import { SimulationsService } from '~/simulations/simulations.service'
import { ExportPowerpointController } from './export-powerpoint.controller'
import { ExportPowerpointService } from './export-powerpoint.service'
import { PowerpointRequestsService, TReplaceablePowerpointRequest } from './powerpoint-requests.service'

const user = { id: 'user-1', email: 'agent@ddt71.gouv.fr', firstname: 'Agnès', lastname: 'Martin' } as TUser

const request = (overrides: Partial<TRequestPowerpoint> = {}): TRequestPowerpoint =>
  ({
    nextStep: 'Présentation aux élus',
    resultDate: '2026-10-01',
    selectedSimulations: ['sim-1'],
    privilegedSimulation: 'sim-1',
    documentType: 'PLH',
    periodStart: '2026',
    periodEnd: '2032',
    epci: { code: '200069672', name: 'CA Le Grand Chalon' },
    ...overrides,
  }) as TRequestPowerpoint

const previousRequest: TReplaceablePowerpointRequest = {
  requestId: 'request-1',
  requestedAt: new Date('2026-09-09T16:00:00Z'),
  documentType: 'PLH',
  nextStep: 'Atelier de travail',
  periodStart: 2026,
  periodEnd: 2032,
  simulationNames: ['Scénario haut'],
  epciNames: ['CA Le Grand Chalon'],
  reasons: ['RECENT', 'SAME_DAY'],
}

describe('ExportPowerpointController', () => {
  let controller: ExportPowerpointController
  let powerpointRequests: jest.Mocked<PowerpointRequestsService>
  let emailService: jest.Mocked<EmailService>

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ExportPowerpointController],
      providers: [
        { provide: ConfigService, useValue: { getOrThrow: jest.fn(() => 'otelo@beta.gouv.fr') } },
        { provide: ExportPowerpointService, useValue: createMock<ExportPowerpointService>() },
        { provide: ExportExcelService, useValue: createMock<ExportExcelService>() },
        { provide: SimulationsService, useValue: createMock<SimulationsService>() },
        { provide: PowerpointRequestsService, useValue: createMock<PowerpointRequestsService>() },
        { provide: EmailService, useValue: createMock<EmailService>() },
      ],
    }).compile()

    controller = module.get(ExportPowerpointController)
    powerpointRequests = module.get(PowerpointRequestsService)
    emailService = module.get(EmailService)

    const simulations = module.get<jest.Mocked<SimulationsService>>(SimulationsService)
    simulations.hasUserAccessToAll.mockResolvedValue(true)
    simulations.getMany.mockResolvedValue([])

    const powerpoint = module.get<jest.Mocked<ExportPowerpointService>>(ExportPowerpointService)
    powerpoint.generateFromTemplate.mockResolvedValue(Buffer.from('pptx'))

    Object.defineProperty(powerpointRequests, 'windowMinutes', { value: 30 })
    powerpointRequests.record.mockResolvedValue('request-2')
  })

  it('refuse une demande en doublon qui ne confirme pas explicitement le remplacement', async () => {
    powerpointRequests.findReplaceable.mockResolvedValue(previousRequest)

    await expect(controller.requestPowerpoint(user, request())).rejects.toBeInstanceOf(ConflictException)
    expect(powerpointRequests.record).not.toHaveBeenCalled()
  })

  it('refuse un remplacement qui désigne une autre demande que la demande courante', async () => {
    powerpointRequests.findReplaceable.mockResolvedValue(previousRequest)

    await expect(controller.requestPowerpoint(user, request({ replacesRequestId: 'request-obsolete' }))).rejects.toBeInstanceOf(
      ConflictException,
    )
    expect(powerpointRequests.record).not.toHaveBeenCalled()
  })

  it('marque la demande précédente comme remplacée et signale le remplacement dans le mail', async () => {
    powerpointRequests.findReplaceable.mockResolvedValue(previousRequest)
    emailService.sendEmail.mockResolvedValue(undefined as never)

    const result = await controller.requestPowerpoint(user, request({ replacesRequestId: 'request-1' }))

    expect(result.success).toBe(true)
    expect(powerpointRequests.supersede).toHaveBeenCalledWith('request-1', 'request-2')

    const email = emailService.sendEmail.mock.calls[0][0]
    expect(email.subject).toBe('Demande de PowerPoint remplaçant une demande précédente')
    expect(email.html).toContain('Cette demande remplace une demande précédente')
    expect(email.text).toContain('Cette demande remplace une demande précédente')
    // Le motif du doublon accompagne le remplacement : sans lui, l'équipe ne sait
    // pas si l'agent s'est corrigé ou a redemandé le même livrable des jours après.
    expect(email.html).toContain('demande faite plus tôt dans la même journée')
    expect(email.text).toContain('demande faite il y a moins de 30 minutes')
  })

  it("laisse la demande précédente active quand l'envoi du mail échoue", async () => {
    powerpointRequests.findReplaceable.mockResolvedValue(previousRequest)
    emailService.sendEmail.mockRejectedValue(new Error('Brevo indisponible'))

    const result = await controller.requestPowerpoint(user, request({ replacesRequestId: 'request-1' }))

    expect(result.success).toBe(false)
    expect(powerpointRequests.supersede).not.toHaveBeenCalled()
  })

  it("n'annonce aucun remplacement pour une première demande", async () => {
    powerpointRequests.findReplaceable.mockResolvedValue(null)
    emailService.sendEmail.mockResolvedValue(undefined as never)

    await controller.requestPowerpoint(user, request())

    expect(powerpointRequests.supersede).not.toHaveBeenCalled()
    expect(emailService.sendEmail.mock.calls[0][0].subject).toBe('Nouvelle demande de PowerPoint')
  })
})
