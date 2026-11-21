import { createMock } from '@golevelup/ts-jest'
import { BadRequestException, NotFoundException } from '@nestjs/common'
import { Test } from '@nestjs/testing'
import { AccommodationRatesService } from '~/accommodation-rates/accommodation-rates.service'
import { NeedsCalculationService } from '~/calculation/needs-calculation/needs-calculation.service'
import { DataPackVersionsService } from '~/data-pack-versions/data-pack-versions.service'
import { PrismaService } from '~/db/prisma.service'
import { DemographicEvolutionService } from '~/demographic-evolution/demographic-evolution.service'
import { ExternalService } from '~/external/external.service'
import { AmfService } from './amf.service'

const code = '200000172'

const observedRates = (v: number) => ({
  longTermVacancyRate: v,
  shortTermVacancyRate: v,
  txRs: v,
  urbanRenewal: 40000,
  restructuringRate: v,
  disappearanceRate: v,
  longTermVacantCount: 1234,
  vacancy: { nbAccommodation: 2000, year: 2024 },
})

const engineResults = (demographicEvolution: number) => ({
  total: demographicEvolution + 100,
  epcisTotals: [{ epciCode: code, total: demographicEvolution + 100, totalFlux: demographicEvolution + 100 }],
  flowRequirement: {
    epcis: [
      {
        code,
        totals: {
          demographicEvolution,
          renewalNeeds: 0,
          secondaryResidenceAccomodationEvolution: 100,
          shortTermVacantAccomodation: 50,
          longTermVacantAccomodation: -50,
        },
      },
    ],
  },
})

