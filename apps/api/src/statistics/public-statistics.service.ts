import { Injectable } from '@nestjs/common'
import { PUBLIC_PLANNING_DOCUMENT_TYPES, type TPublicEpciStatus, type TPublicStatistics, ZPublicStatistics } from '@otelo/shared'
import { PrismaService } from '~/db/prisma.service'
import { Prisma } from '~/generated/prisma/client'
import { ImpactStatisticsService } from './impact-statistics.service'
import { percentage, toNumber } from './statistics-numbers'
import { ALL_TIME, LATEST_POPULATION, simulationsExportedIn } from './statistics-sql'
import { ownerIsNotTeam } from './team'

/** Nombre de mois de la série d'activité, mois courant compris. */
const MONTHLY_WINDOW = 24

/** Simulations en cours, hors équipe : ce qui fait le statut `SIMULATED`. */
const ACTIVE_SIMULATIONS = Prisma.sql`
  SELECT s.id, s.scenario_id, s.user_id, s.created_at
  FROM simulations s
  WHERE s.deleted IS NULL
    AND ${ownerIsNotTeam('s.user_id')}
`

/** EPCI couverts par un ensemble de simulations exposant `scenario_id`, par `epci_scenarios` comme la page Impact. */
const epcisOf = (sims: Prisma.Sql): Prisma.Sql => Prisma.sql`
  SELECT DISTINCT es.epci_code
  FROM (${sims}) sims
  INNER JOIN epci_scenarios es ON es.scenario_id = sims.scenario_id
`

/** Les `count` derniers mois au format YYYY-MM, en UTC, du plus ancien à celui de `now`. */
function lastMonths(now: Date, count: number): string[] {
  return Array.from({ length: count }, (_, index) => {
    const month = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - (count - 1 - index), 1))
    return month.toISOString().slice(0, 7)
  })
}

/**
 * Statistiques d'usage publiques, anonymes et agrégées.
 *
 * La réponse est lisible par n'importe qui : elle ne porte ni donnée d'utilisateur ni
 * chiffre de besoins. Par EPCI, seuls l'identité du territoire et son statut sortent.
 * Le passage final par `ZPublicStatistics.parse` (objets stricts) fait échouer la
 * requête plutôt que de laisser fuir une clé ajoutée par erreur.
 */
