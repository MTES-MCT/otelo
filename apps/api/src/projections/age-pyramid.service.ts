import { Injectable } from '@nestjs/common'
import { PrismaService } from '~/db/prisma.service'
import {
  AGE_COUNT,
  MAX_AGE,
  POPULATION_TYPE_TO_SCENARIO,
  type TAgePyramid,
  type TAgePyramidAge,
  type TAgePyramidPopulationType,
} from '~/schemas/data-visualisation/age-pyramid'
import { PROJECTION_LAST_YEAR, type TProjectionZoneWithMillesime } from '~/schemas/projections/projections'
import { ProjectionZonesService } from './projection-zones.service'

/** Une ligne de `projection_population_by_age_sex`, réduite à ce dont le regroupement a besoin. */
export type AgeSexRow = {
  year: number
  age: number
  sex: string
  value: number | null
}

/**
 * Range les effectifs en une série par âge, chaque série indexée comme `years`.
 *
 * Fonction pure, séparée du service pour être testable sans base : c'est la seule partie du calcul
 * qui puisse se tromper silencieusement. Les 100 âges sont toujours présents, y compris ceux que
 * la source ne renseigne pas — un trou dans le tableau produirait une pyramide à créneaux.
 */
export function buildAgeSeries(rows: AgeSexRow[], years: number[]): TAgePyramidAge[] {
  const yearIndex = new Map(years.map((year, index) => [year, index]))

  const ages: TAgePyramidAge[] = Array.from({ length: AGE_COUNT }, (_, age) => ({
    age,
    men: new Array<number>(years.length).fill(0),
    women: new Array<number>(years.length).fill(0),
  }))

  for (const row of rows) {
    const index = yearIndex.get(row.year)
    if (index === undefined) continue

    // `99` regroupe « 99 ans et plus » : un âge au-delà y retombe plutôt que de sortir du tableau.
    const entry = ages[Math.min(row.age, MAX_AGE)]
    const series = row.sex === 'HOMME' ? entry.men : entry.women
    // Les scénarios non projetés sont nuls (population basse en Dordogne) : compter 0 plutôt que
    // propager NaN, la zone étant de toute façon filtrée sur `isRobust` en amont.
    series[index] += row.value ?? 0
  }

  return ages
}

/**
 * Pyramide des âges d'un EPCI, sur toute la durée de la projection.
 *
 * Les projections détaillées ne couvrent pas tous les territoires : seuls les 214 EPCI d'au moins
 * 50 000 habitants ont une projection propre, les autres n'étant atteints qu'à travers leur bassin
 * d'habitat. `coverage` porte cette différence jusqu'à l'interface.
 */
@Injectable()
export class AgePyramidService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly projectionZonesService: ProjectionZonesService,
  ) {}

  async getAgePyramid(epciCode: string, populationType: TAgePyramidPopulationType, millesime?: string): Promise<TAgePyramid> {
    const resolvedMillesime = await this.projectionZonesService.resolveMillesime(millesime)
    const [resolved] = await this.projectionZonesService.resolveForEpcis([epciCode], resolvedMillesime)

    const zone = pickZone(resolved?.epciZone ?? null, resolved?.bassinZones ?? [])
    if (zone.kind !== 'found') {
      return { available: false, epciCode, reason: zone.reason }
    }

    // L'année de référence est le millésime du pack : c'est l'année de base des calculs Otelo,
    // et celle sur laquelle la note de décomposition s'appuie.
    const referenceYear = Number(resolvedMillesime)
    const scenario = POPULATION_TYPE_TO_SCENARIO[populationType]

    const rows = await this.prismaService.projectionPopulationByAgeSex.findMany({
      where: {
        zoneCode: zone.zone.code,
        millesime: resolvedMillesime,
        year: { gte: referenceYear, lte: PROJECTION_LAST_YEAR },
      },
      select: { year: true, age: true, sex: true, [scenario]: true },
      orderBy: [{ year: 'asc' }, { age: 'asc' }],
    })

    const years = [...new Set(rows.map((row) => row.year))].sort((a, b) => a - b)
    if (years.length === 0) {
      return { available: false, epciCode, reason: 'NO_PROJECTION' }
    }

    const ages = buildAgeSeries(
      rows.map((row) => ({
        year: row.year,
        age: row.age,
        sex: row.sex,
        value: (row as Record<string, unknown>)[scenario] as number | null,
      })),
      years,
    )

    return {
      available: true,
      zone: {
        code: zone.zone.code,
        level: zone.zone.level,
        label: zone.zone.label,
        epciCode: zone.zone.epciCode,
        bassinName: zone.zone.bassinName,
      },
      coverage: zone.coverage,
      populationType,
      referenceYear,
      years,
      ages,
    }
  }
}

type PickedZone =
  | { kind: 'found'; zone: TProjectionZoneWithMillesime; coverage: 'EPCI' | 'BASSIN' }
  | { kind: 'none'; reason: 'NO_PROJECTION' | 'AMBIGUOUS_BASSIN' }

/**
 * Choisit la zone à tracer : la projection propre de l'EPCI si elle existe, sinon celle de son
 * bassin.
 *
 * `isRobust` n'est pas optionnel — une zone hors seuil ne porte que l'année de recensement, valeur
 * observée recopiée sur les neuf scénarios, et se tracerait comme une pyramide immobile.
 *
 * Plusieurs zones robustes sur un même bassin signifie la Métropole du Grand Paris, découpée en
 * 12 territoires dont deux ne sont pas projetés. Les effectifs par âge sont pourtant additifs,
 * mais additionner les seuls territoires robustes amputerait la métropole de 16 % : on préfère
 * ne rien afficher.
 */
export function pickZone(epciZone: TProjectionZoneWithMillesime | null, bassinZones: TProjectionZoneWithMillesime[]): PickedZone {
  if (epciZone !== null && epciZone.isRobust) {
    return { kind: 'found', zone: epciZone, coverage: 'EPCI' }
  }

  const robustBassinZones = bassinZones.filter((zone) => zone.isRobust)
  if (robustBassinZones.length === 1) {
    return { kind: 'found', zone: robustBassinZones[0], coverage: 'BASSIN' }
  }
  if (robustBassinZones.length > 1) {
    return { kind: 'none', reason: 'AMBIGUOUS_BASSIN' }
  }

  return { kind: 'none', reason: 'NO_PROJECTION' }
}
