import { ForbiddenException, Injectable } from '@nestjs/common'
import { TEpci } from '@shared'
import { AccommodationRatesService } from '~/accommodation-rates/accommodation-rates.service'
import {
  omphaleMap,
  populationMap,
} from '~/calculation/needs-calculation/besoins-flux/evolution-demographique-b21/demographic-evolution.service'
import { PrismaService } from '~/db/prisma.service'
import { EpciGroupsService } from '~/epci-groups/epci-groups.service'
import { Simulation } from '~/generated/prisma/client'
import { ScenariosService } from '~/scenarios/scenarios.service'
import { TUpdateSimulationDto } from '~/schemas/scenarios/scenario'
import { TInitSimulation } from '~/schemas/simulations/create-simulation'
import {
  TCloneSimulationDto,
  TSimulationDashboardItem,
  TSimulationDashboardSummary,
  TSimulationWithEpci,
  TSimulationWithEpciAndScenario,
} from '~/schemas/simulations/simulation'

interface CachedSimulationResultRow {
  simulationId: string
  epciCode: string
  total: number
  vacantAccomodation: number
  secondaryAccommodation: number
  flowTotals: unknown
  flowDataByYear: unknown
}
@Injectable()
export class SimulationsService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly scenariosService: ScenariosService,
    private readonly epciGroupsService: EpciGroupsService,
    private readonly accommodationRatesService: AccommodationRatesService,
  ) {}

  async hasUserAccessTo(id: string, userId: string): Promise<boolean> {
    return !!(await this.prismaService.simulation.findFirst({
      where: { id, userId },
    }))
  }

  async hasUserAccessToAll(ids: string[], userId: string): Promise<boolean> {
    const count = await this.prismaService.simulation.count({
      where: { id: { in: ids }, userId },
    })
    return count === ids.length
  }

  async list(userId: string): Promise<TSimulationWithEpci[]> {
    const simulations = await this.prismaService.simulation.findMany({
      select: {
        createdAt: true,
        name: true,
        epcis: { select: { code: true, name: true, region: true, bassinName: true } },
        scenario: { select: { b2_scenario: true, projection: true, millesime: true } },
        id: true,
        updatedAt: true,
        userId: true,
        epciGroup: { select: { id: true, name: true } },
      },
      where: { userId, deleted: null },
      orderBy: { updatedAt: 'desc' },
    })

    return simulations.map((simulation) => ({
      ...simulation,
      epciGroup: simulation.epciGroup || undefined,
    }))
  }

  async get(id: string): Promise<TSimulationWithEpciAndScenario> {
    const simulation = await this.prismaService.simulation.findUniqueOrThrow({
      include: {
        epcis: { select: { code: true, name: true, bassinName: true } },
        scenario: { include: { demographicEvolutionOmphaleCustom: true } },
      },
      where: { id, deleted: null },
    })
    const scenario = await this.scenariosService.get(simulation.scenario.id)

    const sortedEpcis = simulation.epcis.sort((a, b) => {
      const aScenario = scenario.epciScenarios.find((s) => s.epciCode === a.code)
      const bScenario = scenario.epciScenarios.find((s) => s.epciCode === b.code)

      if (!aScenario || !bScenario) return 0
      if (aScenario.baseEpci === bScenario.baseEpci) return 0
      return aScenario.baseEpci ? -1 : 1
    })

    return {
      name: simulation.name,
      createdAt: simulation.createdAt,
      epcis: sortedEpcis,
      id: simulation.id,
      userId: simulation.userId,
      scenario: scenario as TSimulationWithEpciAndScenario['scenario'],
      updatedAt: simulation.updatedAt,
    }
  }

  async getMany(ids: string[]): Promise<TSimulationWithEpciAndScenario[]> {
    const simulations = await this.prismaService.simulation.findMany({
      include: {
        epcis: { select: { code: true, name: true, bassinName: true } },
        scenario: { include: { epciScenarios: true, demographicEvolutionOmphaleCustom: true } },
      },
      where: { id: { in: ids }, deleted: null },
    })

    return simulations as TSimulationWithEpciAndScenario[]
  }

  async getScenario(id: string) {
    const simulation = await this.prismaService.simulation.findUniqueOrThrow({
      include: { scenario: { select: { id: true } } },
      where: { id, deleted: null },
    })
    const scenario = await this.scenariosService.get(simulation.scenario.id)
    return { id, scenario }
  }

  async create(userId: string, data: TInitSimulation): Promise<Simulation> {
    let epciGroupId = data.epciGroupId

    if (epciGroupId) {
      const hasAccess = await this.epciGroupsService.hasUserAccessTo(epciGroupId, userId)
      if (!hasAccess) {
        throw new ForbiddenException()
      }
    }

    const scenario = await this.scenariosService.create(userId, data.scenario, data.millesime)

    if (data.epciGroupName && !epciGroupId) {
      const epciGroup = await this.epciGroupsService.create(userId, {
        name: data.epciGroupName,
        epciCodes: data.epci.map((epci) => epci.code),
      })
      epciGroupId = epciGroup.id
    }

    return this.prismaService.simulation.create({
      data: {
        epcis: {
          connect: data.epci.map((epci) => ({ code: epci.code })),
        },
        name: data.name,
        scenario: { connect: { id: scenario.id } },
        user: { connect: { id: userId } },
        ...(epciGroupId && { epciGroup: { connect: { id: epciGroupId } } }),
      },
    })
  }

  async update(id: string, data: TUpdateSimulationDto): Promise<TSimulationWithEpciAndScenario> {
    await this.scenariosService.update(data.id, data)
    return this.get(id)
  }

  async rename(userId: string, id: string, name: string): Promise<Simulation> {
    return this.prismaService.simulation.update({
      where: { id, userId },
      data: { name },
    })
  }

  async delete(userId: string, id: string): Promise<Simulation> {
    const simulation = await this.prismaService.simulation.update({
      where: { id, userId },
      data: { deleted: new Date() },
    })

    if (simulation.epciGroupId) {
      const remainingCount = await this.prismaService.simulation.count({
        where: { epciGroupId: simulation.epciGroupId, deleted: null },
      })

      if (remainingCount === 0) {
        await this.prismaService.epciGroup.update({
          where: { id: simulation.epciGroupId },
          data: { deleted: new Date() },
        })
      }
    }

    return simulation
  }

  async clone(userId: string, originalId: string, data: TCloneSimulationDto): Promise<Simulation> {
    const originalSimulation = await this.prismaService.simulation.findUniqueOrThrow({
      include: {
        scenario: { include: { epciScenarios: true } },
        epcis: { select: { code: true } },
      },
      where: { id: originalId, userId },
    })

    const { userId: _, id, millesime: originalMillesime, ...scenarioData } = originalSimulation.scenario

    const clonedScenario = await this.scenariosService.create(
      userId,
      {
        ...scenarioData,
        epcis: originalSimulation.scenario.epciScenarios.reduce((acc, epciScenario) => {
          acc[epciScenario.epciCode] = {
            b2_tx_rs: epciScenario.b2_tx_rs,
            b2_tx_vacance: epciScenario.b2_tx_vacance,
            b2_tx_vacance_longue: epciScenario.b2_tx_vacance_longue,
            b2_tx_vacance_courte: epciScenario.b2_tx_vacance_courte,
            b2_tx_disparition: epciScenario.b2_tx_disparition,
            b2_tx_restructuration: epciScenario.b2_tx_restructuration,
            baseEpci: epciScenario.baseEpci,
          }
          return acc
        }, {}),
      },
      originalMillesime,
    )

    return this.prismaService.simulation.create({
      data: {
        name: data.name,
        epcis: {
          connect: originalSimulation.epcis.map((epci) => ({ code: epci.code })),
        },
        scenario: { connect: { id: clonedScenario.id } },
        user: { connect: { id: userId } },
        ...(originalSimulation.epciGroupId && { epciGroup: { connect: { id: originalSimulation.epciGroupId } } }),
      },
    })
  }

  async actualize(userId: string, originalId: string, targetMillesime: string, name?: string): Promise<Simulation> {
    const original = await this.prismaService.simulation.findUniqueOrThrow({
      where: { id: originalId, userId },
      include: {
        epcis: { select: { code: true } },
        scenario: { select: { millesime: true, epciScenarios: true } },
      },
    })
    const cloneName = name || `${original.name} (millésime ${targetMillesime})`
    const cloned = await this.clone(userId, originalId, {
      name: cloneName,
    })
    const clonedSimulation = await this.prismaService.simulation.findUniqueOrThrow({
      where: { id: cloned.id },
      select: { scenarioId: true },
    })

    // Update millesime on the cloned scenario
    await this.prismaService.scenario.update({
      where: { id: clonedSimulation.scenarioId },
      data: { millesime: targetMillesime },
    })

    const epciCodes = original.epcis.map((e) => e.code)

    // Fetch raw rates for both the original and target millesimes
    const [originalRawRates, freshRates] = await Promise.all([
      this.accommodationRatesService.getAccommodationRates(epciCodes.join(','), original.scenario.millesime),
      this.accommodationRatesService.getAccommodationRates(epciCodes.join(','), targetMillesime),
    ])

    // Update each epciScenario with fresh rates, preserving user-applied reduction ratios
    await Promise.all(
      epciCodes.map((epciCode) => {
        const fresh = freshRates[epciCode]
        const originalRaw = originalRawRates[epciCode]
        const originalEpci = original.scenario.epciScenarios.find((e) => e.epciCode === epciCode)

        if (!fresh || !originalRaw || !originalEpci) return Promise.resolve()

        const ratio = (stored: number, raw: number) => (raw > 0 ? stored / raw : 1)

        return this.prismaService.ePCIScenario.updateMany({
          where: { scenarioId: clonedSimulation.scenarioId, epciCode },
          data: {
            b2_tx_rs: fresh.txRs * ratio(originalEpci.b2_tx_rs, originalRaw.txRs),
            b2_tx_vacance: fresh.vacancyRate * ratio(originalEpci.b2_tx_vacance, originalRaw.vacancyRate),
            b2_tx_vacance_longue: fresh.longTermVacancyRate * ratio(originalEpci.b2_tx_vacance_longue, originalRaw.longTermVacancyRate),
            b2_tx_vacance_courte: fresh.shortTermVacancyRate * ratio(originalEpci.b2_tx_vacance_courte, originalRaw.shortTermVacancyRate),
            b2_tx_restructuration: fresh.restructuringRate * ratio(originalEpci.b2_tx_restructuration, originalRaw.restructuringRate),
            b2_tx_disparition: fresh.disappearanceRate * ratio(originalEpci.b2_tx_disparition, originalRaw.disappearanceRate),
          },
        })
      }),
    )

    return cloned
  }

  /**
   * Gets the list of simulations for a user and groups them by their epciGroup ID.
   * Each simulation is enriched with a dashboard summary (constructions neuves,
   * logements remobilisés, population/ménages à projection, pic des ménages) read
   * from the cached SimulationResults rows populated by the Synthèse des besoins page.
   */
  async getDashboardList(userId: string): Promise<
    Array<{
      id: string
      name: string
      simulations: TSimulationDashboardItem[]
      epcis: Omit<TEpci, 'region'>[]
    }>
  > {
    const rawSimulations = await this.prismaService.simulation.findMany({
      select: {
        createdAt: true,
        name: true,
        epcis: { select: { code: true, name: true, bassinName: true } },
        scenario: {
          select: {
            b2_scenario: true,
            projection: true,
            millesime: true,
            b1_horizon_resorption: true,
            epciScenarios: {
              select: { epciCode: true, b2_tx_rs: true, b2_tx_vacance: true, b2_tx_vacance_longue: true },
            },
          },
        },
        id: true,
        updatedAt: true,
        userId: true,
        epciGroup: { select: { id: true, name: true } },
      },
      where: { userId, deleted: null },
      orderBy: { updatedAt: 'desc' },
    })

    const simulationIds = rawSimulations.map((s) => s.id)

    const [cachedResults, omphaleLookup, populationLookup, baselineRatesLookup] = await Promise.all([
      this.loadCachedSimulationResults(simulationIds),
      this.loadOmphaleByProjection(rawSimulations),
      this.loadPopulationByProjection(rawSimulations),
      this.loadBaselineRatesByMillesime(rawSimulations),
    ])

    const enrichedSimulations: TSimulationDashboardItem[] = rawSimulations.map((sim) => {
      const resultsForSim = cachedResults.get(sim.id) ?? []
      const summary = this.buildDashboardSummary(sim, resultsForSim, omphaleLookup, populationLookup)
      const baselineByEpci = sim.scenario ? (baselineRatesLookup.get(sim.scenario.millesime) ?? {}) : {}
      const enrichedScenario = sim.scenario
        ? {
            ...sim.scenario,
            epciScenarios: sim.scenario.epciScenarios.map((es) => {
              const baseline = baselineByEpci[es.epciCode]
              return baseline ? { ...es, baseline } : es
            }),
          }
        : sim.scenario
      return {
        createdAt: sim.createdAt,
        id: sim.id,
        name: sim.name,
        updatedAt: sim.updatedAt,
        userId: sim.userId,
        epcis: sim.epcis,
        scenario: enrichedScenario,
        epciGroup: sim.epciGroup || undefined,
        summary,
      }
    })

    const groupedSimulations: Array<{
      id: string
      name: string
      simulations: TSimulationDashboardItem[]
      epcis: Omit<TEpci, 'region'>[]
    }> = []

    const simulationsByGroupId: Record<string, TSimulationDashboardItem[]> = {}

    enrichedSimulations.forEach((simulation) => {
      const groupId = simulation.epciGroup?.id || 'autres'
      simulationsByGroupId[groupId] = simulationsByGroupId[groupId] || []
      simulationsByGroupId[groupId].push(simulation)
    })

    Object.entries(simulationsByGroupId).forEach(([groupId, sims]) => {
      const allEpcis = sims.flatMap((sim) => sim.epcis)
      const uniqueEpcis = Array.from(new Map(allEpcis.map((epci) => [epci.code, epci])).values())

      if (groupId === 'autres') {
        groupedSimulations.push({ id: 'autres', name: 'Autres', simulations: sims, epcis: uniqueEpcis })
      } else {
        const groupName = sims[0].epciGroup?.name || 'Unknown'
        groupedSimulations.push({ id: groupId, name: groupName, simulations: sims, epcis: uniqueEpcis })
      }
    })

    return groupedSimulations
  }

  private async loadCachedSimulationResults(simulationIds: string[]) {
    if (simulationIds.length === 0) return new Map<string, Array<CachedSimulationResultRow>>()

    const rows = await this.prismaService.simulationResults.findMany({
      where: { simulationId: { in: simulationIds } },
      select: {
        simulationId: true,
        epciCode: true,
        total: true,
        vacantAccomodation: true,
        secondaryAccommodation: true,
        flowTotals: true,
        flowDataByYear: true,
      },
    })

    const map = new Map<string, Array<CachedSimulationResultRow>>()
    for (const row of rows) {
      const list = map.get(row.simulationId) ?? []
      list.push(row as CachedSimulationResultRow)
      map.set(row.simulationId, list)
    }
    return map
  }

  private async loadOmphaleByProjection(
    simulations: Array<{ scenario: { millesime: string; projection: number } | null; epcis: Array<{ code: string }> }>,
  ): Promise<Map<string, Record<string, Record<string, number | null>>>> {
    const grouped = this.groupEpcisByProjectionKey(simulations)
    const result = new Map<string, Record<string, Record<string, number | null>>>()

    await Promise.all(
      Array.from(grouped.entries()).map(async ([key, { millesime, year, epciCodes }]) => {
        if (epciCodes.length === 0) {
          result.set(key, {})
          return
        }
        const rows = await this.prismaService.demographicEvolutionOmphale.findMany({
          where: { epciCode: { in: epciCodes }, year, millesime },
          select: {
            epciCode: true,
            centralB: true,
            centralC: true,
            centralH: true,
            pbB: true,
            pbC: true,
            pbH: true,
            phB: true,
            phC: true,
            phH: true,
          },
        })
        const byEpci: Record<string, Record<string, number | null>> = {}
        for (const r of rows) {
          const { epciCode, ...values } = r
          byEpci[epciCode] = values
        }
        result.set(key, byEpci)
      }),
    )

    return result
  }

  private async loadPopulationByProjection(
    simulations: Array<{ scenario: { millesime: string; projection: number } | null; epcis: Array<{ code: string }> }>,
  ): Promise<Map<string, Record<string, { central: number | null; haute: number | null; basse: number | null }>>> {
    const grouped = this.groupEpcisByProjectionKey(simulations)
    const result = new Map<string, Record<string, { central: number | null; haute: number | null; basse: number | null }>>()

    await Promise.all(
      Array.from(grouped.entries()).map(async ([key, { millesime, year, epciCodes }]) => {
        if (epciCodes.length === 0) {
          result.set(key, {})
          return
        }
        const rows = await this.prismaService.demographicEvolutionPopulation.findMany({
          where: { epciCode: { in: epciCodes }, year, millesime },
          select: { epciCode: true, central: true, haute: true, basse: true },
        })
        const byEpci: Record<string, { central: number | null; haute: number | null; basse: number | null }> = {}
        for (const r of rows) {
          byEpci[r.epciCode] = { central: r.central, haute: r.haute, basse: r.basse }
        }
        result.set(key, byEpci)
      }),
    )

    return result
  }

  private async loadBaselineRatesByMillesime(
    simulations: Array<{ scenario: { millesime: string } | null; epcis: Array<{ code: string }> }>,
  ): Promise<Map<string, Record<string, { vacancyRate: number; txRs: number; longTermVacancyRate: number }>>> {
    const grouped = new Map<string, Set<string>>()
    for (const sim of simulations) {
      if (!sim.scenario) continue
      const set = grouped.get(sim.scenario.millesime) ?? new Set<string>()
      for (const epci of sim.epcis) set.add(epci.code)
      grouped.set(sim.scenario.millesime, set)
    }

    const result = new Map<string, Record<string, { vacancyRate: number; txRs: number; longTermVacancyRate: number }>>()
    await Promise.all(
      Array.from(grouped.entries()).map(async ([millesime, epciSet]) => {
        const epciCodes = Array.from(epciSet)
        if (epciCodes.length === 0) {
          result.set(millesime, {})
          return
        }
        const rates = await this.accommodationRatesService.getAccommodationRates(epciCodes.join(','), millesime)
        const byEpci: Record<string, { vacancyRate: number; txRs: number; longTermVacancyRate: number }> = {}
        for (const [epciCode, r] of Object.entries(rates)) {
          byEpci[epciCode] = { vacancyRate: r.vacancyRate, txRs: r.txRs, longTermVacancyRate: r.longTermVacancyRate }
        }
        result.set(millesime, byEpci)
      }),
    )

    return result
  }

  private groupEpcisByProjectionKey(
    simulations: Array<{ scenario: { millesime: string; projection: number } | null; epcis: Array<{ code: string }> }>,
  ) {
    const grouped = new Map<string, { millesime: string; year: number; epciCodes: string[] }>()
    for (const sim of simulations) {
      if (!sim.scenario) continue
      const { millesime, projection } = sim.scenario
      const key = `${millesime}__${projection}`
      const existing = grouped.get(key) ?? { millesime, year: projection, epciCodes: [] }
      for (const epci of sim.epcis) {
        if (!existing.epciCodes.includes(epci.code)) existing.epciCodes.push(epci.code)
      }
      grouped.set(key, existing)
    }
    return grouped
  }

  private buildDashboardSummary(
    sim: {
      scenario: { b2_scenario: string; millesime: string; projection: number } | null
      epcis: Array<{ code: string }>
    },
    resultsForSim: Array<CachedSimulationResultRow>,
    omphaleLookup: Map<string, Record<string, Record<string, number | null>>>,
    populationLookup: Map<string, Record<string, { central: number | null; haute: number | null; basse: number | null }>>,
  ): TSimulationDashboardSummary | null {
    if (!sim.scenario || resultsForSim.length === 0) return null

    let total = 0
    let vacantAccomodation = 0
    let secondaryAccommodationSigned = 0
    let renewalNeeds = 0
    let peakYearMax: number | null = null

    for (const row of resultsForSim) {
      if (row.total > 0) {
        total += row.total
        // Cache stores vacantAccomodation already display-ready (|v| if v<0 else 0, see results.service.ts:69).
        vacantAccomodation += row.vacantAccomodation
        // Cache stores secondaryAccommodation signed — aggregate signed, clamp once after the loop.
        secondaryAccommodationSigned += row.secondaryAccommodation
      }
      const flowTotals = row.flowTotals as { renewalNeeds?: number } | null
      if (typeof flowTotals?.renewalNeeds === 'number') {
        renewalNeeds += Math.min(0, flowTotals.renewalNeeds)
      }
      const flowData = row.flowDataByYear as { peakYear?: number } | null
      if (typeof flowData?.peakYear === 'number') {
        peakYearMax = peakYearMax === null ? flowData.peakYear : Math.max(peakYearMax, flowData.peakYear)
      }
    }

    // Mirror results page: show |sum| if sum is negative, else 0.
    const secondaryAccommodation = secondaryAccommodationSigned < 0 ? Math.abs(secondaryAccommodationSigned) : 0

    const key = `${sim.scenario.millesime}__${sim.scenario.projection}`
    const omphaleByEpci = omphaleLookup.get(key) ?? {}
    const populationByEpci = populationLookup.get(key) ?? {}

    const b2 = sim.scenario.b2_scenario
    const omphaleColumn = omphaleMap[b2.toLowerCase() as keyof typeof omphaleMap]
    const popColumn = populationMap[b2.split('_')[0].toLowerCase() as keyof typeof populationMap]

    let populationAtProjection = 0
    let householdsAtProjection = 0
    for (const epci of sim.epcis) {
      if (popColumn) populationAtProjection += Math.round(populationByEpci[epci.code]?.[popColumn] ?? 0)
      if (omphaleColumn) householdsAtProjection += Math.round(omphaleByEpci[epci.code]?.[omphaleColumn] ?? 0)
    }

    return {
      total,
      vacantAccomodation,
      secondaryAccommodation,
      renewalNeeds,
      populationAtProjection,
      householdsAtProjection,
      peakYear: peakYearMax,
    }
  }

  async markAsExported(simulationIds: string[], privilegedSimulationId?: string): Promise<void> {
    await this.prismaService.export.createMany({
      data: simulationIds.map((simulationId) => ({
        type: 'POWERPOINT',
        simulationId,
        isPrivileged: privilegedSimulationId === simulationId,
      })),
    })
  }
}
