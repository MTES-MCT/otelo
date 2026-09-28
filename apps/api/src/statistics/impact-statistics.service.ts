import { Injectable } from '@nestjs/common'
import {
  IMPACT_DECISION_NEXT_STEPS,
  IMPACT_PLANNING_DOCUMENT_KEYS,
  NEED_COMPONENTS,
  TARGET_REDUCTION_DOMAINS,
  type TImpactPlanningDocumentKey,
  type TImpactStatistics,
  type TPlanningDocumentByMonth,
  type TTargetReduction,
  type TTargetReductionDomain,
  type TTerritoryNeeds,
} from '@shared'
import type { DateRange } from '~/common/utils/date-range'
import { PrismaService } from '~/db/prisma.service'
import { Prisma } from '~/generated/prisma/client'
import { percentage, round, toNumber } from './statistics-numbers'
import { ownerIsNotTeam } from './team'

/** Délai au-delà duquel un retour sur un dossier traduit un usage installé plutôt qu'une session de travail. */
const LONG_TERM_USE_INTERVAL = Prisma.sql`INTERVAL '90 days'`

/**
 * Simulations créées sur la période, hors équipe et hors suppressions.
 *
 * Point d'entrée commun des indicateurs de paramétrage : la période désigne le moment
 * où le scénario a été construit, pas celui où il a été modifié ou exporté.
 */
const simulationsCreatedIn = ({ from, toExclusive }: DateRange): Prisma.Sql => Prisma.sql`
  SELECT s.id, s.scenario_id, s.epci_group_id, s.user_id
  FROM simulations s
  WHERE s.deleted IS NULL
    AND s.created_at >= ${from} AND s.created_at < ${toExclusive}
    AND ${ownerIsNotTeam('s.user_id')}
`

/**
 * Simulations exportées sur la période, qu'il s'agisse d'un PowerPoint ou d'un Excel.
 * Un export est le signe qu'un scénario sort d'Otelo pour servir ailleurs.
 */
const simulationsExportedIn = ({ from, toExclusive }: DateRange): Prisma.Sql => Prisma.sql`
  SELECT DISTINCT s.id, s.scenario_id, s.epci_group_id
  FROM exports e
  INNER JOIN simulations s ON s.id = e.simulation_id
  WHERE e.created_at >= ${from} AND e.created_at < ${toExclusive}
    AND ${ownerIsNotTeam('s.user_id')}
`

/** Type de document d'urbanisme d'un dossier (`g`), ramené aux clés de `IMPACT_PLANNING_DOCUMENT_KEYS`. */
const PLANNING_DOCUMENT_KEY = Prisma.sql`
  CASE
    WHEN g.planning_document_type IS NOT NULL THEN g.planning_document_type::text
    WHEN g.works_on_planning_document = false THEN 'AUCUN'
    ELSE 'NON_RENSEIGNE'
  END
`

/**
 * Paramètres du mal-logement restés identiques d'une génération de valeurs par défaut à l'autre.
 * Le scénario est désigné par l'alias `sc`.
 */
const BAD_HOUSING_STABLE_DEFAULTS = Prisma.sql`
  sc.b11_sa AND sc.b11_fortune AND sc.b11_hotel
  AND sc.source_b11::text = 'RP'
  AND sc.b12_heberg_particulier AND sc.b12_heberg_temporaire
  AND sc.b13_plp AND sc.b13_taux_effort = 30
  AND sc.b14_confort = 'RP_abs_sani' AND sc.b14_occupation = 'prop_loc' AND sc.b14_qualite IS NULL
  AND sc.source_b14::text = 'Filo'
  AND NOT sc.b15_proprietaire AND sc.b15_loc_hors_hlm
  AND sc.b15_surocc::text = 'Acc' AND sc.source_b15::text = 'Filo'
  AND sc.b17_motif::text = 'Tout'
`

/** Types d'établissements du scénario, triés pour comparer sans dépendre de l'ordre de saisie. */
const SORTED_B11_ETABLISSEMENT = Prisma.sql`(SELECT array_agg(value ORDER BY value) FROM unnest(sc.b11_etablissement::text[]) AS value)`

/** Valeurs par défaut actuelles : les `@default` du modèle `Scenario`. */
const BAD_HOUSING_CURRENT_DEFAULTS = Prisma.sql`
  sc.b11_part_etablissement = 50
  AND ${SORTED_B11_ETABLISSEMENT} = ARRAY['autreCentre', 'centreProvisoire', 'demandeAsile', 'reinsertion']
  AND sc.b12_cohab_interg_subie = 30
  AND NOT sc.b13_acc AND sc.b13_taux_reallocation = 90
  AND sc.b14_taux_reallocation = 50
  AND sc.b15_taux_reallocation = 90
`