describe('AmfService', () => {
  let service: AmfService
  let prisma: jest.Mocked<PrismaService>
  let demographic: jest.Mocked<DemographicEvolutionService>
  let external: jest.Mocked<ExternalService>
  let rates: jest.Mocked<AccommodationRatesService>
  let needs: jest.Mocked<NeedsCalculationService>

  const mockProjection = (horizon: object) =>
    demographic.getDemographicEvolutionPopulationByEpci.mockResolvedValue({
      [code]: {
        data: [
          { year: 2022, central: 1, haute: 1, basse: 1 },
          { year: 2036, ...horizon },
        ],
        metadata: {},
      },
    } as never)

  beforeEach(async () => {
    prisma = createMock<PrismaService>()
    demographic = createMock<DemographicEvolutionService>()
    external = createMock<ExternalService>()
    rates = createMock<AccommodationRatesService>()
    needs = createMock<NeedsCalculationService>()
    const dataPacks = createMock<DataPackVersionsService>()
    dataPacks.getActive.mockResolvedValue({ millesime: '2022' } as never)
    ;(prisma.epci.findUnique as jest.Mock).mockResolvedValue({ code, name: 'CA Test', noInseeProjection: false })
    ;(prisma.rP.findMany as jest.Mock).mockResolvedValue([
      { year: 2011, population: 90000 },
      { year: 2016, population: 100000 },
      { year: 2022, population: 103000.4 },
    ])
    ;(prisma.amfLead.create as jest.Mock).mockResolvedValue({ id: '11111111-1111-4111-8111-111111111111' })
    mockProjection({ central: 457117, haute: 473584, basse: 441290 })
    rates.getAccommodationRates.mockResolvedValue({ [code]: observedRates(0.05) } as never)
    external.createSimulation.mockResolvedValue({
      id: 'sim-1',
      scenario: { b2_scenario: 'Central_C', epciScenarios: [{ epciCode: code, baseEpci: true }] },
      results: engineResults(1400),
    } as never)
    needs.calculate.mockResolvedValue(engineResults(2800) as never)

    const module = await Test.createTestingModule({
      providers: [
        AmfService,
        { provide: PrismaService, useValue: prisma },
        { provide: DataPackVersionsService, useValue: dataPacks },
        { provide: DemographicEvolutionService, useValue: demographic },
        { provide: ExternalService, useValue: external },
        { provide: AccommodationRatesService, useValue: rates },
        { provide: NeedsCalculationService, useValue: needs },
      ],
    }).compile()
    service = await module.resolve(AmfService)
  })

  describe('getEpci', () => {
    it('renvoie la population, son évolution récente et les populations projetées en 2036', async () => {
      const result = await service.getEpci(code)
      expect(demographic.getDemographicEvolutionPopulationByEpci).toHaveBeenCalledWith(code, '2022', [2022, 2036])
      expect(result).toEqual({
        code,
        name: 'CA Test',
        fragileProjection: false,
        baseYear: 2022,
        horizon: 2036,
        population: 103000,
        recentEvolution: { fromYear: 2016, toYear: 2022, rate: expect.closeTo(0.03, 5) },
        projectedPopulation: { haute: 473580, central: 457120, basse: 441290 },
        secondaryResidencesShare: 0.05,
        secondaryResidencesCount: 2000,
        longTermVacancy: { count: 1234, year: 2024 },
      })
    })

    it('renvoie un nombre de résidences secondaires nul sans parc Filocom', async () => {
      rates.getAccommodationRates.mockResolvedValue({ [code]: { ...observedRates(0.05), urbanRenewal: 0 } } as never)
      expect((await service.getEpci(code)).secondaryResidencesCount).toBeNull()
    })

    it('renvoie basse null quand la projection basse manque', async () => {
      mockProjection({ central: 457117, haute: 473584, basse: null })
      expect((await service.getEpci(code)).projectedPopulation.basse).toBeNull()
    })

    it('renvoie une évolution nulle sans deux recensements', async () => {
      ;(prisma.rP.findMany as jest.Mock).mockResolvedValue([{ year: 2022, population: 1000 }])
      const result = await service.getEpci(code)
      expect(result.population).toBe(1000)
      expect(result.recentEvolution).toBeNull()
    })

    it('signale une projection fragile', async () => {
      ;(prisma.epci.findUnique as jest.Mock).mockResolvedValue({ code, name: 'CA Test', noInseeProjection: true })
      expect((await service.getEpci(code)).fragileProjection).toBe(true)
    })

    it('lève NotFoundException pour un EPCI inconnu', async () => {
      ;(prisma.epci.findUnique as jest.Mock).mockResolvedValue(null)
      await expect(service.getEpci('999999999')).rejects.toThrow(NotFoundException)
    })

    it('lève NotFoundException sans projection haute ou centrale', async () => {
      mockProjection({ central: null, haute: 473584, basse: 441290 })
      await expect(service.getEpci(code)).rejects.toThrow(NotFoundException)
    })
  })

  describe('createSimulation et addContacts', () => {
    const body = {
      epciCode: code,
      email: 'a@b.fr',
      demography: 'plus',
      vacancy: 'non',
      badHousing: false,
      secondaryResidences: 'hausse',
    } as const

    it('enregistre la variante basse via ExternalService', async () => {
      await service.createSimulation('consumer-1', body)
      expect(rates.getAccommodationRates).toHaveBeenCalledWith(code, '2022')
      expect(external.createSimulation).toHaveBeenCalledTimes(1)
      expect(external.createSimulation).toHaveBeenCalledWith(
        'consumer-1',
        expect.objectContaining({ scenario: expect.objectContaining({ projection: 2036, b2_scenario: 'PH_C' }) }),
      )
    })

    it('calcule la variante haute en mémoire sur une copie de la simulation', async () => {
      await service.createSimulation('consumer-1', body)
      const simulation = needs.calculate.mock.calls[0][0]
      expect(simulation.id).toBe('sim-1')
      expect(simulation.scenario.b2_scenario).toBe('PH_H')
      expect(simulation.scenario.b1_horizon_resorption).toBe(2040)
      expect(simulation.scenario.epciScenarios[0].b2_tx_rs).toBeCloseTo(0.065)
      expect(simulation).not.toHaveProperty('results')
    })

    it('enregistre le lead lié à la simulation, sans e-mail dans answers', async () => {
      await service.createSimulation('consumer-1', body)
      const arg = (prisma.amfLead.create as jest.Mock).mock.calls[0][0]
      expect(arg.data.email).toBe('a@b.fr')
      expect(arg.data.simulationId).toBe('sim-1')
      expect(arg.data.answers).not.toHaveProperty('email')
    })

    it('enregistre le lead sans e-mail quand il n’est pas encore donné', async () => {
      const { email: _email, ...withoutEmail } = body
      await service.createSimulation('consumer-1', withoutEmail)
      const arg = (prisma.amfLead.create as jest.Mock).mock.calls[0][0]
      expect(arg.data.email).toBeNull()
    })

    it('renvoie leadId et la fourchette annuelle entre les deux variantes', async () => {
      const response = await service.createSimulation('consumer-1', body)
      expect(response.leadId).toBe('11111111-1111-4111-8111-111111111111')
      // (1 400 + 100) / 14 = 107 et (2 800 + 100) / 14 = 207.
      expect(response.result.annual).toEqual({ min: 110, max: 210 })
    })

    it('refuse une population basse sans projection basse', async () => {
      mockProjection({ central: 457117, haute: 473584, basse: null })
      await expect(service.createSimulation('consumer-1', { ...body, demography: 'moins' })).rejects.toThrow(BadRequestException)
      expect(external.createSimulation).not.toHaveBeenCalled()
    })

    it('enregistre l’e-mail du lead et les contacts partagés', async () => {
      ;(prisma.amfLead.findUnique as jest.Mock).mockResolvedValue({ id: 'lead-1', email: null })
      await service.addContacts('lead-1', { email: 'a@b.fr', contacts: [{ role: 'Maire', email: 'm@b.fr' }] })
      expect(prisma.amfLead.update).toHaveBeenCalledWith({ where: { id: 'lead-1' }, data: { email: 'a@b.fr' } })
      expect(prisma.amfSharedContact.createMany).toHaveBeenCalledWith({
        data: [{ leadId: 'lead-1', role: 'Maire', email: 'm@b.fr' }],
      })
    })

    it('n’écrase pas un e-mail déjà connu et accepte une liste de contacts vide', async () => {
      ;(prisma.amfLead.findUnique as jest.Mock).mockResolvedValue({ id: 'lead-1', email: 'old@b.fr' })
      await service.addContacts('lead-1', { email: 'a@b.fr', contacts: [] })
      expect(prisma.amfLead.update).not.toHaveBeenCalled()
      expect(prisma.amfSharedContact.createMany).not.toHaveBeenCalled()
    })

    it('lève NotFoundException pour un lead inconnu', async () => {
      ;(prisma.amfLead.findUnique as jest.Mock).mockResolvedValue(null)
      await expect(service.addContacts('nope', { email: 'a@b.fr', contacts: [{ role: 'Maire', email: 'm@b.fr' }] })).rejects.toThrow(
        NotFoundException,
      )
    })
  })
})
