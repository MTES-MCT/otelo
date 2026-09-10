import { createMock } from '@golevelup/ts-jest'
import { INestApplication } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { createHttpTestApp } from '@test/http-app'
import request from 'supertest'
import { EmailService } from '~/email/email.service'
import { ExportExcelService } from '~/export-excel/export-excel.service'
import { SimulationsService } from '~/simulations/simulations.service'
import { ExportPowerpointController } from './export-powerpoint.controller'
import { ExportPowerpointService } from './export-powerpoint.service'
import { PowerpointRequestsService } from './powerpoint-requests.service'

describe('ExportPowerpointController (contrat HTTP)', () => {
  let app: INestApplication
  let emailService: jest.Mocked<EmailService>
  let simulationsService: jest.Mocked<SimulationsService>
  let powerpointRequestsService: jest.Mocked<PowerpointRequestsService>

  const realPayload = (overrides: Record<string, unknown> = {}) => ({
    documentType: 'PLUi',
    epci: { code: '200069672', name: 'CA Le Grand Chalon' },
    nextStep: 'Arrêt du projet',
    periodEnd: '2035',
    periodStart: '2025',
    privilegedSimulation: 'sim-1',
    privilegedSimulationProjection: 2,
    // La date est calculée : le schéma refuse une date antérieure à aujourd'hui, donc
    // une valeur en dur ferait passer ce test au rouge le lendemain de son écriture.
    resultDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
    selectedSimulations: ['sim-1'],
    ...overrides,
  })

  const post = (body: Record<string, unknown>) => request(app.getHttpServer()).post('/export-powerpoint').send(body)

  const sentHtml = () => (emailService.sendEmail.mock.calls[0][0] as { html: string }).html

  beforeEach(async () => {
    emailService = createMock<EmailService>()
    simulationsService = createMock<SimulationsService>()
    powerpointRequestsService = createMock<PowerpointRequestsService>()

    simulationsService.hasUserAccessToAll.mockResolvedValue(true)
    simulationsService.getMany.mockResolvedValue([{ id: 'sim-1', name: 'Scénario haut' }] as never)
    powerpointRequestsService.findReplaceable.mockResolvedValue(null)
    powerpointRequestsService.record.mockResolvedValue('req-1' as never)

    const exportPowerpointService = createMock<ExportPowerpointService>()
    exportPowerpointService.generateFromTemplate.mockResolvedValue(Buffer.from('pptx'))

    const exportExcelService = createMock<ExportExcelService>()
    exportExcelService.exportScenario.mockResolvedValue({
      workbook: { xlsx: { writeBuffer: async () => Buffer.from('xlsx') } },
    } as never)

    app = await createHttpTestApp(
      {
        controllers: [ExportPowerpointController],
        providers: [
          { provide: ConfigService, useValue: { getOrThrow: () => 'equipe@otelo.test' } },
          { provide: EmailService, useValue: emailService },
          { provide: ExportExcelService, useValue: exportExcelService },
          { provide: ExportPowerpointService, useValue: exportPowerpointService },
          { provide: PowerpointRequestsService, useValue: powerpointRequestsService },
          { provide: SimulationsService, useValue: simulationsService },
        ],
      },
      { id: 'user-test', email: 'agent@ddt71.gouv.fr', firstname: 'Agnès', lastname: 'Martin', role: 'USER', hasAccess: true },
    )
  })

  afterEach(async () => {
    await app.close()
  })

  describe('ce que le tableau de bord envoie', () => {
    it('should accept the payload of a single-EPCI document', async () => {
      const response = await post(realPayload())

      expect(response.status).toBe(200)
      expect(emailService.sendEmail).toHaveBeenCalledTimes(1)
    })

    it('should accept a SCoT document, which carries several EPCIs instead of one', async () => {
      const response = await post(
        realPayload({
          documentType: 'SCoT',
          epci: undefined,
          epcis: [
            { code: '200069672', name: 'CA Le Grand Chalon' },
            { code: '200040590', name: 'CC Le Grand Autunois Morvan' },
          ],
        }),
      )

      expect(response.status).toBe(200)
    })

    it('should keep ignoring the extra field the form sends', async () => {
      const response = await post(realPayload())

      expect(response.status).toBe(200)
      expect(powerpointRequestsService.record).toHaveBeenCalled()
    })
  })

  describe('règles enfin appliquées', () => {
    it('should refuse a period running backwards', async () => {
      const response = await post(realPayload({ periodEnd: '2025', periodStart: '2035' }))

      expect(response.status).toBe(400)
      expect(emailService.sendEmail).not.toHaveBeenCalled()
    })

    it('should refuse a SCoT document without the EPCIs it needs', async () => {
      const response = await post(realPayload({ documentType: 'SCoT', epci: undefined }))

      expect(response.status).toBe(400)
    })

    it('should refuse more simulations than a presentation can hold', async () => {
      const response = await post(realPayload({ selectedSimulations: ['a', 'b', 'c', 'd'] }))

      expect(response.status).toBe(400)
    })
  })

  /**
   * Le nom d'une simulation est saisi par l'utilisateur et se renomme à volonté. Il est
   * recopié dans un courriel HTML lu par l'équipe, depuis l'adresse légitime d'Otelo.
   */
  describe('échappement du courriel', () => {
    it('should neutralise HTML carried by a simulation name', async () => {
      simulationsService.getMany.mockResolvedValue([{ id: 'sim-1', name: '<a href="https://hameconnage.test">Urgent</a>' }] as never)

      await post(realPayload())

      const html = sentHtml()
      expect(html).not.toContain('<a href')
      expect(html).toContain('&lt;a href=')
    })

    it('should neutralise HTML carried by the fields of the request', async () => {
      await post(realPayload({ nextStep: '<script>alert(1)</script>' }))

      const html = sentHtml()
      expect(html).not.toContain('<script>')
      expect(html).toContain('&lt;script&gt;')
    })

    it('should neutralise HTML carried by an EPCI name', async () => {
      await post(realPayload({ epci: { code: '200069672', name: '<b>Faux EPCI</b>' } }))

      const html = sentHtml()
      expect(html).not.toContain('<b>Faux EPCI</b>')
      expect(html).toContain('&lt;b&gt;')
    })

    it('should leave ordinary French names readable', async () => {
      await post(realPayload())

      expect(sentHtml()).toContain('CA Le Grand Chalon')
    })
  })
})
