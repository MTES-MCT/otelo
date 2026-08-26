import { Injectable } from '@nestjs/common'
import { PrismaService } from '~/db/prisma.service'
import {
  PROJECTION_SCENARIOS,
  type TProjectionByAgeGroupQuery,
  type TProjectionByAgeQuery,
  type TProjectionByHouseholdTypeQuery,
  type TProjectionBySexQuery,
  type TProjectionScenario,
  type TProjectionSeriesByZone,
  type TProjectionSeriesPoint,
  type TProjectionSeriesQuery,
  type TProjectionZoneWithMillesime,
} from '~/schemas/projections/projections'
import { ProjectionZonesService } from './projection-zones.service'

/** Colonnes de scénario sélectionnables sur chacune des six tables. */
type ScenarioSelection = Record<TProjectionScenario, true>

@Injectable()
export class ProjectionsService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly projectionZonesService: ProjectionZonesService,
  ) {}

  async getPopulation(query: TProjectionSeriesQuery): Promise<TProjectionSeriesByZone> {
    return this.buildSeries(query, (where, select) =>
      this.prismaService.projectionPopulationTotal.findMany({
        where,
        select: { zoneCode: true, year: true, ...select },
        orderBy: [{ zoneCode: 'asc' }, { year: 'asc' }],
      }),
    )
  }

  async getHouseholds(query: TProjectionSeriesQuery): Promise<TProjectionSeriesByZone> {
    return this.buildSeries(query, (where, select) =>
      this.prismaService.projectionHouseholdTotal.findMany({
        where,
        select: { zoneCode: true, year: true, ...select },
        orderBy: [{ zoneCode: 'asc' }, { year: 'asc' }],
      }),
    )
  }

  async getPopulationBySex(query: TProjectionBySexQuery): Promise<TProjectionSeriesByZone> {
    return this.buildSeries(query, (where, select) =>
      this.prismaService.projectionPopulationBySex.findMany({
        where: { ...where, ...(query.sex !== undefined && { sex: query.sex }) },
        select: { zoneCode: true, year: true, sex: true, ...select },
        orderBy: [{ zoneCode: 'asc' }, { year: 'asc' }, { sex: 'asc' }],
      }),
    )
  }

  async getPopulationByAge(query: TProjectionByAgeQuery): Promise<TProjectionSeriesByZone> {
    return this.buildSeries(query, (where, select) =>
      this.prismaService.projectionPopulationByAgeSex.findMany({
        where: {
          ...where,
          ...(query.sex !== undefined && { sex: query.sex }),
          ...(query.ages !== undefined && { age: { in: query.ages } }),
        },
        select: { zoneCode: true, year: true, age: true, sex: true, ...select },
        orderBy: [{ zoneCode: 'asc' }, { year: 'asc' }, { age: 'asc' }, { sex: 'asc' }],
      }),
    )
  }

  async getPopulationByAgeGroup(query: TProjectionByAgeGroupQuery): Promise<TProjectionSeriesByZone> {
    return this.buildSeries(query, (where, select) =>
      this.prismaService.projectionPopulationByAgeGroup.findMany({
        where: { ...where, ...(query.ageGroups !== undefined && { ageGroup: { in: query.ageGroups } }) },
        select: { zoneCode: true, year: true, ageGroup: true, ...select },
        orderBy: [{ zoneCode: 'asc' }, { year: 'asc' }, { ageGroup: 'asc' }],
      }),
    )
  }

  async getHouseholdsByType(query: TProjectionByHouseholdTypeQuery): Promise<TProjectionSeriesByZone> {
    return this.buildSeries(query, (where, select) =>
      this.prismaService.projectionHouseholdByType.findMany({
        where: {
          ...where,
          ...(query.householdTypes !== undefined && { householdType: { in: query.householdTypes } }),
        },
        select: { zoneCode: true, year: true, householdType: true, ...select },
        orderBy: [{ zoneCode: 'asc' }, { year: 'asc' }, { householdType: 'asc' }],
      }),
    )
  }

  /**
   * Squelette commun aux six routes : résolution du millésime, contrôle des zones, requête, puis
   * regroupement par zone.
   *
   * Chaque zone demandée figure dans la réponse même sans donnée, avec son `isRobust` : c'est ce
   * qui permet à l'appelant de distinguer « pas de projection pour ce territoire » d'une erreur,
   * et de ne pas tracer l'unique point 2018 d'une zone non projetée comme une courbe plate.
   */
  private async buildSeries(
    query: TProjectionSeriesQuery,
    fetch: (where: Record<string, unknown>, select: ScenarioSelection) => Promise<Record<string, unknown>[]>,
  ): Promise<TProjectionSeriesByZone> {
    const millesime = await this.projectionZonesService.resolveMillesime(query.millesime)
    const zones = await this.projectionZonesService.requireZones(query.zoneCodes, query.level)
    const robustness = await this.projectionZonesService.robustnessByZone(query.zoneCodes, millesime)

    const scenarios = query.scenarios ?? PROJECTION_SCENARIOS
    const select = Object.fromEntries(scenarios.map((scenario) => [scenario, true])) as ScenarioSelection

    const rows = await fetch(
      {
        zoneCode: { in: query.zoneCodes },
        millesime,
        year: { gte: query.fromYear, lte: query.toYear },
      },
      select,
    )

    const pointsByZone = new Map<string, TProjectionSeriesPoint[]>()
    for (const code of query.zoneCodes) {
      pointsByZone.set(code, [])
    }

    for (const row of rows) {
      const { zoneCode, ...point } = row as { zoneCode: string } & TProjectionSeriesPoint
      pointsByZone.get(zoneCode)?.push(point)
    }

    const result: TProjectionSeriesByZone = {}
    for (const code of query.zoneCodes) {
      const zone = zones.get(code) as TProjectionZoneWithMillesime
      const data = pointsByZone.get(code) ?? []
      result[code] = {
        zone: {
          code: zone.code,
          level: zone.level,
          label: zone.label,
          epciCode: zone.epciCode,
          bassinName: zone.bassinName,
        },
        isRobust: robustness.get(code) ?? false,
        data,
        metadata: buildMetadata(data, scenarios),
      }
    }

    return result
  }
}

function buildMetadata(
  data: TProjectionSeriesPoint[],
  scenarios: readonly TProjectionScenario[],
): { min: number | null; max: number | null; firstYear: number | null; lastYear: number | null } {
  let min: number | null = null
  let max: number | null = null
  let firstYear: number | null = null
  let lastYear: number | null = null

  for (const point of data) {
    firstYear = firstYear === null ? point.year : Math.min(firstYear, point.year)
    lastYear = lastYear === null ? point.year : Math.max(lastYear, point.year)

    for (const scenario of scenarios) {
      // Les scénarios non projetés sont nuls (population basse en Dordogne) : les ignorer, sinon
      // l'échelle du graphique partirait de zéro.
      const value = point[scenario]
      if (value === null || value === undefined) continue
      min = min === null ? value : Math.min(min, value)
      max = max === null ? value : Math.max(max, value)
    }
  }

  return { min, max, firstYear, lastYear }
}