/** Valeurs par défaut de la migration `0_init`, remplacées par `bad_housing_default_settings` (juillet 2025). */
const BAD_HOUSING_LEGACY_DEFAULTS = Prisma.sql`
  sc.b11_part_etablissement = 100
  AND ${SORTED_B11_ETABLISSEMENT} = ARRAY[
    'autreCentre', 'centreProvisoire', 'demandeAsile', 'foyerMigrants', 'horsMaisonRelai',
    'jeuneTravailleur', 'maisonRelai', 'malade', 'reinsertion'
  ]
  AND sc.b12_cohab_interg_subie = 50
  AND sc.b13_acc AND sc.b13_taux_reallocation = 80
  AND sc.b14_taux_reallocation = 80
  AND sc.b15_taux_reallocation = 80
`

/**
 * Vrai quand le paramétrage du mal-logement d'un scénario (`sc`) n'a pas été touché.
 *
 * Les valeurs par défaut sont écrites dans le scénario à sa création : un scénario créé
 * avant juillet 2025 porte donc les anciennes. Les deux jeux sont acceptés quelle que soit
 * la date, plutôt qu'un basculement à la date de la migration : la mise en production a
 * suivi la migration de quelques jours, et un utilisateur qui recomposerait à la main
 * l'intégralité des anciens défauts est un cas qui ne se présente pas.
 */
const BAD_HOUSING_IS_DEFAULT = Prisma.sql`(
  ${BAD_HOUSING_STABLE_DEFAULTS}
  AND ((${BAD_HOUSING_CURRENT_DEFAULTS}) OR (${BAD_HOUSING_LEGACY_DEFAULTS}))
)`

const NOT_SPECIFIED = 'Non renseigné'

@Injectable()
export class ImpactStatisticsService {
  constructor(private readonly prisma: PrismaService) {}

  async getImpactStatistics(range: DateRange): Promise<TImpactStatistics> {
    const [settings, planningDocuments, impact, perceivedUtility] = await Promise.all([
      this.getSettingsUsage(range),
      this.getPlanningDocumentsUsage(range),
      this.getImpact(range),
      this.getPerceivedUtility(range),
    ])

    return { settings, planningDocuments, impact, perceivedUtility }
  }

