import { createMock } from '@golevelup/ts-jest'
import { INestApplication } from '@nestjs/common'
import { createHttpTestApp } from '@test/http-app'
import request from 'supertest'
import { SimulationsController } from './simulations.controller'
import { SimulationsService } from './simulations.service'

describe('SimulationsController (contrat HTTP)', () => {
  let app: INestApplication
  let service: jest.Mocked<SimulationsService>

  beforeEach(async () => {
    service = createMock<SimulationsService>()
    service.update.mockResolvedValue({ id: 'sim-1' } as never)
    service.create.mockResolvedValue({ id: 'sim-1' } as never)
    service.rename.mockResolvedValue({ id: 'sim-1' } as never)
    service.clone.mockResolvedValue({ id: 'sim-2' } as never)
    service.actualize.mockResolvedValue({ id: 'sim-3' } as never)

    app = await createHttpTestApp({
      controllers: [SimulationsController],
      providers: [{ provide: SimulationsService, useValue: service }],
    })
  })

  afterEach(async () => {
    await app.close()
  })

  const putScenario = (body: Record<string, unknown>) => request(app.getHttpServer()).put('/simulations/sim-1/scenario').send(body)

  describe('PUT /simulations/:id/scenario', () => {
    /** `useUpdateDemographicSimulation` : quatre champs, et `epciScenarios` indexé. */
    it('should accept what the demographic screen sends', async () => {
      const response = await putScenario({
        b2_scenario: 'Central B',
        epciScenarios: {
          '200069672': { b2_tx_rs: 2.5, b2_tx_vacance: 7.1 },
        },
        id: 'scenario-1',
        projection: 2030,
      })

      expect(response.status).toBe(202)
      expect(service.update).toHaveBeenCalledTimes(1)
    })

    /** `useUpdateBadHousingSimulation` : les paramètres de besoin, sans le volet démographique. */
    it('should accept what the bad-housing screen sends', async () => {
      const response = await putScenario({
        b11_etablissement: [],
        b11_fortune: true,
        b11_hotel: true,
        b11_part_etablissement: 0.5,
        b11_sa: false,
        b12_cohab_interg_subie: 0.3,
        b12_heberg_particulier: true,
        b12_heberg_temporaire: false,
        b13_acc: true,
        b13_plp: false,
        b13_taux_effort: 30,
        b13_taux_reallocation: 10,
        b14_confort: 'RP_abs_sani',
        b14_occupation: 'proprietaire',
        b14_taux_reallocation: 10,
        b15_loc_hors_hlm: true,
        b15_proprietaire: true,
        b15_surocc: 'Mod',
        b15_taux_reallocation: 10,
        b1_horizon_resorption: 10,
        id: 'scenario-1',
        source_b11: 'RP',
        source_b14: 'RP',
        source_b15: 'RP',
      })

      expect(response.status).toBe(202)
      expect(service.update).toHaveBeenCalledTimes(1)
    })

    /**
     * Le contrôle d'accès porte sur l'identifiant de l'URL : une cible dans le corps
     * permettait d'écrire dans le scénario d'autrui.
     */
    it('should ignore a scenario id smuggled in the body', async () => {
      const response = await putScenario({ id: 'scenario-de-la-victime', projection: 2050 })

      expect(response.status).toBe(202)
      const [urlId, body] = service.update.mock.calls[0] as [string, Record<string, unknown>]
      expect(urlId).toBe('sim-1')
      expect(body).not.toHaveProperty('id')
    })

    it('should accept a body carrying only what changed', async () => {
      const response = await putScenario({ projection: 2030 })

      expect(response.status).toBe(202)
    })

    it('should refuse a rate that is not a number', async () => {
      const response = await putScenario({ id: 'scenario-1', projection: 'bientôt' })

      expect(response.status).toBe(400)
      expect(service.update).not.toHaveBeenCalled()
    })

    it('should refuse the array shape that only reads apply to', async () => {
      const response = await putScenario({
        epciScenarios: [{ b2_tx_rs: 2.5, epciCode: '200069672' }],
        id: 'scenario-1',
      })

      expect(response.status).toBe(400)
    })
  })

  describe('PATCH /simulations/:id/name', () => {
    it('should accept a rename', async () => {
      const response = await request(app.getHttpServer()).patch('/simulations/sim-1/name').send({ name: 'Scénario haut' })

      expect(response.status).toBe(200)
      expect(service.rename).toHaveBeenCalledWith('user-test', 'sim-1', 'Scénario haut')
    })

    /** Le nom est recopié dans le courriel PowerPoint et dans les pages rendues par Puppeteer. */
    it('should refuse a name longer than the field allows', async () => {
      const response = await request(app.getHttpServer())
        .patch('/simulations/sim-1/name')
        .send({ name: 'a'.repeat(101) })

      expect(response.status).toBe(400)
      expect(service.rename).not.toHaveBeenCalled()
    })

    it('should refuse an empty name', async () => {
      const response = await request(app.getHttpServer()).patch('/simulations/sim-1/name').send({ name: '' })

      expect(response.status).toBe(400)
    })
  })

  describe('POST /simulations/:id/clone', () => {
    it('should accept a clone with its new name', async () => {
      const response = await request(app.getHttpServer()).post('/simulations/sim-1/clone').send({ name: 'Copie du scénario' })

      expect(response.status).toBe(201)
    })

    it('should refuse a clone without a name', async () => {
      const response = await request(app.getHttpServer()).post('/simulations/sim-1/clone').send({})

      expect(response.status).toBe(400)
    })
  })

  describe('POST /simulations/:id/actualize', () => {
    it('should accept an actualisation, whose name is optional', async () => {
      const response = await request(app.getHttpServer()).post('/simulations/sim-1/actualize').send({ millesime: '2021' })

      expect(response.status).toBe(201)
      expect(service.actualize).toHaveBeenCalledWith('user-test', 'sim-1', '2021', undefined)
    })

    it('should refuse an actualisation without its millésime', async () => {
      const response = await request(app.getHttpServer()).post('/simulations/sim-1/actualize').send({ name: 'Sans millésime' })

      expect(response.status).toBe(400)
    })
  })

  describe('POST /simulations', () => {
    /** Le corps que `ZInitSimulationDto` (apps/web) produit. */
    const realPayload = (overrides: Record<string, unknown> = {}) => ({
      epci: [{ code: '200069672' }],
      millesime: '2021',
      name: 'Mon scénario',
      scenario: {
        b2_scenario: 'Central B',
        epcis: {
          '200069672': {
            b2_tx_disparition: 0.1,
            b2_tx_restructuration: 0.2,
            b2_tx_rs: 2.5,
            b2_tx_vacance: 7.1,
            b2_tx_vacance_courte: 3.1,
            b2_tx_vacance_longue: 4,
            baseEpci: true,
          },
        },
        projection: 2030,
      },
      ...overrides,
    })

    const post = (body: Record<string, unknown>) => request(app.getHttpServer()).post('/simulations').send(body)

    it('should accept what the creation form sends', async () => {
      const response = await post(realPayload())

      expect(response.status).toBe(201)
      expect(service.create).toHaveBeenCalledTimes(1)
    })

    it('should accept the optional fields of a territory group', async () => {
      const response = await post(
        realPayload({
          epciGroupName: 'SCoT du Chalonnais',
          planningDocumentName: 'PLUi du Grand Chalon',
          planningDocumentType: 'PLH_PLUI',
          worksOnPlanningDocument: true,
        }),
      )

      expect(response.status).toBe(201)
    })

    /** Zod retire ce qu'il ne déclare pas : un taux manquant retomberait sur le défaut de la base. */
    it('should carry every rate through to the service, not just the two it used to declare', async () => {
      await post(realPayload())

      const [, data] = service.create.mock.calls[0] as [string, { scenario: { epcis: Record<string, object> } }]
      expect(data.scenario.epcis['200069672']).toEqual({
        b2_tx_disparition: 0.1,
        b2_tx_restructuration: 0.2,
        b2_tx_rs: 2.5,
        b2_tx_vacance: 7.1,
        b2_tx_vacance_courte: 3.1,
        b2_tx_vacance_longue: 4,
        baseEpci: true,
      })
    })

    it('should refuse a creation with no territory', async () => {
      const response = await post(realPayload({ epci: [] }))

      expect(response.status).toBe(400)
      expect(service.create).not.toHaveBeenCalled()
    })

    it('should refuse a creation with no name, rather than fail on the NOT NULL column', async () => {
      const { name: _name, ...withoutName } = realPayload()

      const response = await post(withoutName)

      expect(response.status).toBe(400)
      expect(service.create).not.toHaveBeenCalled()
    })
  })
})
