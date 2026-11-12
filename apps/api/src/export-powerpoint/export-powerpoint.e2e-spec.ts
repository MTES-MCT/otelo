import { createMock } from '@golevelup/ts-jest'
import { INestApplication } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { GRAND_CHALON } from '@test/fixtures'
import { createHttpTestApp } from '@test/http-app'
import dayjs from 'dayjs'
import JSZip from 'jszip'
import request from 'supertest'
import { env } from '~/config/env'
import { EmailService } from '~/email/email.service'
import { ExportExcelService } from '~/export-excel/export-excel.service'
import { TPowerpointPlaceholders } from '~/schemas/export-powerpoint/export-powerpoint'
import { SimulationsService } from '~/simulations/simulations.service'
import { ChartGenerationService } from './chart-generation/chart-generation.service'
import { ExportPowerpointController } from './export-powerpoint.controller'
import { ExportPowerpointService } from './export-powerpoint.service'
import { PlaceholderGenerationService } from './placeholder-generation/placeholder-generation.service'
import { PowerpointDeliveries } from './powerpoint-deliveries'
import { PowerpointRequestsService } from './powerpoint-requests.service'
import { ZipService } from './zip/zip.service'

/**
 * Le PowerPoint sort-il toujours, graphiques compris ?
 *
 * Seule suite qui lance un vrai Chrome : `chrome-headless-shell`, installé au build
 * Scalingo et dont les bibliothèques système viennent de l'`Aptfile`. Un paquet
 * manquant n'apparaît qu'ici — le reste des tests simule la génération.
 *
 * Le chemin complet est réel du contrôleur HTTP jusqu'à la pièce jointe : gabarit,
 * remplacement des textes, rendu des graphiques, recompression. Seules les données
 * des diapositives sont figées : les calculer exigerait toute la base de référence
 * (INSEE, Sitadel, projections), sans rapport avec ce que ce test protège.
 */
describe('Export PowerPoint (e2e, vrai Chrome)', () => {
  let app: INestApplication
  let emailService: jest.Mocked<EmailService>
  let template: JSZip

  const SIMULATION_ID = 'simulation-e2e'

  const placeholders = {
    slide1: {
      text: { selectedEpciName: GRAND_CHALON.name, documentType: 'PLH', period: '2026 - 2032', date: '1 octobre 2026' },
    },
    slide12: {
      text: {},
      charts: [
        {
          type: 'bad-housing',
          templateImageFileName: 'image11.png',
          width: 700,
          height: 372,
          data: {
            name: GRAND_CHALON.name,
            noAccommodation: { total: 120 },
            hosted: { total: 340 },
            financialInadequation: 410,
            badQuality: 95,
            physicalInadequation: 230,
          },
        },
      ],
    },
  } as unknown as TPowerpointPlaceholders

  beforeAll(async () => {
    // Par le prototype : le service est instancié par requête, `app.get` ne l'atteint pas.
    jest.spyOn(ExportPowerpointService.prototype as never, 'generatePlaceholders').mockResolvedValue(placeholders as never)

    app = await createHttpTestApp(
      {
        imports: [ConfigModule.forRoot({ isGlobal: true, load: [() => env] })],
        controllers: [ExportPowerpointController],
        providers: [ExportPowerpointService, PlaceholderGenerationService, ChartGenerationService, ZipService, PowerpointDeliveries],
      },
      { id: 'user-e2e', role: 'USER', hasAccess: true, email: 'agent@ddt71.gouv.fr', firstname: 'Agnès', lastname: 'Martin' },
      {
        configure: (builder) =>
          builder.useMocker((token) => {
            if (token === SimulationsService) {
              return createMock<SimulationsService>({
                hasUserAccessToAll: async () => true,
                getMany: async () => [{ id: SIMULATION_ID, name: 'Scénario central' }] as never,
              })
            }
            if (token === PowerpointRequestsService) {
              return createMock<PowerpointRequestsService>({
                windowMinutes: 30,
                findReplaceable: async () => null,
                record: async () => 'demande-e2e',
              })
            }
            if (token === ExportExcelService) {
              return createMock<ExportExcelService>({
                exportScenario: async () => ({ workbook: { xlsx: { writeBuffer: async () => Buffer.from('xlsx') } } }) as never,
              })
            }
            return createMock(token as never)
          }),
      },
    )

    emailService = app.get(EmailService)
    template = await app.get(ZipService).unzipPptx()
  })

  afterAll(async () => {
    await app?.close()
    jest.restoreAllMocks()
  })

  it('joint au mail un PowerPoint valide, textes remplis et graphique rendu par Chrome', async () => {
    emailService.sendEmail.mockResolvedValue(undefined as never)

    const response = await request(app.getHttpServer())
      .post('/export-powerpoint')
      .send({
        nextStep: 'Présentation aux élus',
        resultDate: dayjs().add(1, 'month').format('YYYY-MM-DD'),
        selectedSimulations: [SIMULATION_ID],
        privilegedSimulation: SIMULATION_ID,
        documentType: 'PLH',
        periodStart: '2026',
        periodEnd: '2032',
        epci: { code: GRAND_CHALON.code, name: GRAND_CHALON.name },
      })

    expect(response.status).toBe(200)
    expect(response.body).toEqual({ success: true, message: 'PowerPoint request accepted' })

    // Le mail part après la réponse.
    await app.get(PowerpointDeliveries).settled()

    const { attachments } = emailService.sendEmail.mock.calls[0][0]
    const pptx = attachments?.find((attachment) => attachment.name.endsWith('.pptx'))
    expect(pptx).toBeDefined()

    // Un .pptx est une archive ZIP : elle doit se rouvrir et garder sa structure.
    const zip = await JSZip.loadAsync(Buffer.from(pptx!.content, 'base64'))
    expect(zip.file('ppt/presentation.xml')).not.toBeNull()
    expect(Object.keys(zip.files).filter((name) => /^ppt\/slides\/slide\d+\.xml$/.test(name))).toHaveLength(
      Object.keys(template.files).filter((name) => /^ppt\/slides\/slide\d+\.xml$/.test(name)).length,
    )

    const slide1 = await zip.file('ppt/slides/slide1.xml')!.async('text')
    expect(slide1).toContain('CA Le Grand Chalon')
    expect(slide1).not.toMatch(/\{\{(selectedEpciName|documentType|period|date)\}\}/)

    // Le graphique : une vraie image PNG, différente de celle du gabarit.
    const chart = await zip.file('ppt/media/image11.png')!.async('nodebuffer')
    const original = await template.file('ppt/media/image11.png')!.async('nodebuffer')
    expect(chart.subarray(0, 8)).toEqual(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))
    expect(chart.equals(original)).toBe(false)
    // Dimensions lues dans l'en-tête IHDR : au moins l'échelle 2, aux proportions demandées.
    const [width, height] = [chart.readUInt32BE(16), chart.readUInt32BE(20)]
    expect(width).toBeGreaterThanOrEqual(1400)
    expect(width / height).toBeCloseTo(700 / 372, 2)
  }, 60_000)
})