  async getSettingsUsage(range: DateRange): Promise<TImpactStatistics['settings']> {
    const sims = simulationsCreatedIn(range)

    const [byOmphale, byHorizon, byMillesime, targetReductions, badHousing, sources, customProjections, depth, dossiers] =
      await Promise.all([
        this.prisma.$queryRaw<Array<{ population: string; decohabitation: string; count: bigint }>>`
          WITH sims AS (${sims})
          SELECT split_part(sc.b2_scenario, '_', 1) AS population, split_part(sc.b2_scenario, '_', 2) AS decohabitation, COUNT(*) AS count
          FROM sims
          INNER JOIN scenarios sc ON sc.id = sims.scenario_id
          GROUP BY 1, 2
          ORDER BY 3 DESC
        `,
        this.prisma.$queryRaw<Array<{ label: string; count: bigint }>>`
          WITH sims AS (${sims})
          SELECT sc.projection::text AS label, COUNT(*) AS count
          FROM sims
          INNER JOIN scenarios sc ON sc.id = sims.scenario_id
          GROUP BY sc.projection
          ORDER BY sc.projection
        `,
        this.prisma.$queryRaw<Array<{ label: string; count: bigint }>>`
          WITH sims AS (${sims})
          SELECT sc.millesime AS label, COUNT(*) AS count
          FROM sims
          INNER JOIN scenarios sc ON sc.id = sims.scenario_id
          GROUP BY sc.millesime
          ORDER BY sc.millesime
        `,
        this.getTargetReductions(sims),
        this.prisma.$queryRaw<Array<{ customized: bigint }>>`
          WITH sims AS (${sims})
          SELECT COUNT(*) FILTER (WHERE NOT ${BAD_HOUSING_IS_DEFAULT}) AS customized
          FROM sims
          INNER JOIN scenarios sc ON sc.id = sims.scenario_id
        `,
        this.prisma.$queryRaw<Array<{ parameter: string; value: string; count: bigint }>>`
          WITH sims AS (${sims}),
          scenario_sources AS (
            SELECT sc.source_b11::text AS b11, sc.source_b14::text AS b14, sc.source_b15::text AS b15
            FROM sims
            INNER JOIN scenarios sc ON sc.id = sims.scenario_id
          )
          SELECT 'Hors logement' AS parameter, b11 AS value, COUNT(*) AS count FROM scenario_sources GROUP BY b11
          UNION ALL
          SELECT 'Mauvaise qualité', b14, COUNT(*) FROM scenario_sources GROUP BY b14
          UNION ALL
          SELECT 'Inadéquation physique', b15, COUNT(*) FROM scenario_sources GROUP BY b15
          ORDER BY 1, 3 DESC
        `,
        this.prisma.$queryRaw<Array<{ scenarios: bigint; users: bigint }>>`
          WITH sims AS (${sims})
          SELECT COUNT(DISTINCT d.scenario_id) AS scenarios, COUNT(DISTINCT d.user_id) AS users
          FROM demographic_evolution_omphale_custom d
          INNER JOIN sims ON sims.scenario_id = d.scenario_id
        `,
        this.prisma.$queryRaw<Array<{ modified_simulations: bigint; modifications: bigint; clones: bigint; actualizations: bigint }>>`
          WITH sims AS (${sims})
          SELECT
            (SELECT COUNT(DISTINCT sc.simulation_id) FROM simulation_changes sc INNER JOIN sims ON sims.id = sc.simulation_id
              WHERE sc.action = 'scenario.updated') AS modified_simulations,
            (SELECT COUNT(*) FROM simulation_changes sc INNER JOIN sims ON sims.id = sc.simulation_id
              WHERE sc.action = 'scenario.updated') AS modifications,
            (SELECT COUNT(*) FROM simulation_changes sc
              WHERE sc.action = 'simulation.cloned'
                AND sc.created_at >= ${range.from} AND sc.created_at < ${range.toExclusive}
                AND ${ownerIsNotTeam('sc.user_id')}) AS clones,
            (SELECT COUNT(*) FROM simulation_changes sc
              WHERE sc.action = 'simulation.actualized'
                AND sc.created_at >= ${range.from} AND sc.created_at < ${range.toExclusive}
                AND ${ownerIsNotTeam('sc.user_id')}) AS actualizations
        `,
        // Tous les scénarios vivants du dossier comptent, pas seulement ceux de la période :
        // un dossier ouvert en janvier et complété en mars se compare bien à deux scénarios.
        this.prisma.$queryRaw<Array<{ dossiers: bigint; avg_simulations: string | null; with_several: bigint }>>`
          WITH sims AS (${sims}),
          dossiers AS (
            SELECT g.id, (SELECT COUNT(*) FROM simulations s WHERE s.epci_group_id = g.id AND s.deleted IS NULL) AS nb_simulations
            FROM epci_groups g
            WHERE g.id IN (SELECT epci_group_id FROM sims WHERE epci_group_id IS NOT NULL)
          )
          SELECT
            COUNT(*) AS dossiers,
            AVG(nb_simulations) AS avg_simulations,
            COUNT(*) FILTER (WHERE nb_simulations >= 2) AS with_several
          FROM dossiers
        `,
      ])

    const scenarios = byHorizon.reduce((sum, row) => sum + toNumber(row.count), 0)
    const depthRow = depth[0]
    const dossierRow = dossiers[0]

    return {
      scenarios,
      byOmphale: byOmphale.map((row) => ({ population: row.population, decohabitation: row.decohabitation, count: toNumber(row.count) })),
      byHorizon: byHorizon.map((row) => ({ label: row.label, count: toNumber(row.count) })),
      byMillesime: byMillesime.map((row) => ({ label: row.label, count: toNumber(row.count) })),
      targetReductions,
      customizedBadHousing: toNumber(badHousing[0]?.customized),
      badHousingSources: sources.map((row) => ({ parameter: row.parameter, value: row.value, count: toNumber(row.count) })),
      customProjections: {
        scenarios: toNumber(customProjections[0]?.scenarios),
        users: toNumber(customProjections[0]?.users),
      },
      depth: {
        modifiedSimulations: toNumber(depthRow?.modified_simulations),
        avgModificationsPerSimulation: scenarios === 0 ? 0 : round(toNumber(depthRow?.modifications) / scenarios, 1),
        clones: toNumber(depthRow?.clones),
        actualizations: toNumber(depthRow?.actualizations),
        dossiers: toNumber(dossierRow?.dossiers),
        avgSimulationsPerDossier: round(toNumber(dossierRow?.avg_simulations), 1),
        dossiersWithSeveralSimulations: toNumber(dossierRow?.with_several),
      },
    }
  }

