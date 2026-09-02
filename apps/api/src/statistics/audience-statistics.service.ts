import { Injectable } from '@nestjs/common'
import {
  ACTIVATION_STEP_LABELS,
  SIMULATION_CHANGE_ACTION_LABELS,
  type SimulationChangeAction,
  type TActivationStatistics,
  type TActivationStep,
  type TAudienceStatistics,
  type TConnectionsByMonth,
  type TConnectionsByUserType,
  type TRetentionCohort,
  type TSharedSimulation,
} from '@shared'
import type { DateRange } from '~/common/utils/date-range'
import { PrismaService } from '~/db/prisma.service'
import { OWNER_IS_NOT_TEAM, ownerIsNotTeam } from './team'

/** Postgres renvoie les agrégats numériques en `numeric`, que le driver mappe en string. */
function toNumber(value: unknown): number {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : 0
}

function round(value: number, decimals = 2): number {
  const factor = 10 ** decimals
  return Math.round(value * factor) / factor
}

function percentage(part: number, total: number): number {
  return total === 0 ? 0 : round((part / total) * 100, 1)
}

@Injectable()
export class AudienceStatisticsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Date de la plus ancienne connexion journalisée.
   *
   * Indispensable pour interpréter les chiffres : avant cette date, `login_events`
   * n'existait pas, et `users.last_login_at` vaut par défaut la date de création — il
   * ne permet donc pas de distinguer « jamais connecté » de « connecté à l'inscription ».
   */
  async getLoginTrackingStartedAt(): Promise<Date | null> {
    const first = await this.prisma.loginEvent.findFirst({
      orderBy: { startedAt: 'asc' },
      select: { startedAt: true },
    })

    return first?.startedAt ?? null
  }

  async getConnectionsByMonth({ from, toExclusive }: DateRange): Promise<TConnectionsByMonth[]> {
    const rows = await this.prisma.$queryRaw<
      Array<{ month: Date; nb_connections: bigint; active_users: bigint; total_seconds: string; avg_session_seconds: string }>
    >`
      SELECT
        date_trunc('month', started_at) AS month,
        COUNT(*) AS nb_connections,
        COUNT(DISTINCT user_id) AS active_users,
        COALESCE(SUM(EXTRACT(EPOCH FROM (last_seen_at - started_at))), 0) AS total_seconds,
        COALESCE(AVG(EXTRACT(EPOCH FROM (last_seen_at - started_at))), 0) AS avg_session_seconds
      FROM login_events le
      WHERE started_at >= ${from} AND started_at < ${toExclusive}
        AND ${ownerIsNotTeam('le.user_id')}
      GROUP BY 1
      ORDER BY 1
    `

    return rows.map((row) => ({
      month: row.month.toISOString().slice(0, 10),
      nbConnections: toNumber(row.nb_connections),
      activeUsers: toNumber(row.active_users),
      totalSeconds: round(toNumber(row.total_seconds), 0),
      avgSessionSeconds: round(toNumber(row.avg_session_seconds), 0),
    }))
  }

  async getConnectionsByUserType({ from, toExclusive }: DateRange): Promise<TConnectionsByUserType[]> {
    const rows = await this.prisma.$queryRaw<
      Array<{ user_type: string | null; nb_connections: bigint; active_users: bigint; avg_session_seconds: string }>
    >`
      SELECT
        user_type,
        COUNT(*) AS nb_connections,
        COUNT(DISTINCT user_id) AS active_users,
        COALESCE(AVG(EXTRACT(EPOCH FROM (last_seen_at - started_at))), 0) AS avg_session_seconds
      FROM login_events le
      WHERE started_at >= ${from} AND started_at < ${toExclusive}
        AND ${ownerIsNotTeam('le.user_id')}
      GROUP BY 1
      ORDER BY 2 DESC
    `

    return rows.map((row) => ({
      userType: row.user_type,
      nbConnections: toNumber(row.nb_connections),
      activeUsers: toNumber(row.active_users),
      avgSessionSeconds: round(toNumber(row.avg_session_seconds), 0),
    }))
  }

  async getConnectionTotals({ from, toExclusive }: DateRange) {
    const [row] = await this.prisma.$queryRaw<
      Array<{ total: bigint; unique_users: bigint; total_seconds: string; avg_session_seconds: string }>
    >`
      SELECT
        COUNT(*) AS total,
        COUNT(DISTINCT user_id) AS unique_users,
        COALESCE(SUM(EXTRACT(EPOCH FROM (last_seen_at - started_at))), 0) AS total_seconds,
        COALESCE(AVG(EXTRACT(EPOCH FROM (last_seen_at - started_at))), 0) AS avg_session_seconds
      FROM login_events le
      WHERE started_at >= ${from} AND started_at < ${toExclusive}
        AND ${ownerIsNotTeam('le.user_id')}
    `

    return {
      total: toNumber(row?.total),
      uniqueUsers: toNumber(row?.unique_users),
      totalSeconds: round(toNumber(row?.total_seconds), 0),
      avgSessionSeconds: round(toNumber(row?.avg_session_seconds), 0),
    }
  }

  /**
   * Usage du partage.
   *
   * Le filtre de période porte sur la CRÉATION des liens. Les consultations sont un
   * compteur cumulatif (`view_count`), pas un journal : elles ne peuvent pas être
   * bornées dans le temps, seul `last_viewed_at` donne la fraîcheur.
   */
  async getSharingUsage({ from, toExclusive }: DateRange) {
    const [totals] = await this.prisma.$queryRaw<Array<{ links_created: bigint; total_views: string; never_viewed: bigint }>>`
      SELECT
        COUNT(*) AS links_created,
        COALESCE(SUM(sl.view_count), 0) AS total_views,
        COUNT(*) FILTER (WHERE sl.view_count = 0) AS never_viewed
      FROM simulation_share_links sl
      INNER JOIN simulations s ON s.id = sl.simulation_id
      WHERE sl.created_at >= ${from} AND sl.created_at < ${toExclusive}
        AND ${ownerIsNotTeam('s.user_id')}
    `

    const topShared = await this.prisma.$queryRaw<
      Array<{
        simulation_id: string
        simulation_name: string
        owner_type: string | null
        active: boolean
        created_at: Date
        view_count: number
        last_viewed_at: Date | null
      }>
    >`
      SELECT
        sl.simulation_id,
        s.name AS simulation_name,
        u.type::text AS owner_type,
        sl.active,
        sl.created_at,
        sl.view_count,
        sl.last_viewed_at
      FROM simulation_share_links sl
      INNER JOIN simulations s ON s.id = sl.simulation_id
      LEFT JOIN users u ON u.id = s.user_id
      WHERE sl.created_at >= ${from} AND sl.created_at < ${toExclusive}
        AND ${ownerIsNotTeam('s.user_id')}
      ORDER BY sl.view_count DESC, sl.created_at DESC
      LIMIT 10
    `

    const [activeLinks, simulationsCreated] = await Promise.all([
      this.prisma.simulationShareLink.count({ where: { active: true, simulation: OWNER_IS_NOT_TEAM } }),
      this.prisma.simulation.count({ where: { createdAt: { gte: from, lt: toExclusive }, deleted: null, ...OWNER_IS_NOT_TEAM } }),
    ])

    const linksCreated = toNumber(totals?.links_created)

    return {
      linksCreated,
      activeLinks,
      simulationsCreated,
      activationRate: percentage(linksCreated, simulationsCreated),
      totalViews: toNumber(totals?.total_views),
      neverViewedLinks: toNumber(totals?.never_viewed),
      topShared: topShared.map(
        (row): TSharedSimulation => ({
          simulationId: row.simulation_id,
          simulationName: row.simulation_name,
          ownerType: row.owner_type,
          active: row.active,
          createdAt: row.created_at,
          viewCount: toNumber(row.view_count),
          lastViewedAt: row.last_viewed_at,
        }),
      ),
    }
  }

  async getAudienceStatistics(range: DateRange): Promise<TAudienceStatistics> {
    const [totals, byMonth, byUserType, sharing, loginTrackingStartedAt] = await Promise.all([
      this.getConnectionTotals(range),
      this.getConnectionsByMonth(range),
      this.getConnectionsByUserType(range),
      this.getSharingUsage(range),
      this.getLoginTrackingStartedAt(),
    ])

    return {
      connections: {
        total: totals.total,
        uniqueUsers: totals.uniqueUsers,
        byMonth,
        byUserType,
      },
      connectedTime: {
        totalSeconds: totals.totalSeconds,
        avgSessionSeconds: totals.avgSessionSeconds,
      },
      sharing,
      loginTrackingStartedAt,
    }
  }

  /**
   * Entonnoir d'activation, par cohorte d'inscription sur la période.
   *
   * Chaque jalon est le premier événement de son type pour l'utilisateur, ce qui rend
   * l'entonnoir monotone par construction. Les délais médians utilisent `percentile_cont`,
   * qui ignore les valeurs nulles — un utilisateur n'ayant pas franchi l'étape ne tire
   * donc pas la médiane vers le haut.
   */
  async getActivationFunnel({ from, toExclusive }: DateRange): Promise<TActivationStep[]> {
    const [row] = await this.prisma.$queryRaw<
      Array<{
        signups: bigint
        granted: bigint
        logged_in: bigint
        with_simulation: bigint
        with_export: bigint
        with_share: bigint
        median_days_to_login: string | null
        median_days_to_simulation: string | null
        median_days_to_export: string | null
        median_days_to_share: string | null
      }>
    >`
      WITH milestones AS (
        SELECT
          u.id,
          u.created_at,
          -- hasAccess n'a pas de @map dans le schema Prisma : la colonne est en camelCase.
          u."hasAccess",
          (SELECT MIN(le.started_at) FROM login_events le WHERE le.user_id = u.id) AS first_login,
          (SELECT MIN(s.created_at) FROM simulations s WHERE s.user_id = u.id) AS first_simulation,
          (
            SELECT MIN(e.created_at)
            FROM exports e
            INNER JOIN simulations s ON s.id = e.simulation_id
            WHERE s.user_id = u.id
          ) AS first_export,
          (
            SELECT MIN(sl.created_at)
            FROM simulation_share_links sl
            INNER JOIN simulations s ON s.id = sl.simulation_id
            WHERE s.user_id = u.id
          ) AS first_share
        FROM users u
        WHERE u.role = 'USER'
          AND u.created_at >= ${from}
          AND u.created_at < ${toExclusive}
      )
      SELECT
        COUNT(*) AS signups,
        COUNT(*) FILTER (WHERE "hasAccess") AS granted,
        COUNT(first_login) AS logged_in,
        COUNT(first_simulation) AS with_simulation,
        COUNT(first_export) AS with_export,
        COUNT(first_share) AS with_share,
        percentile_cont(0.5) WITHIN GROUP (ORDER BY EXTRACT(EPOCH FROM (first_login - created_at)) / 86400) AS median_days_to_login,
        percentile_cont(0.5) WITHIN GROUP (ORDER BY EXTRACT(EPOCH FROM (first_simulation - first_login)) / 86400) AS median_days_to_simulation,
        percentile_cont(0.5) WITHIN GROUP (ORDER BY EXTRACT(EPOCH FROM (first_export - first_simulation)) / 86400) AS median_days_to_export,
        percentile_cont(0.5) WITHIN GROUP (ORDER BY EXTRACT(EPOCH FROM (first_share - first_simulation)) / 86400) AS median_days_to_share
      FROM milestones
    `

    const counts = {
      access_granted: toNumber(row?.granted),
      first_export: toNumber(row?.with_export),
      first_login: toNumber(row?.logged_in),
      first_share: toNumber(row?.with_share),
      first_simulation: toNumber(row?.with_simulation),
      signup: toNumber(row?.signups),
    }

    const medians: Record<keyof typeof counts, number | null> = {
      // `has_access` est un booléen sans date d'octroi : aucun délai calculable.
      access_granted: null,
      first_export: row?.median_days_to_export == null ? null : round(Number(row.median_days_to_export), 1),
      first_login: row?.median_days_to_login == null ? null : round(Number(row.median_days_to_login), 1),
      first_share: row?.median_days_to_share == null ? null : round(Number(row.median_days_to_share), 1),
      first_simulation: row?.median_days_to_simulation == null ? null : round(Number(row.median_days_to_simulation), 1),
      signup: null,
    }

    // L'export et le partage sont deux issues PARALLÈLES du premier scénario, pas deux
    // étapes successives : un utilisateur peut partager sans jamais exporter. Les chaîner
    // produirait un taux de conversion supérieur à 100 %.
    const steps: Array<{ step: keyof typeof counts; comparedTo: keyof typeof counts | null }> = [
      { step: 'signup', comparedTo: null },
      { step: 'access_granted', comparedTo: 'signup' },
      { step: 'first_login', comparedTo: 'access_granted' },
      { step: 'first_simulation', comparedTo: 'first_login' },
      { step: 'first_export', comparedTo: 'first_simulation' },
      { step: 'first_share', comparedTo: 'first_simulation' },
    ]

    return steps.map(({ comparedTo, step }) => ({
      step,
      label: ACTIVATION_STEP_LABELS[step],
      count: counts[step],
      comparedToStep: comparedTo,
      conversionFrom: comparedTo === null ? null : percentage(counts[step], counts[comparedTo]),
      medianDaysFrom: medians[step],
    }))
  }

  async getRetentionCohorts({ from, toExclusive }: DateRange): Promise<TRetentionCohort[]> {
    const rows = await this.prisma.$queryRaw<
      Array<{ cohort: Date; signups: bigint; activated: bigint; retained_m1: bigint; retained_m3: bigint }>
    >`
      WITH cohorts AS (
        SELECT
          u.id,
          date_trunc('month', u.created_at) AS cohort,
          (SELECT MIN(le.started_at) FROM login_events le WHERE le.user_id = u.id) AS first_login,
          (SELECT MAX(le.started_at) FROM login_events le WHERE le.user_id = u.id) AS last_login
        FROM users u
        WHERE u.role = 'USER'
          AND u.created_at >= ${from}
          AND u.created_at < ${toExclusive}
      )
      SELECT
        cohort,
        COUNT(*) AS signups,
        COUNT(first_login) AS activated,
        COUNT(*) FILTER (WHERE last_login >= cohort + INTERVAL '1 month') AS retained_m1,
        COUNT(*) FILTER (WHERE last_login >= cohort + INTERVAL '3 months') AS retained_m3
      FROM cohorts
      GROUP BY cohort
      ORDER BY cohort
    `

    return rows.map((row) => ({
      cohort: row.cohort.toISOString().slice(0, 10),
      signups: toNumber(row.signups),
      activated: toNumber(row.activated),
      retainedM1: toNumber(row.retained_m1),
      retainedM3: toNumber(row.retained_m3),
    }))
  }

  async getEngagementCounts({ from, toExclusive }: DateRange) {
    const [row] = await this.prisma.$queryRaw<Array<{ never_connected: bigint; single_connection: bigint }>>`
      WITH logins AS (
        SELECT u.id, COUNT(le.id) AS nb_logins
        FROM users u
        LEFT JOIN login_events le ON le.user_id = u.id
        WHERE u.role = 'USER'
          AND u.created_at >= ${from}
          AND u.created_at < ${toExclusive}
        GROUP BY u.id
      )
      SELECT
        COUNT(*) FILTER (WHERE nb_logins = 0) AS never_connected,
        COUNT(*) FILTER (WHERE nb_logins = 1) AS single_connection
      FROM logins
    `

    return {
      neverConnected: toNumber(row?.never_connected),
      singleConnection: toNumber(row?.single_connection),
    }
  }

  /**
   * Journal des modifications de simulations, le plus récent d'abord.
   *
   * Paginé côté serveur : le journal grandit indéfiniment, et l'admin ne consulte jamais
   * que les dernières pages.
   */
  async getSimulationChanges(range: DateRange, options: { page: number; pageSize: number; action?: string; search?: string }) {
    const { action, page, pageSize, search } = options

    const where = {
      createdAt: { gte: range.from, lt: range.toExclusive },
      ...OWNER_IS_NOT_TEAM,
      ...(action ? { action } : {}),
      ...(search
        ? {
            OR: [
              { simulation: { name: { contains: search, mode: 'insensitive' as const } } },
              { userName: { contains: search, mode: 'insensitive' as const } },
            ],
          }
        : {}),
    }

    const [total, rows] = await Promise.all([
      this.prisma.simulationChange.count({ where }),
      this.prisma.simulationChange.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: { simulation: { select: { name: true } } },
      }),
    ])

    return {
      items: rows.map((row) => ({
        id: row.id,
        simulationId: row.simulationId,
        simulationName: row.simulation.name,
        action: row.action,
        actionLabel: SIMULATION_CHANGE_ACTION_LABELS[row.action as SimulationChangeAction] ?? row.action,
        userName: row.userName,
        createdAt: row.createdAt,
        changes: row.changes ?? [],
      })),
      total,
      pageCount: Math.ceil(total / pageSize),
    }
  }

  async getActivationStatistics(range: DateRange): Promise<TActivationStatistics> {
    const [funnel, retention, engagement, loginTrackingStartedAt] = await Promise.all([
      this.getActivationFunnel(range),
      this.getRetentionCohorts(range),
      this.getEngagementCounts(range),
      this.getLoginTrackingStartedAt(),
    ])

    return {
      funnel,
      retention,
      neverConnected: engagement.neverConnected,
      singleConnection: engagement.singleConnection,
      loginTrackingStartedAt,
    }
  }
}
