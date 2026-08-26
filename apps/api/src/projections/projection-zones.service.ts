import { Injectable, NotFoundException } from '@nestjs/common'
import { DataPackVersionsService } from '~/data-pack-versions/data-pack-versions.service'
import { PrismaService } from '~/db/prisma.service'
import {
  type TProjectionZoneLevel,
  type TProjectionZonesQuery,
  type TProjectionZoneWithMillesime,
  type TResolvedProjectionZones,
} from '~/schemas/projections/projections'

/**
 * Référentiel des zones de projection : quelle zone couvre quel territoire, et avec quelle
 * qualité.
 *
 * Les projections détaillées ne couvrent pas les mêmes territoires que les tables historiques :
 * seuls les 214 EPCI d'au moins 50 000 habitants ont une projection propre (seuil de robustesse
 * Omphale), les autres n'étant couverts qu'à travers leur bassin d'habitat. Répondre à « quelle
 * série puis-je afficher pour cet EPCI ? » demande donc une résolution explicite, c'est l'objet de
 * `resolveForEpcis`.
 */
@Injectable()
export class ProjectionZonesService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly dataPackVersionsService: DataPackVersionsService,
  ) {}

  /** Millésime demandé, ou millésime actif à défaut. */
  async resolveMillesime(millesime?: string): Promise<string> {
    if (millesime !== undefined) return millesime
    const active = await this.dataPackVersionsService.getActive()
    return active.millesime
  }

  async find(query: TProjectionZonesQuery): Promise<TProjectionZoneWithMillesime[]> {
    const millesime = await this.resolveMillesime(query.millesime)

    const zones = await this.prismaService.projectionZone.findMany({
      where: {
        ...(query.level !== undefined && { level: query.level }),
        ...(query.bassinName !== undefined && { bassinName: query.bassinName }),
        ...(query.search !== undefined && {
          OR: [{ code: { contains: query.search, mode: 'insensitive' } }, { label: { contains: query.search, mode: 'insensitive' } }],
        }),
      },
      include: { millesimes: { where: { millesime } } },
      orderBy: [{ level: 'asc' }, { code: 'asc' }],
    })

    return zones.map(toZoneWithMillesime)
  }

  /**
   * Pour chaque code EPCI, la zone de projection à son niveau si elle existe, et celles de son
   * bassin.
   *
   * `bassinZones` est une liste : le bassin « PARIS MÉTROPOLE » porte les 12 territoires de la
   * métropole, dont deux ne sont pas projetés. Les additionner sans regarder `isRobust`
   * produirait une métropole amputée de 16 % de sa population au-delà de 2018.
   */
  async resolveForEpcis(epciCodes: string[], millesime?: string): Promise<TResolvedProjectionZones[]> {
    const resolvedMillesime = await this.resolveMillesime(millesime)

    const epcis = await this.prismaService.epci.findMany({
      where: { code: { in: epciCodes } },
      select: { code: true, bassinName: true },
    })
    const bassinByEpci = new Map(epcis.map((epci) => [epci.code, epci.bassinName]))

    const bassinNames = [...new Set(epcis.map((epci) => epci.bassinName).filter(isNotNull))]

    const zones = await this.prismaService.projectionZone.findMany({
      where: {
        OR: [
          { epciCode: { in: epciCodes }, level: 'EPCI' },
          ...(bassinNames.length > 0 ? [{ bassinName: { in: bassinNames }, level: 'BH' as const }] : []),
        ],
      },
      include: { millesimes: { where: { millesime: resolvedMillesime } } },
      orderBy: { code: 'asc' },
    })

    const epciZoneByCode = new Map<string, TProjectionZoneWithMillesime>()
    const bassinZonesByName = new Map<string, TProjectionZoneWithMillesime[]>()

    for (const zone of zones) {
      const mapped = toZoneWithMillesime(zone)
      if (zone.level === 'EPCI' && zone.epciCode !== null) {
        epciZoneByCode.set(zone.epciCode, mapped)
        continue
      }
      if (zone.bassinName !== null) {
        const existing = bassinZonesByName.get(zone.bassinName) ?? []
        existing.push(mapped)
        bassinZonesByName.set(zone.bassinName, existing)
      }
    }

    return epciCodes.map((epciCode) => {
      const bassinName = bassinByEpci.get(epciCode) ?? null
      return {
        epciCode,
        epciZone: epciZoneByCode.get(epciCode) ?? null,
        bassinZones: bassinName === null ? [] : (bassinZonesByName.get(bassinName) ?? []),
      }
    })
  }

  /**
   * Charge les zones demandées et vérifie qu'elles existent toutes.
   * Lève plutôt que de renvoyer une réponse partielle : un code absent est presque toujours une
   * confusion de niveau ou de territoire, silence compris comme « pas de données ».
   */
  async requireZones(zoneCodes: string[], level?: TProjectionZoneLevel): Promise<Map<string, TProjectionZoneWithMillesime>> {
    const zones = await this.prismaService.projectionZone.findMany({
      where: { code: { in: zoneCodes } },
      include: { millesimes: false },
    })

    const byCode = new Map(zones.map((zone) => [zone.code, toZoneWithMillesime({ ...zone, millesimes: [] })]))

    const missing = zoneCodes.filter((code) => !byCode.has(code))
    if (missing.length > 0) {
      throw new NotFoundException(`Zone de projection inconnue : ${missing.join(', ')}`)
    }

    if (level !== undefined) {
      const wrongLevel = [...byCode.values()].filter((zone) => zone.level !== level)
      if (wrongLevel.length > 0) {
        throw new NotFoundException(
          `Zone(s) hors du niveau ${level} : ${wrongLevel.map((zone) => `${zone.code} (${zone.level})`).join(', ')}`,
        )
      }
    }

    return byCode
  }

  /** Robustesse des zones pour un millésime, indexée par code. */
  async robustnessByZone(zoneCodes: string[], millesime: string): Promise<Map<string, boolean>> {
    const rows = await this.prismaService.projectionZoneMillesime.findMany({
      where: { zoneCode: { in: zoneCodes }, millesime },
      select: { zoneCode: true, isRobust: true },
    })
    return new Map(rows.map((row) => [row.zoneCode, row.isRobust]))
  }
}

type ZoneRow = {
  code: string
  level: string
  label: string
  epciCode: string | null
  bassinName: string | null
  millesimes: { isRobust: boolean; firstYear: number; lastYear: number }[]
}

function toZoneWithMillesime(zone: ZoneRow): TProjectionZoneWithMillesime {
  const millesime = zone.millesimes[0]
  return {
    code: zone.code,
    level: zone.level as TProjectionZoneLevel,
    label: zone.label,
    epciCode: zone.epciCode,
    bassinName: zone.bassinName,
    isRobust: millesime?.isRobust ?? false,
    firstYear: millesime?.firstYear ?? null,
    lastYear: millesime?.lastYear ?? null,
  }
}

function isNotNull<T>(value: T | null): value is T {
  return value !== null
}