  /**
   * Réduction retenue sur chaque taux cible, rapportée au taux observé que le paramétrage
   * propose par défaut.
   *
   * Le taux observé n'est pas stocké avec le scénario : il est recalculé ici à l'identique
   * de `AccommodationRatesService.getAccommodationRates`, sur le millésime du scénario —
   * Filocom pour les taux, LOVAC pour la part de vacance longue. Un taux observé nul rend
   * la réduction incalculable : l'EPCI est alors écarté, pas compté à zéro.
   *
   * Pour la vacance, l'objectif porte sur la seule vacance longue. Les scénarios antérieurs
   * à la distinction courte / longue ont les deux colonnes à zéro et sont écartés : un
   * utilisateur qui supprime toute la vacance longue garde, lui, sa vacance courte.
   */
  private async getTargetReductions(sims: Prisma.Sql): Promise<TTargetReduction[]> {
    const [row] = await this.prisma.$queryRaw<
      Array<Record<`${'avg' | 'median' | 'count'}_${TTargetReductionDomain}`, number | bigint | null>>
    >`
      WITH sims AS (${sims}),
      observed AS (
        SELECT
          sims.id AS simulation_id,
          es.b2_tx_vacance_longue AS target_vacancy,
          (es.b2_tx_vacance_longue = 0 AND es.b2_tx_vacance_courte = 0) AS no_vacancy_split,
          es.b2_tx_rs AS target_secondary,
          es.b2_tx_restructuration AS target_restructuring,
          es.b2_tx_disparition AS target_disappearance,
          CASE WHEN lovac.nb_log_vac_2less > 0
            THEN f.tx_lv_parctot * lovac.nb_log_vac_2more::float / lovac.nb_log_vac_2less
            ELSE 0
          END AS observed_vacancy,
          f.tx_rs_parctot AS observed_secondary,
          -- Les millésimes antérieurs à 2022 livrent des taux cumulés sur six ans.
          f.tx_rest_parctot / CASE WHEN sc.millesime::int >= 2022 THEN 1 ELSE 6 END AS observed_restructuring,
          f.tx_disp_parctot / CASE WHEN sc.millesime::int >= 2022 THEN 1 ELSE 6 END AS observed_disappearance
        FROM sims
        INNER JOIN scenarios sc ON sc.id = sims.scenario_id
        INNER JOIN epci_scenarios es ON es.scenario_id = sc.id
        INNER JOIN filocom_flux f ON f.epci_code = es.epci_code AND f.millesime = sc.millesime
        -- L'année du millésime si LOVAC la couvre, sinon la plus récente, comme \`VacancyService.getNewestVacancy\`.
        LEFT JOIN LATERAL (
          SELECT v.nb_log_vac_2less, v.nb_log_vac_2more
          FROM vacancy_accommodation v
          WHERE v.epci_code = es.epci_code
          ORDER BY (v.year = sc.millesime::int) DESC, v.year DESC
          LIMIT 1
        ) lovac ON true
      ),
      per_simulation AS (
        SELECT
          simulation_id,
          AVG(100 * (1 - target_vacancy / observed_vacancy)) FILTER (WHERE observed_vacancy > 0 AND NOT no_vacancy_split) AS longTermVacancy,
          AVG(100 * (1 - target_secondary / observed_secondary)) FILTER (WHERE observed_secondary > 0) AS secondaryResidences,
          AVG(100 * (1 - target_restructuring / observed_restructuring)) FILTER (WHERE observed_restructuring > 0) AS restructuring,
          AVG(100 * (1 - target_disappearance / observed_disappearance)) FILTER (WHERE observed_disappearance > 0) AS disappearance
        FROM observed
        GROUP BY simulation_id
      )
      SELECT
        AVG(longTermVacancy) AS "avg_longTermVacancy",
        percentile_cont(0.5) WITHIN GROUP (ORDER BY longTermVacancy) AS "median_longTermVacancy",
        COUNT(longTermVacancy) AS "count_longTermVacancy",
        AVG(secondaryResidences) AS "avg_secondaryResidences",
        percentile_cont(0.5) WITHIN GROUP (ORDER BY secondaryResidences) AS "median_secondaryResidences",
        COUNT(secondaryResidences) AS "count_secondaryResidences",
        AVG(restructuring) AS "avg_restructuring",
        percentile_cont(0.5) WITHIN GROUP (ORDER BY restructuring) AS "median_restructuring",
        COUNT(restructuring) AS "count_restructuring",
        AVG(disappearance) AS "avg_disappearance",
        percentile_cont(0.5) WITHIN GROUP (ORDER BY disappearance) AS "median_disappearance",
        COUNT(disappearance) AS "count_disappearance"
      FROM per_simulation
    `

    return TARGET_REDUCTION_DOMAINS.map((domain) => ({
      domain,
      average: nullableRound(row?.[`avg_${domain}`], 1),
      median: nullableRound(row?.[`median_${domain}`], 1),
      scenarios: toNumber(row?.[`count_${domain}`]),
    }))
  }

