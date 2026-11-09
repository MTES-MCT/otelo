import { createMock } from '@golevelup/ts-jest'
import { BadRequestException, NotFoundException } from '@nestjs/common'
import { Test } from '@nestjs/testing'
import { AccommodationRatesService } from '~/accommodation-rates/accommodation-rates.service'
import { DataPackVersionsService } from '~/data-pack-versions/data-pack-versions.service'
import { PrismaService } from '~/db/prisma.service'
import { DemographicEvolutionService } from '~/demographic-evolution/demographic-evolution.service'
import { ExternalService } from '~/external/external.service'
import { AmfService } from './amf.service'

describe('AmfService.getEpci', () => {
  const code = '200000172'
  let service: AmfService
  let prisma: jest.Mocked<PrismaService>
  let demographic: jest.Mocked<DemographicEvolutionService>

  const mockProjection = (base: object, horizon: object) => {
    demographic.getDemographicEvolutionPopulationByEpci.mockResolvedValue({
      [code]: {
        data: [
          { year: 2022, ...base },
          { year: 2036, ...horizon },
        ],
        metadata: {},
      },
      all: { data: [], metadata: {} },
    } as never)
  }

  beforeEach(async () => {
    prisma = createMock<PrismaService>()
    demographic = createMock<DemographicEvolutionService>()
    const dataPacks = createMock<DataPackVersionsService>()
    dataPacks.getActive.mockResolvedValue({ millesime: '2022' } as never)
    ;(prisma.epci.findUnique as jest.Mock).mockResolvedValue({ code, name: 'CA Test', noInseeProjection: false })

    const module = await Test.createTestingModule({
      providers: [
        AmfService,
        { provide: PrismaService, useValue: prisma },
        { provide: DataPackVersionsService, useValue: dataPacks },
        { provide: DemographicEvolutionService, useValue: demographic },
        { provide: ExternalService, useValue: createMock<ExternalService>() },
        { provide: AccommodationRatesService, useValue: createMock<AccommodationRatesService>() },
      ],
    }).compile()
    service = module.get(AmfService)
  })

  it('renvoie les évolutions en habitants arrondies entre base et 2036', async () => {
    mockProjection({ central: 448444, haute: 448444, basse: 448444 }, { central: 457117, haute: 473584, basse: 441290 })
    const result = await service.getEpci(code)
    expect(demographic.getDemographicEvolutionPopulationByEpci).toHaveBeenCalledWith(code, '2022', [2022, 2036])
    expect(result).toEqual({
      code,
      name: 'CA Test',
      fragileProjection: false,
      baseYear: 2022,
      horizon: 2036,
      populationChanges: { haute: 25140, central: 8670, basse: -7150 },
    })
  })

  it('renvoie basse null quand la projection basse manque', async () => {
    mockProjection({ central: 448444, haute: 448444, basse: null }, { central: 457117, haute: 473584, basse: null })
    const result = await service.getEpci(code)
    expect(result.populationChanges.basse).toBeNull()
  })

  it('signale une projection fragile', async () => {
    ;(prisma.epci.findUnique as jest.Mock).mockResolvedValue({ code, name: 'CA Test', noInseeProjection: true })
    mockProjection({ central: 100, haute: 100, basse: 100 }, { central: 200, haute: 200, basse: 200 })
    const result = await service.getEpci(code)
    expect(result.fragileProjection).toBe(true)
  })

  it('lève NotFoundException pour un EPCI inconnu', async () => {
    ;(prisma.epci.findUnique as jest.Mock).mockResolvedValue(null)
    await expect(service.getEpci('999999999')).rejects.toThrow(NotFoundException)
  })
})

