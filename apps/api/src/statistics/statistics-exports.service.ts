import { Injectable } from '@nestjs/common'
import { SIMULATION_CHANGE_ACTION_LABELS, type SimulationChangeAction } from '@shared'
import { csvBoolean, csvDate } from '~/common/utils/csv'
import type { DateRange } from '~/common/utils/date-range'
import { PrismaService } from '~/db/prisma.service'
import { AudienceStatisticsService } from './audience-statistics.service'

/** Rend une valeur de paramètre lisible dans un tableur. */
function formatChangeValue(value: unknown): string {
  if (value === null || value === undefined) {
    return ''
  }

  if (typeof value === 'boolean') {
    return value ? 'oui' : 'non'
  }

  if (Array.isArray(value)) {
    return value.join(', ')
  }

  // Les taux sont des flottants : les tronquer évite des colonnes illisibles.
  if (typeof value === 'number' && !Number.isInteger(value)) {
    return value.toFixed(4)
  }

  return String(value)
}

/**
 * Jeux de données exportables en CSV.
 *
 * Chaque méthode renvoie des lignes déjà mises en forme pour un tableur : en-têtes en
 * français, dates au format ISO court, booléens en oui/non. Les colonnes sont déclarées
 * explicitement pour qu'un export sans résultat conserve sa ligne d'en-tête.
 */