  /** Dossiers d'études créés sur la période, par type de document d'urbanisme déclaré. */
  async getPlanningDocumentsUsage({ from, toExclusive }: DateRange): Promise<TImpactStatistics['planningDocuments']> {
    const dossiers = Prisma.sql`
      SELECT
        g.id,
        g.created_at,
        u.type::text AS user_type,
        ${PLANNING_DOCUMENT_KEY} AS document_type,
        (SELECT COUNT(*) FROM simulations s WHERE s.epci_group_id = g.id AND s.deleted IS NULL) AS nb_simulations,
        (SELECT COUNT(*) FROM epci_group_epcis ge WHERE ge.epci_group_id = g.id) AS nb_epcis,
        (
          SELECT MIN(e.created_at)
          FROM exports e
          INNER JOIN simulations s ON s.id = e.simulation_id
          WHERE s.epci_group_id = g.id
        ) AS first_export
      FROM epci_groups g
      LEFT JOIN users u ON u.id = g.user_id
      WHERE g.deleted IS NULL
        AND g.created_at >= ${from} AND g.created_at < ${toExclusive}
        AND ${ownerIsNotTeam('g.user_id')}
    `

    const [byType, byMonth, byUserType] = await Promise.all([
      this.prisma.$queryRaw<
        Array<{
          document_type: TImpactPlanningDocumentKey
          dossiers: bigint
          simulations: string
          avg_simulations: string
          avg_epcis: string
          exported: bigint
          median_days_to_export: number | null
        }>
      >`
        WITH dossiers AS (${dossiers})
        SELECT
          document_type,
          COUNT(*) AS dossiers,
          SUM(nb_simulations) AS simulations,
          AVG(nb_simulations) AS avg_simulations,
          AVG(nb_epcis) AS avg_epcis,
          COUNT(first_export) AS exported,
          percentile_cont(0.5) WITHIN GROUP (ORDER BY EXTRACT(EPOCH FROM (first_export - created_at)) / 86400) AS median_days_to_export
        FROM dossiers
        GROUP BY document_type
      `,
      this.prisma.$queryRaw<Array<{ month: Date; document_type: TImpactPlanningDocumentKey; dossiers: bigint }>>`
        WITH dossiers AS (${dossiers})
        SELECT date_trunc('month', created_at) AS month, document_type, COUNT(*) AS dossiers
        FROM dossiers
        GROUP BY 1, 2
        ORDER BY 1
      `,
      this.prisma.$queryRaw<Array<{ user_type: string | null; document_type: TImpactPlanningDocumentKey; dossiers: bigint }>>`
        WITH dossiers AS (${dossiers})
        SELECT user_type, document_type, COUNT(*) AS dossiers
        FROM dossiers
        GROUP BY 1, 2
        ORDER BY 3 DESC
      `,
    ])

    const typeRows = new Map(byType.map((row) => [row.document_type, row]))

    const months = new Map<string, TPlanningDocumentByMonth>()
    for (const row of byMonth) {
      const month = row.month.toISOString().slice(0, 10)
      const entry = months.get(month) ?? { month, PLH_PLUI: 0, SCOT: 0, AUTRES: 0, AUCUN: 0, NON_RENSEIGNE: 0 }
      entry[row.document_type] = toNumber(row.dossiers)
      months.set(month, entry)
    }

    return {
      // Toutes les clés, même vides : un type absent se lit comme « zéro », pas comme un oubli.
      byType: IMPACT_PLANNING_DOCUMENT_KEYS.map((documentType) => {
        const row = typeRows.get(documentType)
        const count = toNumber(row?.dossiers)

        return {
          documentType,
          dossiers: count,
          simulations: toNumber(row?.simulations),
          avgSimulationsPerDossier: round(toNumber(row?.avg_simulations), 1),
          avgEpcisPerDossier: round(toNumber(row?.avg_epcis), 1),
          exportRate: percentage(toNumber(row?.exported), count),
          medianDaysToExport: nullableRound(row?.median_days_to_export, 1),
        }
      }),
      byMonth: [...months.values()],
      byUserType: byUserType.map((row) => ({
        userType: row.user_type,
        documentType: row.document_type,
        dossiers: toNumber(row.dossiers),
      })),
    }
  }