@Injectable()
export class PublicStatisticsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly impactStatistics: ImpactStatisticsService,
  ) {}

  async getPublicStatistics(now: Date = new Date()): Promise<TPublicStatistics> {
    const exported = simulationsExportedIn(ALL_TIME)

    const [epcis, coverage, planningDocuments, departments, targetReductions, monthly] = await Promise.all([
      this.getEpcis(exported),
      this.getCoverage(exported),
      this.getPlanningDocuments(exported),
      this.getDepartments(),
      this.impactStatistics.getTargetReductions(exported),
      this.getMonthly(now),
    ])

    return ZPublicStatistics.parse({
      generatedAt: now.toISOString(),
      keyFigures: {
        epcisWithSimulation: epcis.filter((epci) => epci.simulated).length,
        epcisWithExport: epcis.filter((epci) => epci.status === 'EXPORTED').length,
        coveredPopulation: coverage.covered,
        coveredPopulationShare: percentage(coverage.covered, coverage.total),
        planningDocuments: planningDocuments.reduce((sum, row) => sum + row.count, 0),
        engagedDepartments: departments.engaged,
        totalDepartments: departments.total,
      },
      targetReductions,
      planningDocumentsByType: planningDocuments,
      monthly,
      epcis: epcis.map(({ simulated: _simulated, ...epci }) => epci),
    })
  }

  /**
   * EPCI ayant une simulation en cours ou exportée. Un export l'emporte sur une simulation :
   * un scénario exporté puis supprimé a quand même servi hors d'Otelo.
   */
  private async getEpcis(exported: Prisma.Sql) {
    const rows = await this.prisma.$queryRaw<
      Array<{ code: string; name: string; department: string | null; region: string; simulated: boolean; exported: boolean }>
    >`
      WITH simulated_epcis AS (${epcisOf(ACTIVE_SIMULATIONS)}),
      exported_epcis AS (${epcisOf(exported)})
      SELECT
        ep.code,
        ep.name,
        ep.department_name AS department,
        COALESCE(ep.region_name, ep.region) AS region,
        EXISTS (SELECT 1 FROM simulated_epcis se WHERE se.epci_code = ep.code) AS simulated,
        EXISTS (SELECT 1 FROM exported_epcis ee WHERE ee.epci_code = ep.code) AS exported
      FROM epcis ep
      WHERE ep.code IN (SELECT epci_code FROM simulated_epcis UNION SELECT epci_code FROM exported_epcis)
      ORDER BY region, department, ep.name
    `

    return rows.map((row) => ({
      code: row.code,
      name: row.name,
      department: row.department,
      region: row.region,
      status: (row.exported ? 'EXPORTED' : 'SIMULATED') satisfies TPublicEpciStatus,
      simulated: row.simulated,
    }))
  }

  /** Population des EPCI ayant un export, rapportée à celle de l'ensemble des EPCI. */
  private async getCoverage(exported: Prisma.Sql) {
    const [row] = await this.prisma.$queryRaw<Array<{ covered: number | null; total: number | null }>>`
      WITH population AS (${LATEST_POPULATION}),
      exported_epcis AS (${epcisOf(exported)})
      SELECT
        (SELECT SUM(p.population) FROM exported_epcis ee INNER JOIN population p ON p.epci_code = ee.epci_code) AS covered,
        (SELECT SUM(p.population) FROM epcis ep INNER JOIN population p ON p.epci_code = ep.code) AS total
    `

    return { covered: Math.round(toNumber(row?.covered)), total: toNumber(row?.total) }
  }

  /** Dossiers déclarant un document d'urbanisme et ayant au moins un scénario exporté. */
  private async getPlanningDocuments(exported: Prisma.Sql) {
    const rows = await this.prisma.$queryRaw<Array<{ type: string; count: bigint }>>`
      WITH exported AS (${exported})
      SELECT g.planning_document_type::text AS type, COUNT(*) AS count
      FROM epci_groups g
      WHERE g.planning_document_type IS NOT NULL
        AND g.id IN (SELECT epci_group_id FROM exported WHERE epci_group_id IS NOT NULL)
      GROUP BY g.planning_document_type
    `

    return PUBLIC_PLANNING_DOCUMENT_TYPES.map((key) => ({
      key,
      count: toNumber(rows.find((row) => row.type === key)?.count),
    }))
  }

  /** Départements où une DDT a une simulation en cours, sur l'ensemble des départements connus. */
  private async getDepartments() {
    const [row] = await this.prisma.$queryRaw<Array<{ engaged: bigint; total: bigint }>>`
      SELECT
        (
          SELECT COUNT(DISTINCT ep.department_name)
          FROM (${ACTIVE_SIMULATIONS}) sims
          INNER JOIN users u ON u.id = sims.user_id
          INNER JOIN epci_scenarios es ON es.scenario_id = sims.scenario_id
          INNER JOIN epcis ep ON ep.code = es.epci_code
          WHERE u.type::text = 'DDT'
        ) AS engaged,
        (SELECT COUNT(DISTINCT department_name) FROM epcis) AS total
    `

    return { engaged: toNumber(row?.engaged), total: toNumber(row?.total) }
  }

  /**
   * Activité des 24 derniers mois, mois sans activité compris.
   *
   * `created_at` est un `timestamp` sans fuseau écrit en UTC : le découper tel quel donne
   * le mois UTC, et les bornes passées en texte ne dépendent pas du fuseau de la session.
   */
  private async getMonthly(now: Date): Promise<TPublicStatistics['monthly']> {
    const months = lastMonths(now, MONTHLY_WINDOW)
    const from = `${months[0]}-01`
    const nextMonth = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1))
    const toExclusive = nextMonth.toISOString().slice(0, 10)

    const rows = await this.prisma.$queryRaw<Array<{ kind: 'simulations' | 'exports' | 'activeEpcis'; month: string; count: bigint }>>`
      WITH created AS (
        SELECT sims.scenario_id, to_char(sims.created_at, 'YYYY-MM') AS month
        FROM (${ACTIVE_SIMULATIONS}) sims
        WHERE sims.created_at >= ${from}::timestamp AND sims.created_at < ${toExclusive}::timestamp
      ),
      -- Une demande de PowerPoint écrit une ligne par scénario, toutes au même horodatage :
      -- le couple (utilisateur, horodatage) identifie la demande, comme dans \`getImpact\`.
      requests AS (
        SELECT DISTINCT s.user_id, e.created_at
        FROM exports e
        INNER JOIN simulations s ON s.id = e.simulation_id
        WHERE e.type = 'POWERPOINT'
          AND e.created_at >= ${from}::timestamp AND e.created_at < ${toExclusive}::timestamp
          AND ${ownerIsNotTeam('s.user_id')}
      )
      SELECT 'simulations' AS kind, month, COUNT(*) AS count FROM created GROUP BY month
      UNION ALL
      SELECT 'activeEpcis' AS kind, c.month, COUNT(DISTINCT es.epci_code) AS count
      FROM created c
      INNER JOIN epci_scenarios es ON es.scenario_id = c.scenario_id
      GROUP BY c.month
      UNION ALL
      SELECT 'exports' AS kind, to_char(created_at, 'YYYY-MM') AS month, COUNT(*) AS count FROM requests GROUP BY 2
    `

    const countOf = (kind: (typeof rows)[number]['kind'], month: string) =>
      toNumber(rows.find((row) => row.kind === kind && row.month === month)?.count)

    return months.map((month) => ({
      month,
      simulations: countOf('simulations', month),
      exports: countOf('exports', month),
      activeEpcis: countOf('activeEpcis', month),
    }))
  }
}