@Injectable()
export class StatisticsExportsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audienceStatisticsService: AudienceStatisticsService,
  ) {}

  static readonly CONNECTIONS_COLUMNS = [
    'Date de connexion',
    'Utilisateur',
    'Email',
    "Type d'organisme",
    'Région',
    'Méthode',
    'Durée (minutes)',
  ]

  async getConnections({ from, toExclusive }: DateRange) {
    const rows = await this.prisma.$queryRaw<
      Array<{
        started_at: Date
        last_seen_at: Date
        firstname: string
        lastname: string
        email: string
        user_type: string | null
        region: string | null
        provider: string | null
      }>
    >`
      SELECT le.started_at, le.last_seen_at, u.firstname, u.lastname, u.email,
             le.user_type::text AS user_type, le.region, le.provider
      FROM login_events le
      INNER JOIN users u ON u.id = le.user_id
      WHERE le.started_at >= ${from} AND le.started_at < ${toExclusive}
      ORDER BY le.started_at DESC
    `

    return rows.map((row) => ({
      'Date de connexion': csvDate(row.started_at),
      Utilisateur: `${row.firstname} ${row.lastname}`,
      Email: row.email,
      "Type d'organisme": row.user_type ?? '',
      Région: row.region ?? '',
      Méthode: row.provider ?? '',
      'Durée (minutes)': Math.round((row.last_seen_at.getTime() - row.started_at.getTime()) / 60000),
    }))
  }

  static readonly MONTHLY_CONNECTIONS_COLUMNS = [
    'Mois',
    'Connexions',
    'Utilisateurs actifs',
    'Temps connecté cumulé (minutes)',
    'Durée moyenne (minutes)',
  ]

  async getMonthlyConnections(range: DateRange) {
    const rows = await this.audienceStatisticsService.getConnectionsByMonth(range)

    return rows.map((row) => ({
      Mois: row.month.slice(0, 7),
      Connexions: row.nbConnections,
      'Utilisateurs actifs': row.activeUsers,
      'Temps connecté cumulé (minutes)': Math.round(row.totalSeconds / 60),
      'Durée moyenne (minutes)': Math.round(row.avgSessionSeconds / 60),
    }))
  }

  static readonly ACTIVATION_COLUMNS = [
    'Utilisateur',
    'Email',
    "Type d'organisme",
    'Région',
    'Inscription',
    'Accès accordé',
    'Première connexion',
    'Premier scénario',
    'Premier export',
    'Premier partage',
    'Nombre de connexions',
  ]

  /** Une ligne par utilisateur avec ses jalons : la matière première de l'entonnoir. */
  async getActivation({ from, toExclusive }: DateRange) {
    const rows = await this.prisma.$queryRaw<
      Array<{
        firstname: string
        lastname: string
        email: string
        user_type: string | null
        region: string | null
        created_at: Date
        has_access: boolean
        first_login: Date | null
        first_simulation: Date | null
        first_export: Date | null
        first_share: Date | null
        nb_logins: bigint
      }>
    >`
      SELECT
        u.firstname, u.lastname, u.email, u.type::text AS user_type, u.region,
        u.created_at, u."hasAccess" AS has_access,
        (SELECT MIN(le.started_at) FROM login_events le WHERE le.user_id = u.id) AS first_login,
        (SELECT COUNT(*) FROM login_events le WHERE le.user_id = u.id) AS nb_logins,
        (SELECT MIN(s.created_at) FROM simulations s WHERE s.user_id = u.id) AS first_simulation,
        (
          SELECT MIN(e.created_at) FROM exports e
          INNER JOIN simulations s ON s.id = e.simulation_id
          WHERE s.user_id = u.id
        ) AS first_export,
        (
          SELECT MIN(sl.created_at) FROM simulation_share_links sl
          INNER JOIN simulations s ON s.id = sl.simulation_id
          WHERE s.user_id = u.id
        ) AS first_share
      FROM users u
      WHERE u.role = 'USER' AND u.created_at >= ${from} AND u.created_at < ${toExclusive}
      ORDER BY u.created_at DESC
    `

    return rows.map((row) => ({
      Utilisateur: `${row.firstname} ${row.lastname}`,
      Email: row.email,
      "Type d'organisme": row.user_type ?? '',
      Région: row.region ?? '',
      Inscription: csvDate(row.created_at),
      'Accès accordé': csvBoolean(row.has_access),
      'Première connexion': csvDate(row.first_login),
      'Premier scénario': csvDate(row.first_simulation),
      'Premier export': csvDate(row.first_export),
      'Premier partage': csvDate(row.first_share),
      'Nombre de connexions': Number(row.nb_logins),
    }))
  }

  static readonly RETENTION_COLUMNS = [
    "Cohorte d'inscription",
    'Inscrits',
    'Activés',
    'Retenus M+1',
    'Retenus M+3',
    "Taux d'activation (%)",
  ]

  async getRetention(range: DateRange) {
    const rows = await this.audienceStatisticsService.getRetentionCohorts(range)

    return rows.map((row) => ({
      "Cohorte d'inscription": row.cohort.slice(0, 7),
      Inscrits: row.signups,
      Activés: row.activated,
      'Retenus M+1': row.retainedM1,
      'Retenus M+3': row.retainedM3,
      "Taux d'activation (%)": row.signups === 0 ? 0 : Math.round((row.activated / row.signups) * 1000) / 10,
    }))
  }

  static readonly SHARES_COLUMNS = [
    'Scénario',
    'Propriétaire',
    "Type d'organisme",
    'Lien créé le',
    'Actif',
    'Consultations (cumulées)',
    'Dernière consultation',
  ]

  /**
   * Les consultations sont un compteur cumulatif depuis la création du lien : elles ne
   * peuvent pas être bornées par la période, contrairement à la date de création.
   */
  async getShares({ from, toExclusive }: DateRange) {
    const rows = await this.prisma.$queryRaw<
      Array<{
        simulation_name: string
        firstname: string | null
        lastname: string | null
        user_type: string | null
        created_at: Date
        active: boolean
        view_count: number
        last_viewed_at: Date | null
      }>
    >`
      SELECT s.name AS simulation_name, u.firstname, u.lastname, u.type::text AS user_type,
             sl.created_at, sl.active, sl.view_count, sl.last_viewed_at
      FROM simulation_share_links sl
      INNER JOIN simulations s ON s.id = sl.simulation_id
      LEFT JOIN users u ON u.id = s.user_id
      WHERE sl.created_at >= ${from} AND sl.created_at < ${toExclusive}
      ORDER BY sl.view_count DESC, sl.created_at DESC
    `

    return rows.map((row) => ({
      Scénario: row.simulation_name,
      Propriétaire: row.firstname ? `${row.firstname} ${row.lastname}` : '',
      "Type d'organisme": row.user_type ?? '',
      'Lien créé le': csvDate(row.created_at),
      Actif: csvBoolean(row.active),
      'Consultations (cumulées)': row.view_count,
      'Dernière consultation': csvDate(row.last_viewed_at),
    }))
  }

  static readonly EXPORTS_COLUMNS = [
    'Date',
    'Type',
    'Scénario',
    'Utilisateur',
    "Type d'organisme",
    'Scénario privilégié',
    'Type de document',
    'Prochaine étape',
    "Début de période d'étude",
    "Fin de période d'étude",
  ]

  async getExports({ from, toExclusive }: DateRange) {
    const rows = await this.prisma.$queryRaw<
      Array<{
        created_at: Date
        type: string
        simulation_name: string
        firstname: string | null
        lastname: string | null
        user_type: string | null
        is_privileged: boolean
        document_type: string | null
        next_step: string | null
        period_start: number | null
        period_end: number | null
      }>
    >`
      SELECT e.created_at, e.type::text AS type, s.name AS simulation_name,
             u.firstname, u.lastname, u.type::text AS user_type,
             e.is_privileged, e.document_type, e.next_step, e.period_start, e.period_end
      FROM exports e
      INNER JOIN simulations s ON s.id = e.simulation_id
      LEFT JOIN users u ON u.id = s.user_id
      WHERE e.created_at >= ${from} AND e.created_at < ${toExclusive}
      ORDER BY e.created_at DESC
    `

    return rows.map((row) => ({
      Date: csvDate(row.created_at),
      Type: row.type,
      Scénario: row.simulation_name,
      Utilisateur: row.firstname ? `${row.firstname} ${row.lastname}` : '',
      "Type d'organisme": row.user_type ?? '',
      'Scénario privilégié': csvBoolean(row.is_privileged),
      'Type de document': row.document_type ?? '',
      'Prochaine étape': row.next_step ?? '',
      "Début de période d'étude": row.period_start ?? '',
      "Fin de période d'étude": row.period_end ?? '',
    }))
  }

  static readonly FEEDBACKS_COLUMNS = ['Date', 'Note', 'Commentaire', 'Utilisateur', "Type d'organisme", 'Région']

  async getFeedbacks({ from, toExclusive }: DateRange) {
    const rows = await this.prisma.userFeedback.findMany({
      // Les retours reportés (`SNOOZED`) n'ont ni note ni commentaire : les inclure
      // remplirait l'export de lignes vides.
      where: { createdAt: { gte: from, lt: toExclusive }, status: 'SUBMITTED' },
      orderBy: { createdAt: 'desc' },
      include: { user: { select: { firstname: true, lastname: true, region: true, type: true } } },
    })

    return rows.map((row) => ({
      Date: csvDate(row.createdAt),
      Note: row.rating ?? '',
      Commentaire: row.comment ?? '',
      Utilisateur: `${row.user.firstname} ${row.user.lastname}`,
      "Type d'organisme": row.user.type ?? '',
      Région: row.user.region ?? '',
    }))
  }

  static readonly SIMULATION_CHANGES_COLUMNS = ['Date', 'Scénario', 'Auteur', 'Action', 'Paramètre', 'Avant', 'Après']

  /**
   * Journal des modifications, une ligne par champ modifié.
   *
   * Un enregistrement du wizard touche souvent plusieurs paramètres : les aplatir rend
   * le fichier filtrable par paramètre dans un tableur, ce qu'une colonne JSON interdirait.
   */
  async getSimulationChanges({ from, toExclusive }: DateRange) {
    const rows = await this.prisma.simulationChange.findMany({
      where: { createdAt: { gte: from, lt: toExclusive } },
      orderBy: { createdAt: 'desc' },
      include: { simulation: { select: { name: true } } },
    })

    return rows.flatMap((row) => {
      const base = {
        Date: csvDate(row.createdAt),
        Scénario: row.simulation.name,
        Auteur: row.userName ?? '',
        Action: SIMULATION_CHANGE_ACTION_LABELS[row.action as SimulationChangeAction] ?? row.action,
      }

      if (!row.changes?.length) {
        return [{ ...base, Paramètre: '', Avant: '', Après: '' }]
      }

      return row.changes.map((change) => ({
        ...base,
        Paramètre: change.label,
        Avant: formatChangeValue(change.before),
        Après: formatChangeValue(change.after),
      }))
    })
  }

  static readonly CALCULATIONS_COLUMNS = ['Date du calcul', 'Scénario', 'Nombre EPCI', 'Durée (ms)']

  /**
   * Latence des calculs de résultats.
   *
   * Une ligne par jeu de résultats distinct : les recalculs identiques rafraîchissent la
   * ligne existante plutôt que d'en créer une, donc la durée est celle du dernier calcul.
   */
  async getCalculations({ from, toExclusive }: DateRange) {
    const rows = await this.prisma.$queryRaw<
      Array<{ calculated_at: Date; simulation_name: string; nb_epcis: number | null; duration_ms: number | null }>
    >`
      SELECT h.calculated_at, s.name AS simulation_name, h.nb_epcis, h.duration_ms
      FROM simulation_results_history h
      INNER JOIN simulations s ON s.id = h.simulation_id
      WHERE h.calculated_at >= ${from} AND h.calculated_at < ${toExclusive}
        AND h.duration_ms IS NOT NULL
      ORDER BY h.duration_ms DESC
    `

    return rows.map((row) => ({
      'Date du calcul': csvDate(row.calculated_at),
      Scénario: row.simulation_name,
      'Nombre EPCI': row.nb_epcis ?? '',
      'Durée (ms)': row.duration_ms ?? '',
    }))
  }

  static readonly API_USAGE_COLUMNS = ['Jour', 'Consommateur', 'Appels']

  async getApiUsage({ from, toExclusive }: DateRange) {
    const rows = await this.prisma.$queryRaw<Array<{ day: Date; name: string; count: number }>>`
      SELECT u.day, c.name, u.count
      FROM api_consumer_usage_daily u
      INNER JOIN api_consumers c ON c.id = u.api_consumer_id
      WHERE u.day >= ${from} AND u.day < ${toExclusive}
      ORDER BY u.day DESC, u.count DESC
    `

    return rows.map((row) => ({
      Jour: csvDate(row.day),
      Consommateur: row.name,
      Appels: row.count,
    }))
  }

  static readonly EPCI_GROUPS_COLUMNS = [
    "Dossier d'études",
    'Créé le',
    'Propriétaire',
    "Type d'organisme",
    'Nombre de scénarios',
    'Nombre EPCI',
    "Document d'urbanisme en cours",
  ]

  async getEpciGroups({ from, toExclusive }: DateRange) {
    const rows = await this.prisma.$queryRaw<
      Array<{
        name: string
        created_at: Date
        firstname: string | null
        lastname: string | null
        user_type: string | null
        nb_simulations: bigint
        nb_epcis: bigint
        works_on_planning_document: boolean | null
      }>
    >`
      SELECT g.name, g.created_at, u.firstname, u.lastname, u.type::text AS user_type,
             g.works_on_planning_document,
             (SELECT COUNT(*) FROM simulations s WHERE s.epci_group_id = g.id AND s.deleted IS NULL) AS nb_simulations,
             (SELECT COUNT(*) FROM epci_group_epcis ge WHERE ge.epci_group_id = g.id) AS nb_epcis
      FROM epci_groups g
      LEFT JOIN users u ON u.id = g.user_id
      WHERE g.deleted IS NULL AND g.created_at >= ${from} AND g.created_at < ${toExclusive}
      ORDER BY g.created_at DESC
    `

    return rows.map((row) => ({
      "Dossier d'études": row.name,
      'Créé le': csvDate(row.created_at),
      Propriétaire: row.firstname ? `${row.firstname} ${row.lastname}` : '',
      "Type d'organisme": row.user_type ?? '',
      'Nombre de scénarios': Number(row.nb_simulations),
      'Nombre EPCI': Number(row.nb_epcis),
      "Document d'urbanisme en cours":
        row.works_on_planning_document === null ? 'non renseigné' : csvBoolean(row.works_on_planning_document),
    }))
  }
}