  async getImpact(range: DateRange): Promise<TImpactStatistics['impact']> {
    const { from, toExclusive } = range
    const exported = simulationsExportedIn(range)

    // Une demande de PowerPoint écrit une ligne par scénario, toutes au même horodatage :
    // le couple (utilisateur, horodatage) identifie la demande, comme dans `getUsersWithExportedScenariosCount`.
    const requests = Prisma.sql`
      SELECT DISTINCT ON (s.user_id, e.created_at) e.next_step, e.document_type
      FROM exports e
      INNER JOIN simulations s ON s.id = e.simulation_id
      WHERE e.type = 'POWERPOINT'
        AND e.created_at >= ${from} AND e.created_at < ${toExclusive}
        AND ${ownerIsNotTeam('s.user_id')}
      ORDER BY s.user_id, e.created_at, e.is_privileged DESC
    `

    // Population du dernier recensement disponible pour chaque EPCI.
    const latestPopulation = Prisma.sql`
      SELECT DISTINCT ON (epci_code) epci_code, population
      FROM rp
      ORDER BY epci_code, millesime DESC, year DESC
    `

    const [byNextStep, byDocumentType, coverage, sharing, sharedEpcis, longTermUse, exportedNeeds, allNeeds] = await Promise.all([
      this.prisma.$queryRaw<Array<{ label: string | null; count: bigint }>>`
          WITH requests AS (${requests})
          SELECT next_step AS label, COUNT(*) AS count FROM requests GROUP BY 1 ORDER BY 2 DESC
        `,
      this.prisma.$queryRaw<Array<{ label: string | null; count: bigint }>>`
          WITH requests AS (${requests})
          SELECT document_type AS label, COUNT(*) AS count FROM requests GROUP BY 1 ORDER BY 2 DESC
        `,
      this.prisma.$queryRaw<
        Array<{ exported_epcis: bigint; covered_population: string | null; total_epcis: bigint; total_population: string | null }>
      >`
          WITH exported AS (${exported}),
          population AS (${latestPopulation}),
          exported_epcis AS (
            SELECT DISTINCT es.epci_code
            FROM exported
            INNER JOIN epci_scenarios es ON es.scenario_id = exported.scenario_id
          )
          SELECT
            (SELECT COUNT(*) FROM exported_epcis) AS exported_epcis,
            (SELECT SUM(p.population) FROM exported_epcis ee INNER JOIN population p ON p.epci_code = ee.epci_code) AS covered_population,
            (SELECT COUNT(*) FROM epcis) AS total_epcis,
            (SELECT SUM(population) FROM population) AS total_population
        `,
      // Compteur cumulatif : les consultations ne sont pas journalisées, elles ne se bornent pas dans le temps.
      this.prisma.$queryRaw<Array<{ active_links: bigint; total_views: string | null; viewed_links: bigint }>>`
          SELECT
            COUNT(*) FILTER (WHERE sl.active) AS active_links,
            SUM(sl.view_count) AS total_views,
            COUNT(*) FILTER (WHERE sl.view_count > 0) AS viewed_links
          FROM simulation_share_links sl
          INNER JOIN simulations s ON s.id = sl.simulation_id
          WHERE s.deleted IS NULL
            AND ${ownerIsNotTeam('s.user_id')}
        `,
      // Un EPCI travaillé par plusieurs types d'acteurs signale un dialogue entre services
      // de l'État et collectivités autour des mêmes chiffres.
      this.prisma.$queryRaw<
        Array<{ epci_code: string; epci_name: string; region_name: string | null; user_types: string[]; users: bigint }>
      >`
          WITH sims AS (${simulationsCreatedIn(range)}),
          epci_actors AS (
            SELECT es.epci_code, u.id AS user_id, u.type::text AS user_type
            FROM sims
            INNER JOIN epci_scenarios es ON es.scenario_id = sims.scenario_id
            INNER JOIN users u ON u.id = sims.user_id
            WHERE u.type IS NOT NULL
          )
          SELECT
            ea.epci_code,
            ep.name AS epci_name,
            ep.region_name,
            array_agg(DISTINCT ea.user_type ORDER BY ea.user_type) AS user_types,
            COUNT(DISTINCT ea.user_id) AS users
          FROM epci_actors ea
          INNER JOIN epcis ep ON ep.code = ea.epci_code
          GROUP BY ea.epci_code, ep.name, ep.region_name
          HAVING COUNT(DISTINCT ea.user_type) >= 2
          ORDER BY COUNT(DISTINCT ea.user_type) DESC, users DESC, ep.name
        `,
      this.prisma.$queryRaw<Array<{ active_dossiers: bigint; resumed_dossiers: bigint }>>`
          WITH activity AS (
            SELECT DISTINCT
              g.id,
              (c.created_at >= g.created_at + ${LONG_TERM_USE_INTERVAL}) AS is_resumed
            FROM simulation_changes c
            INNER JOIN simulations s ON s.id = c.simulation_id
            INNER JOIN epci_groups g ON g.id = s.epci_group_id
            WHERE c.created_at >= ${from} AND c.created_at < ${toExclusive}
              AND c.action <> 'simulation.deleted'
              AND g.deleted IS NULL
              AND ${ownerIsNotTeam('g.user_id')}
          )
          SELECT
            COUNT(DISTINCT id) AS active_dossiers,
            COUNT(DISTINCT id) FILTER (WHERE is_resumed) AS resumed_dossiers
          FROM activity
        `,
      this.getTerritoryNeeds('exported'),
      this.getTerritoryNeeds('all'),
    ])

    const powerpointRequests = byNextStep.reduce((sum, row) => sum + toNumber(row.count), 0)
    const decisionRequests = byNextStep
      .filter((row) => row.label !== null && (IMPACT_DECISION_NEXT_STEPS as readonly string[]).includes(row.label))
      .reduce((sum, row) => sum + toNumber(row.count), 0)
    const coverageRow = coverage[0]

    return {
      powerpointRequests,
      byNextStep: byNextStep.map((row) => ({ label: row.label ?? NOT_SPECIFIED, count: toNumber(row.count) })),
      byExportDocumentType: byDocumentType.map((row) => ({ label: row.label ?? NOT_SPECIFIED, count: toNumber(row.count) })),
      decisionRate: percentage(decisionRequests, powerpointRequests),
      exportedEpcis: toNumber(coverageRow?.exported_epcis),
      totalEpcis: toNumber(coverageRow?.total_epcis),
      coveredPopulation: round(toNumber(coverageRow?.covered_population), 0),
      totalPopulation: round(toNumber(coverageRow?.total_population), 0),
      territoryNeeds: { exported: exportedNeeds, all: allNeeds },
      sharing: {
        activeLinks: toNumber(sharing[0]?.active_links),
        totalViews: toNumber(sharing[0]?.total_views),
        viewedLinks: toNumber(sharing[0]?.viewed_links),
      },
      sharedEpcis: {
        count: sharedEpcis.length,
        top: sharedEpcis.slice(0, 10).map((row) => ({
          epciCode: row.epci_code,
          epciName: row.epci_name,
          regionName: row.region_name,
          userTypes: row.user_types,
          users: toNumber(row.users),
        })),
      },
      longTermUse: {
        activeDossiers: toNumber(longTermUse[0]?.active_dossiers),
        resumedDossiers: toNumber(longTermUse[0]?.resumed_dossiers),
      },
    }
  }

