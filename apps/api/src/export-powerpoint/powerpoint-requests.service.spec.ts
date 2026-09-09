import { ConfigService } from '@nestjs/config'
import { Test, TestingModule } from '@nestjs/testing'
import { PrismaService } from '~/db/prisma.service'
import { PowerpointRequestsService } from './powerpoint-requests.service'

const mockPrisma = {
  export: {
    findMany: jest.fn(),
    createMany: jest.fn(),
    updateMany: jest.fn(),
  },
  simulation: {
    findMany: jest.fn(),
  },
  epci: {
    findMany: jest.fn(),
  },
}

// 9 septembre 2026, 14 h à Paris (12 h UTC). Le début de journée français tombe
// donc à 22 h UTC la veille : de quoi vérifier que « le même jour » n'est pas
// calculé en UTC.
const NOW = new Date('2026-09-09T12:00:00Z')

const row = (overrides: Record<string, unknown> = {}) => ({
  id: 'export-1',
  requestId: 'request-1',
  createdAt: NOW,
  documentType: 'PLH',
  nextStep: 'Présentation aux élus',
  periodStart: 2026,
  periodEnd: 2032,
  epciCodes: ['200069672'],
  simulation: { name: 'Scénario haut' },
  ...overrides,
})

describe('PowerpointRequestsService', () => {
  let service: PowerpointRequestsService

  beforeEach(async () => {
    jest.useFakeTimers({ doNotFake: ['nextTick'] }).setSystemTime(NOW)

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PowerpointRequestsService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: ConfigService, useValue: { get: jest.fn(() => 30) } },
      ],
    }).compile()

    service = module.get<PowerpointRequestsService>(PowerpointRequestsService)
    jest.clearAllMocks()
    mockPrisma.epci.findMany.mockResolvedValue([{ name: 'CA Le Grand Chalon' }])
  })

  afterEach(() => jest.useRealTimers())

  const withSimulations = (simulations: Array<{ epciGroupId: string | null; name: string }>) =>
    mockPrisma.simulation.findMany.mockResolvedValue(simulations)

  describe('findReplaceable', () => {
    it("ne cherche pas de doublon quand aucune simulation n'est rattachée à un groupe EPCI", async () => {
      withSimulations([{ epciGroupId: null, name: 'Scénario haut' }])

      expect(await service.findReplaceable('user-1', ['sim-1'], ['200069672'])).toBeNull()
      expect(mockPrisma.export.findMany).not.toHaveBeenCalled()
    })

    it('signale une demande faite dans la fenêtre, qui est aussi du même jour', async () => {
      withSimulations([{ epciGroupId: 'group-1', name: 'Scénario bas' }])
      mockPrisma.export.findMany
        .mockResolvedValueOnce([row({ createdAt: new Date('2026-09-09T11:52:00Z'), simulation: { name: 'Scénario haut' } })])
        .mockResolvedValueOnce([])

      const replaceable = await service.findReplaceable('user-1', ['sim-1'], ['200069672'])

      expect(replaceable?.reasons).toEqual(['RECENT', 'SAME_DAY'])
      expect(replaceable?.epciNames).toEqual(['CA Le Grand Chalon'])
    })

    it('cumule les motifs quand le même livrable est redemandé quelques minutes plus tard', async () => {
      withSimulations([{ epciGroupId: 'group-1', name: 'Scénario haut' }])
      mockPrisma.export.findMany.mockResolvedValueOnce([row({ createdAt: new Date('2026-09-09T11:52:00Z') })]).mockResolvedValueOnce([])

      const replaceable = await service.findReplaceable('user-1', ['sim-1'], ['200069672'])

      expect(replaceable?.reasons).toEqual(['RECENT', 'SAME_DAY', 'SAME_SCENARIOS_AND_TERRITORY'])
    })

    it('signale une demande plus ancienne dans la journée sans la dire récente', async () => {
      withSimulations([{ epciGroupId: 'group-1', name: 'Scénario bas' }])
      mockPrisma.export.findMany
        .mockResolvedValueOnce([row({ createdAt: new Date('2026-09-09T08:00:00Z'), simulation: { name: 'Scénario haut' } })])
        .mockResolvedValueOnce([])

      const replaceable = await service.findReplaceable('user-1', ['sim-1'], ['200069672'])

      expect(replaceable?.reasons).toEqual(['SAME_DAY'])
    })

    it('borne la lecture datée au début de la journée française et non au début du jour UTC', async () => {
      withSimulations([{ epciGroupId: 'group-1', name: 'Scénario haut' }])
      mockPrisma.export.findMany.mockResolvedValue([])

      await service.findReplaceable('user-1', ['sim-1'], ['200069672'])

      const { where } = mockPrisma.export.findMany.mock.calls[0][0]
      expect(where.createdAt.gte).toEqual(new Date('2026-09-08T22:00:00Z'))
    })

    it('signale un livrable identique même des semaines plus tard', async () => {
      withSimulations([{ epciGroupId: 'group-1', name: 'Scénario haut' }])
      mockPrisma.export.findMany.mockResolvedValueOnce([]).mockResolvedValueOnce([row({ createdAt: new Date('2026-08-12T09:00:00Z') })])

      const replaceable = await service.findReplaceable('user-1', ['sim-1'], ['200069672'])

      expect(replaceable?.reasons).toEqual(['SAME_SCENARIOS_AND_TERRITORY'])
    })

    it('ne signale rien quand le territoire est identique mais les scénarios différents', async () => {
      withSimulations([{ epciGroupId: 'group-1', name: 'Scénario médian' }])
      mockPrisma.export.findMany
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([row({ createdAt: new Date('2026-08-12T09:00:00Z'), simulation: { name: 'Scénario haut' } })])

      expect(await service.findReplaceable('user-1', ['sim-1'], ['200069672'])).toBeNull()
    })

    it('compare les noms de scénarios sans tenir compte de la casse ni des espaces', async () => {
      withSimulations([{ epciGroupId: 'group-1', name: '  scénario HAUT ' }])
      mockPrisma.export.findMany
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([row({ createdAt: new Date('2026-08-12T09:00:00Z'), simulation: { name: 'Scénario haut' } })])

      const replaceable = await service.findReplaceable('user-1', ['sim-1'], ['200069672'])

      expect(replaceable?.reasons).toEqual(['SAME_SCENARIOS_AND_TERRITORY'])
    })

    it("ignore le contrôle de contenu sur les demandes antérieures à l'enregistrement du territoire", async () => {
      withSimulations([{ epciGroupId: 'group-1', name: 'Scénario haut' }])
      mockPrisma.export.findMany
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([row({ createdAt: new Date('2026-08-12T09:00:00Z'), epciCodes: [] })])

      expect(await service.findReplaceable('user-1', ['sim-1'], ['200069672'])).toBeNull()
    })

    it('ne compte pas deux fois les scénarios ramenés par les deux lectures', async () => {
      withSimulations([{ epciGroupId: 'group-1', name: 'Scénario haut' }])
      const shared = row({ createdAt: new Date('2026-09-09T11:52:00Z') })
      mockPrisma.export.findMany.mockResolvedValueOnce([shared]).mockResolvedValueOnce([shared])

      const replaceable = await service.findReplaceable('user-1', ['sim-1'], ['200069672'])

      expect(replaceable?.simulationNames).toEqual(['Scénario haut'])
    })

    it('propose la demande la plus récente quand plusieurs sont suspectes', async () => {
      withSimulations([{ epciGroupId: 'group-1', name: 'Scénario haut' }])
      mockPrisma.export.findMany
        .mockResolvedValueOnce([
          row({ id: 'recent', requestId: 'request-recent', createdAt: new Date('2026-09-09T11:52:00Z') }),
          row({ id: 'matin', requestId: 'request-matin', createdAt: new Date('2026-09-09T08:00:00Z') }),
        ])
        .mockResolvedValueOnce([row({ id: 'vieux', requestId: 'request-vieux', createdAt: new Date('2026-08-12T09:00:00Z') })])

      const replaceable = await service.findReplaceable('user-1', ['sim-1'], ['200069672'])

      expect(replaceable?.requestId).toBe('request-recent')
    })
  })

  describe('record', () => {
    it('donne un même requestId à toutes les lignes et ne marque privilégié que le scénario retenu', async () => {
      mockPrisma.export.createMany.mockResolvedValue({ count: 2 })

      const requestId = await service.record(['sim-1', 'sim-2'], { privilegedSimulationId: 'sim-2', documentType: 'SCoT' })

      const { data } = mockPrisma.export.createMany.mock.calls[0][0]
      expect(data.map((entry: { requestId: string }) => entry.requestId)).toEqual([requestId, requestId])
      expect(data.map((entry: { isPrivileged: boolean }) => entry.isPrivileged)).toEqual([false, true])
      expect(data[0].documentType).toBe('SCoT')
    })

    it('trie et dédoublonne les codes EPCI, la comparaison de territoires se faisant par égalité de tableaux', async () => {
      mockPrisma.export.createMany.mockResolvedValue({ count: 1 })

      await service.record(['sim-1'], { epciCodes: ['200069672', '200040590', '200069672'] })

      expect(mockPrisma.export.createMany.mock.calls[0][0].data[0].epciCodes).toEqual(['200040590', '200069672'])
    })
  })

  describe('supersede', () => {
    it('ne remplace que les lignes encore actives de la demande visée', async () => {
      await service.supersede('request-1', 'request-2')

      const { where, data } = mockPrisma.export.updateMany.mock.calls[0][0]
      expect(where).toEqual({ requestId: 'request-1', supersededAt: null })
      expect(data.supersededByRequestId).toBe('request-2')
      expect(data.supersededAt).toBeInstanceOf(Date)
    })
  })
})