describe('AmfService.createSimulation et addContacts', () => {
  const code = '200000172'
  const body = {
    epciCode: code,
    email: 'a@b.fr',
    demography: 'tendance',
    vacancy: 'non',
    badHousing: false,
    secondaryResidences: 'neutre',
  } as const
  let service: AmfService
  let prisma: jest.Mocked<PrismaService>
  let external: jest.Mocked<ExternalService>
  let rates: jest.Mocked<AccommodationRatesService>
  let demographic: jest.Mocked<DemographicEvolutionService>

  const rate = (v: number) => ({
    longTermVacancyRate: v,
    shortTermVacancyRate: v,
    txRs: v,
    restructuringRate: v,
    disappearanceRate: v,
  })

  const mockBasse = (basse: number | null) =>
    demographic.getDemographicEvolutionPopulationByEpci.mockResolvedValue({
      [code]: {
        data: [
          { year: 2022, central: 100, haute: 100, basse: basse === null ? null : 100 },
          { year: 2036, central: 200, haute: 300, basse },
        ],
        metadata: {},
      },
    } as never)

  beforeEach(async () => {
    prisma = createMock<PrismaService>()
    external = createMock<ExternalService>()
    rates = createMock<AccommodationRatesService>()
    demographic = createMock<DemographicEvolutionService>()
    const dataPacks = createMock<DataPackVersionsService>()
    dataPacks.getActive.mockResolvedValue({ millesime: '2022' } as never)
    ;(prisma.epci.findUnique as jest.Mock).mockResolvedValue({ code, name: 'CA Test', noInseeProjection: false })
    ;(prisma.amfLead.create as jest.Mock).mockResolvedValue({ id: '11111111-1111-4111-8111-111111111111' })
    mockBasse(50)
    rates.getAccommodationRates.mockResolvedValue({ [code]: rate(0.05) } as never)
    external.createSimulation.mockResolvedValue({
      id: 'sim-1',
      results: {
        total: 1000,
        epcisTotals: [{ epciCode: code, total: 1000, totalFlux: 900 }],
        flowRequirement: {
          epcis: [
            {
              code,
              totals: {
                demographicEvolution: 800,
                renewalNeeds: 0,
                secondaryResidenceAccomodationEvolution: 100,
                shortTermVacantAccomodation: 50,
                longTermVacantAccomodation: -50,
              },
            },
          ],
        },
      },
    } as never)

    const module = await Test.createTestingModule({
      providers: [
        AmfService,
        { provide: PrismaService, useValue: prisma },
        { provide: DataPackVersionsService, useValue: dataPacks },
        { provide: DemographicEvolutionService, useValue: demographic },
        { provide: ExternalService, useValue: external },
        { provide: AccommodationRatesService, useValue: rates },
      ],
    }).compile()
    service = module.get(AmfService)
  })

  it('crée la simulation via ExternalService avec le consumer et les taux observés', async () => {
    await service.createSimulation('consumer-1', { ...body, demography: 'plus' }).catch(() => undefined)
    expect(rates.getAccommodationRates).toHaveBeenCalledWith(code, '2022')
    expect(external.createSimulation).toHaveBeenCalledWith(
      'consumer-1',
      expect.objectContaining({ scenario: expect.objectContaining({ projection: 2036, b2_scenario: 'PH_C' }) }),
    )
  })

  it('enregistre le lead lié à la simulation, sans e-mail dans answers', async () => {
    await service.createSimulation('consumer-1', body).catch(() => undefined)
    const arg = (prisma.amfLead.create as jest.Mock).mock.calls[0][0]
    expect(arg.data.email).toBe('a@b.fr')
    expect(arg.data.simulationId).toBe('sim-1')
    expect(arg.data.answers).not.toHaveProperty('email')
  })

  it('renvoie leadId et le résultat calculé', async () => {
    const response = await service.createSimulation('consumer-1', body)
    expect(response.leadId).toBe('11111111-1111-4111-8111-111111111111')
    expect(response.result.total).toBe(1000)
    expect(response.result.baseYear).toBe(2022)
  })

  it('refuse moins d’habitants sans projection basse', async () => {
    mockBasse(null)
    await expect(service.createSimulation('consumer-1', { ...body, demography: 'moins' })).rejects.toThrow(BadRequestException)
    expect(external.createSimulation).not.toHaveBeenCalled()
  })

  it('calcule même quand les taux observés sont à 0', async () => {
    rates.getAccommodationRates.mockResolvedValue({ [code]: rate(0) } as never)
    await expect(service.createSimulation('consumer-1', body)).resolves.toBeDefined()
  })

  it('enregistre les contacts partagés', async () => {
    ;(prisma.amfLead.findUnique as jest.Mock).mockResolvedValue({ id: 'lead-1' })
    await service.addContacts('lead-1', { contacts: [{ role: 'Maire', email: 'm@b.fr' }] })
    expect(prisma.amfSharedContact.createMany).toHaveBeenCalledWith({
      data: [{ leadId: 'lead-1', role: 'Maire', email: 'm@b.fr' }],
    })
  })

  it('lève NotFoundException pour un lead inconnu', async () => {
    ;(prisma.amfLead.findUnique as jest.Mock).mockResolvedValue(null)
    await expect(service.addContacts('nope', { contacts: [{ role: 'Maire', email: 'm@b.fr' }] })).rejects.toThrow(NotFoundException)
  })
})