  /**
   * Besoins en logements portés par les territoires, un EPCI comptant pour un seul scénario
   * moyen — tous scénarios depuis le lancement, sans filtre de période.
   *
   * Règle de retenue, par EPCI :
   * - s'il figure dans le scénario privilégié d'au moins une demande de PowerPoint, on retient
   *   ces scénarios privilégiés, et eux seuls ;
   * - sinon, toutes les simulations qui le couvrent.
   * Une demande (couple utilisateur, horodatage) sans scénario marqué privilégié — le marqueur
   * manque dans l'historique ancien — voit tous ses scénarios tenus pour privilégiés.
   *
   * Annualisation : la période d'un scénario est celle de sa série `housingNeeds`, qui court
   * jusqu'au pic démographique ou à l'horizon. Les termes stockés en total (remobilisations,
   * renouvellement, mal-logement retenu) sont divisés par sa durée et répartis uniformément
   * sur ses années ; les constructions neuves suivent la série du moteur telle quelle.
   *
   * Comme `NeedsCalculationService`, un EPCI dont le besoin de constructions neuves est
   * négatif ou nul n'entre pas dans le total : ses lignes sont écartées.
   */
  async getTerritoryNeeds(scope: 'exported' | 'all'): Promise<TTerritoryNeeds> {
    const retained = Prisma.sql`
      sims AS (
        SELECT s.id
        FROM simulations s
        WHERE s.deleted IS NULL
          AND ${ownerIsNotTeam('s.user_id')}
      ),
      requests AS (
        SELECT s.user_id, e.created_at, e.simulation_id, e.is_privileged
        FROM exports e
        INNER JOIN simulations s ON s.id = e.simulation_id
        INNER JOIN sims ON sims.id = s.id
        WHERE e.type = 'POWERPOINT'
      ),
      privileged AS (
        SELECT DISTINCT r.simulation_id
        FROM requests r
        WHERE r.is_privileged
          OR NOT EXISTS (
            SELECT 1 FROM requests other
            WHERE other.user_id IS NOT DISTINCT FROM r.user_id AND other.created_at = r.created_at AND other.is_privileged
          )
      ),
      results AS (
        SELECT
          sr.epci_code,
          sr.simulation_id,
          sr.flow_data_by_year -> 'housingNeeds' AS housing_needs,
          (SELECT COUNT(*) FROM jsonb_object_keys(sr.flow_data_by_year -> 'housingNeeds')) AS nb_years,
          sr.prepeak_total_stock,
          sr.total,
          sr.flow_totals,
          sr.simulation_id IN (SELECT simulation_id FROM privileged) AS is_privileged
        FROM simulation_results sr
        INNER JOIN sims ON sims.id = sr.simulation_id
        WHERE sr.total > 0
          AND jsonb_typeof(sr.flow_data_by_year -> 'housingNeeds') = 'object'
          AND sr.flow_totals IS NOT NULL
      ),
      exported_epcis AS (
        SELECT DISTINCT epci_code FROM results WHERE is_privileged
      ),
      retained AS (
        SELECT
          r.*,
          (r.flow_totals ->> 'demographicEvolution')::float AS demographic,
          (r.flow_totals ->> 'renewalNeeds')::float AS renewal,
          (r.flow_totals ->> 'shortTermVacantAccomodation')::float AS fluidity,
          (r.flow_totals ->> 'longTermVacantAccomodation')::float AS long_term_vacancy,
          (r.flow_totals ->> 'secondaryResidenceAccomodationEvolution')::float AS secondary_residences
        FROM results r
        WHERE r.nb_years > 0
          AND CASE
            WHEN r.epci_code IN (SELECT epci_code FROM exported_epcis) THEN r.is_privileged
            ELSE ${scope === 'all'}
          END
      )
    `

    const [byYear, perEpci, counts] = await Promise.all([
      this.prisma.$queryRaw<
        Array<{
          year: number
          territories: bigint
          new_construction: number
          vacancy_remobilised: number
          secondary_remobilised: number
          renewal: number
          bad_housing: number
        }>
      >`
        WITH ${retained},
        epci_years AS (
          -- Moyenne, pour chaque année, des scénarios de l'EPCI qui couvrent cette année.
          SELECT
            r.epci_code,
            y.key::int AS year,
            AVG(y.value::float) AS new_construction,
            AVG(GREATEST(0, -r.long_term_vacancy) / r.nb_years) AS vacancy_remobilised,
            AVG(GREATEST(0, -r.secondary_residences) / r.nb_years) AS secondary_remobilised,
            AVG(r.renewal / r.nb_years) AS renewal,
            AVG(r.prepeak_total_stock::float / r.nb_years) AS bad_housing
          FROM retained r
          CROSS JOIN LATERAL jsonb_each_text(r.housing_needs) AS y
          GROUP BY r.epci_code, y.key
        )
        SELECT
          year,
          COUNT(*) AS territories,
          SUM(new_construction) AS new_construction,
          SUM(vacancy_remobilised) AS vacancy_remobilised,
          SUM(secondary_remobilised) AS secondary_remobilised,
          SUM(renewal) AS renewal,
          SUM(bad_housing) AS bad_housing
        FROM epci_years
        GROUP BY year
        ORDER BY year
      `,
      this.prisma.$queryRaw<
        Array<{
          region_name: string | null
          new_construction: number
          demographic: number
          bad_housing: number
          renewal: number
          fluidity: number
          long_term_vacancy: number
          secondary_residences: number
        }>
      >`
        WITH ${retained}
        SELECT
          ep.region_name,
          AVG(r.total::float / r.nb_years) AS new_construction,
          AVG(r.demographic / r.nb_years) AS demographic,
          AVG(r.prepeak_total_stock::float / r.nb_years) AS bad_housing,
          AVG(r.renewal / r.nb_years) AS renewal,
          AVG(r.fluidity / r.nb_years) AS fluidity,
          AVG(r.long_term_vacancy / r.nb_years) AS long_term_vacancy,
          AVG(r.secondary_residences / r.nb_years) AS secondary_residences
        FROM retained r
        INNER JOIN epcis ep ON ep.code = r.epci_code
        GROUP BY r.epci_code, ep.region_name
      `,
      this.prisma.$queryRaw<Array<{ territories: bigint; scenarios: bigint }>>`
        WITH ${retained}
        SELECT COUNT(DISTINCT epci_code) AS territories, COUNT(DISTINCT simulation_id) AS scenarios
        FROM retained
      `,
    ])

    const sum = (key: Exclude<keyof (typeof perEpci)[number], 'region_name'>) =>
      perEpci.reduce((total, row) => total + toNumber(row[key]), 0)

    const regions = new Map<string, { territories: number; newConstructionPerYear: number }>()
    for (const row of perEpci) {
      const label = row.region_name ?? NOT_SPECIFIED
      const entry = regions.get(label) ?? { territories: 0, newConstructionPerYear: 0 }
      entry.territories += 1
      entry.newConstructionPerYear += toNumber(row.new_construction)
      regions.set(label, entry)
    }

    const componentColumns = {
      demographic: 'demographic',
      badHousing: 'bad_housing',
      renewal: 'renewal',
      fluidity: 'fluidity',
      longTermVacancy: 'long_term_vacancy',
      secondaryResidences: 'secondary_residences',
    } as const satisfies Record<(typeof NEED_COMPONENTS)[number], string>

    return {
      territories: toNumber(counts[0]?.territories),
      scenarios: toNumber(counts[0]?.scenarios),
      byYear: byYear.map((row) => ({
        year: toNumber(row.year),
        territories: toNumber(row.territories),
        newConstruction: round(toNumber(row.new_construction), 0),
        vacancyRemobilised: round(toNumber(row.vacancy_remobilised), 0),
        secondaryRemobilised: round(toNumber(row.secondary_remobilised), 0),
        renewal: round(toNumber(row.renewal), 0),
        badHousing: round(toNumber(row.bad_housing), 0),
      })),
      breakdown: NEED_COMPONENTS.map((component) => ({ component, perYear: round(sum(componentColumns[component]), 0) })),
      byRegion: [...regions.entries()]
        .map(([label, entry]) => ({
          label,
          territories: entry.territories,
          newConstructionPerYear: round(entry.newConstructionPerYear, 0),
        }))
        .sort((a, b) => b.newConstructionPerYear - a.newConstructionPerYear),
    }
  }

  /**
   * Avis déposés sur la période. Un utilisateur n'a qu'un avis, mis à jour s'il répond de
   * nouveau : `updated_at` date donc la dernière réponse.
   */
  async getPerceivedUtility({ from, toExclusive }: DateRange): Promise<TImpactStatistics['perceivedUtility']> {
    const [rows, snoozed] = await Promise.all([
      this.prisma.$queryRaw<Array<{ rating: number | null; count: bigint; with_comment: bigint }>>`
        SELECT
          f.rating,
          COUNT(*) AS count,
          COUNT(*) FILTER (WHERE NULLIF(TRIM(f.comment), '') IS NOT NULL) AS with_comment
        FROM user_feedbacks f
        WHERE f.status = 'SUBMITTED'
          AND f.updated_at >= ${from} AND f.updated_at < ${toExclusive}
          AND ${ownerIsNotTeam('f.user_id')}
        GROUP BY f.rating
      `,
      this.prisma.$queryRaw<Array<{ count: bigint }>>`
        SELECT COUNT(*) AS count
        FROM user_feedbacks f
        WHERE f.status = 'SNOOZED'
          AND f.updated_at >= ${from} AND f.updated_at < ${toExclusive}
          AND ${ownerIsNotTeam('f.user_id')}
      `,
    ])

    const rated = rows.filter((row) => row.rating !== null)
    const ratedCount = rated.reduce((sum, row) => sum + toNumber(row.count), 0)
    const ratingSum = rated.reduce((sum, row) => sum + toNumber(row.rating) * toNumber(row.count), 0)

    return {
      responses: rows.reduce((sum, row) => sum + toNumber(row.count), 0),
      averageRating: ratedCount === 0 ? null : round(ratingSum / ratedCount, 1),
      distribution: [1, 2, 3, 4, 5].map((rating) => ({
        rating,
        count: toNumber(rated.find((row) => row.rating === rating)?.count),
      })),
      withComment: rows.reduce((sum, row) => sum + toNumber(row.with_comment), 0),
      snoozed: toNumber(snoozed[0]?.count),
    }
  }
}

function nullableRound(value: unknown, decimals: number): number | null {
  return value === null || value === undefined ? null : round(toNumber(value), decimals)
}
