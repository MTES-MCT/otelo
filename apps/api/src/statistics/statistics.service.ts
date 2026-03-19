import { Injectable } from '@nestjs/common'
import { TTemplateStatisticsRow } from '@shared'
import { PrismaService } from '~/db/prisma.service'

@Injectable()
export class StatisticsService {
  constructor(private prisma: PrismaService) {}

  async getTotalScenariosCount(): Promise<number> {
    return this.prisma.scenario.count()
  }

  async getAverageScenariosPerUser(): Promise<number> {
    const totalScenarios = await this.prisma.scenario.count()
    const totalUsers = await this.prisma.user.count()

    if (totalUsers === 0) return 0

    return Math.round((totalScenarios / totalUsers) * 100) / 100
  }

  async getActiveEpcisCount(): Promise<number> {
    const sixMonthsAgo = new Date()
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)

    const activeEpcis = await this.prisma.epci.findMany({
      where: {
        simulations: {
          some: {
            scenario: {
              createdAt: {
                gte: sixMonthsAgo,
              },
            },
          },
        },
      },
      select: {
        code: true,
      },
    })

    return activeEpcis.length
  }
  async getExportedScenariosStatistics(): Promise<{
    totalHousingNeedsSum: number
    totalStockSum: number
    totalVacantSum: number
  }> {
    // Get all simulation results for exported simulations
    const exportedResults = await this.prisma.simulationResults.findMany({
      where: {
        simulation: {
          exports: { some: { type: 'POWERPOINT' } },
        },
      },
      select: {
        epciCode: true,
        totalFlux: true,
        totalStock: true,
        vacantAccomodation: true,
      },
    })

    if (exportedResults.length === 0) {
      return {
        totalHousingNeedsSum: 0,
        totalStockSum: 0,
        totalVacantSum: 0,
      }
    }

    // Group results by EPCI code
    const resultsByEpci = exportedResults.reduce(
      (acc, result) => {
        if (!acc[result.epciCode]) {
          acc[result.epciCode] = []
        }
        acc[result.epciCode].push(result)
        return acc
      },
      {} as Record<string, typeof exportedResults>,
    )

    // Calculate averages for each EPCI
    let totalFluxSum = 0
    let totalStockSum = 0
    let totalVacantSum = 0

    for (const epciCode in resultsByEpci) {
      const epciResults = resultsByEpci[epciCode]

      // Calculate averages for this EPCI
      const avgFlux = epciResults.reduce((sum, r) => sum + r.totalFlux, 0) / epciResults.length
      const avgStock = epciResults.reduce((sum, r) => sum + r.totalStock, 0) / epciResults.length
      const avgVacant = epciResults.reduce((sum, r) => sum + r.vacantAccomodation, 0) / epciResults.length

      // Add to totals
      totalFluxSum += avgFlux
      totalStockSum += avgStock
      totalVacantSum += avgVacant
    }

    const results = {
      totalHousingNeedsSum: Math.round(totalFluxSum + totalStockSum),
      totalStockSum: Math.round(totalStockSum),
      totalVacantSum: Math.round(totalVacantSum),
    }

    return results
  }

  async getUsersWithExportedScenariosCount() {
    const threeMonthsAgo = new Date()
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3)

    const usersWithRecentSimulations = await this.prisma.user.findMany({
      where: {
        simulations: {
          some: {
            createdAt: {
              gte: threeMonthsAgo,
            },
          },
        },
      },
      select: {
        id: true,
      },
    })

    const usersWithExports = await this.prisma.user.findMany({
      where: {
        simulations: {
          some: {
            exports: {
              some: {},
            },
          },
        },
      },
      select: {
        id: true,
      },
    })

    const uniqueUserIds = new Set([...usersWithRecentSimulations.map((user) => user.id), ...usersWithExports.map((user) => user.id)])

    const powerpointCount = await this.prisma.export.count({
      where: {
        type: 'POWERPOINT',
        isPrivileged: true,
      },
    })

    const excelCount = await this.prisma.export.count({
      where: {
        type: 'EXCEL',
      },
    })
    return { total: uniqueUserIds.size, powerpoint: powerpointCount, excel: excelCount }
  }

  async getUserStats(): Promise<
    Array<{
      nom: string
      prenom: string
      email: string
      derniere_activite: Date | null
      derniere_simulation: Date | null
      liste_epcis: string | null
      a_export_excel: boolean
      a_export_powerpoint: boolean
      epcis_export_resultat: string | null
      epcis_export_powerpoint: string | null
      type_utilisateur: string
    }>
  > {
    return this.prisma.$queryRaw`
      WITH user_activity AS (
        SELECT
          u.id,
          u.firstname,
          u.lastname,
          u.email,
          u.type,
          u.last_login_at,
          -- Dernière date d'activité (max entre last_login, création ou modification de simulation)
          GREATEST(
            u.last_login_at,
            MAX(s.created_at),
            MAX(s.updated_at)
          ) AS derniere_activite,
          -- Date de dernière simulation
          GREATEST(
            MAX(s.created_at),
            MAX(s.updated_at)
          ) AS derniere_simulation
        FROM users u
        LEFT JOIN simulations s ON u.id = s.user_id
        GROUP BY u.id, u.firstname, u.lastname, u.email, u.type, u.last_login_at
      ),
      user_epcis AS (
        SELECT
          u.id AS user_id,
          STRING_AGG(DISTINCT e.code, ', ' ORDER BY e.code) AS liste_epcis
        FROM users u
        LEFT JOIN simulations s ON u.id = s.user_id
        LEFT JOIN scenarios sc ON s.scenario_id = sc.id
        LEFT JOIN epci_scenarios es ON sc.id = es.scenario_id
        LEFT JOIN epcis e ON es.epci_code = e.code
        GROUP BY u.id
      ),
      user_exports AS (
        SELECT
          u.id AS user_id,
          CASE WHEN COUNT(CASE WHEN ex.type = 'EXCEL' THEN 1 END) > 0 THEN true ELSE false END AS a_export_excel,
          CASE WHEN COUNT(CASE WHEN ex.type = 'POWERPOINT' THEN 1 END) > 0 THEN true ELSE false END AS a_export_powerpoint
        FROM users u
        LEFT JOIN simulations s ON u.id = s.user_id
        LEFT JOIN exports ex ON s.id = ex.simulation_id
        GROUP BY u.id
      ),
      user_export_resultat_epcis AS (
        SELECT
          u.id AS user_id,
          STRING_AGG(DISTINCT e.code, ', ' ORDER BY e.code) AS epcis_export_resultat
        FROM users u
        LEFT JOIN simulations s ON u.id = s.user_id
        LEFT JOIN exports ex ON s.id = ex.simulation_id AND ex.type = 'EXCEL'
        LEFT JOIN scenarios sc ON s.scenario_id = sc.id
        LEFT JOIN epci_scenarios es ON sc.id = es.scenario_id
        LEFT JOIN epcis e ON es.epci_code = e.code
        WHERE ex.id IS NOT NULL
        GROUP BY u.id
      ),
      user_export_powerpoint_epcis AS (
        SELECT
          u.id AS user_id,
          STRING_AGG(DISTINCT e.code, ', ' ORDER BY e.code) AS epcis_export_powerpoint
        FROM users u
        LEFT JOIN simulations s ON u.id = s.user_id
        LEFT JOIN exports ex ON s.id = ex.simulation_id AND ex.type = 'POWERPOINT'
        LEFT JOIN scenarios sc ON s.scenario_id = sc.id
        LEFT JOIN epci_scenarios es ON sc.id = es.scenario_id
        LEFT JOIN epcis e ON es.epci_code = e.code
        WHERE ex.id IS NOT NULL
        GROUP BY u.id
      )
      SELECT
        ua.firstname AS nom,
        ua.lastname AS prenom,
        ua.email,
        ua.derniere_activite,
        ua.derniere_simulation,
        COALESCE(ue.liste_epcis, '') AS liste_epcis,
        uex.a_export_excel,
        uex.a_export_powerpoint,
        COALESCE(uer.epcis_export_resultat, '') AS epcis_export_resultat,
        COALESCE(uep.epcis_export_powerpoint, '') AS epcis_export_powerpoint,
        ua.type AS type_utilisateur
      FROM user_activity ua
      LEFT JOIN user_epcis ue ON ua.id = ue.user_id
      LEFT JOIN user_exports uex ON ua.id = uex.user_id
      LEFT JOIN user_export_resultat_epcis uer ON ua.id = uer.user_id
      LEFT JOIN user_export_powerpoint_epcis uep ON ua.id = uep.user_id
      ORDER BY ua.derniere_activite DESC;
    `
  }

  async getTemplateStatistics(): Promise<TTemplateStatisticsRow[]> {
    return this.prisma.$queryRaw<TTemplateStatisticsRow[]>`
      WITH user_simulations AS (
    SELECT
      s.user_id,
      MAX(GREATEST(s.created_at, s.updated_at)) AS last_estimation_at
    FROM simulations s
    WHERE s.deleted IS NULL
    GROUP BY s.user_id
  ),
  user_epcis_estimes AS (
    SELECT
      s.user_id,
      STRING_AGG(DISTINCT es.epci_code, ', ' ORDER BY es.epci_code) AS epcis_codes_estimes
    FROM simulations s
    JOIN scenarios sc ON sc.id = s.scenario_id
    JOIN epci_scenarios es ON es.scenario_id = sc.id
    WHERE s.deleted IS NULL
    GROUP BY s.user_id
  ),
  user_exports AS (
    SELECT
      s.user_id,
      MAX(ex.created_at) FILTER (WHERE ex.type = 'EXCEL') AS last_excel_export_at,
      MAX(ex.created_at) FILTER (WHERE ex.type = 'POWERPOINT') AS last_ppt_export_at
    FROM simulations s
    JOIN exports ex ON ex.simulation_id = s.id
    WHERE s.deleted IS NULL
    GROUP BY s.user_id
  ),
  user_exports_epcis AS (
    SELECT
      s.user_id,
      STRING_AGG(DISTINCT es.epci_code, ', ' ORDER BY es.epci_code)
        FILTER (WHERE ex.type = 'EXCEL') AS epci_export_excel,
      STRING_AGG(DISTINCT es.epci_code, ', ' ORDER BY es.epci_code)
        FILTER (WHERE ex.type = 'POWERPOINT') AS epci_export_ppt
    FROM simulations s
    JOIN exports ex ON ex.simulation_id = s.id
    JOIN scenarios sc ON sc.id = s.scenario_id
    JOIN epci_scenarios es ON es.scenario_id = sc.id
    WHERE s.deleted IS NULL
    GROUP BY s.user_id
  )
  SELECT
    u.firstname AS "Prénom",
    u.lastname AS "Nom",
    u.email AS "Email",
    TO_CHAR(u.created_at, 'DD/MM/YYYY') AS "Date de création compte Otelo",
    TO_CHAR(us.last_estimation_at, 'DD/MM/YYYY') AS "Date derniere estimation",
    COALESCE(uee.epcis_codes_estimes, '') AS "EPCIs Code estimés",
    TO_CHAR(ux.last_excel_export_at, 'DD/MM/YYYY') AS "Date dernier Export Résultats Excel",
    COALESCE(uxe.epci_export_excel, '') AS "EPCI Export Résultats Excel",
    TO_CHAR(ux.last_ppt_export_at, 'DD/MM/YYYY') AS "Date dernier Export PPT",
    COALESCE(uxe.epci_export_ppt, '') AS "EPCI Export PPT"
  FROM users u
  LEFT JOIN user_simulations us ON us.user_id = u.id
  LEFT JOIN user_epcis_estimes uee ON uee.user_id = u.id
  LEFT JOIN user_exports ux ON ux.user_id = u.id
  LEFT JOIN user_exports_epcis uxe ON uxe.user_id = u.id
  ORDER BY u.lastname, u.firstname;
    `
  }

  async getResultsStats() {
    const results = await this.prisma.simulationResults.findMany({
      include: {
        simulation: {
          select: { scenario: { select: { projection: true } } },
        },
      },
    })

    return results.map((r) => {
      const flowData = r.flowDataByYear as Record<string, unknown> | null
      const peakYear = flowData?.peakYear ?? null

      return {
        id: r.id,
        epci_code: r.epciCode,
        simulation_id: r.simulationId,
        horizon_projection: r.simulation.scenario.projection,
        peak_year: peakYear,
        totalFlux: r.totalFlux,
        totalStock: r.totalStock,
        vacantAccomodation: r.vacantAccomodation,
        bad_quality: r.badQuality ? JSON.stringify(r.badQuality) : null,
        calculated_at: r.calculatedAt,
        financial_inadequation: r.financialInadequation ? JSON.stringify(r.financialInadequation) : null,
        flow_data_by_year: r.flowDataByYear ? JSON.stringify(r.flowDataByYear) : null,
        flow_totals: r.flowTotals ? JSON.stringify(r.flowTotals) : null,
        hosted: r.hosted ? JSON.stringify(r.hosted) : null,
        no_accomodation: r.noAccomodation ? JSON.stringify(r.noAccomodation) : null,
        physical_inadequation: r.physicalInadequation ? JSON.stringify(r.physicalInadequation) : null,
        postpeak_total_stock: r.postpeakTotalStock,
        prepeak_total_stock: r.prepeakTotalStock,
        secondary_accommodation: r.secondaryAccommodation,
        sitadel_data: r.sitadelData ? JSON.stringify(r.sitadelData) : null,
        total: r.total,
      }
    })
  }

  async getSimulationsStats(): Promise<
    Array<{
      nom_utilisateur: string
      prenom_utilisateur: string
      email: string
      simulation_id: string
      nom_simulation: string
      derniere_activite_simulation: Date | null
      liste_epcis: string | null
      a_export_excel: boolean
      a_export_powerpoint: boolean
      epci_base: string | null
      nb_simulations_pour_ce_base_epci: number
    }>
  > {
    return this.prisma.$queryRaw`
     WITH simulation_epcis AS (
      SELECT
        s.id AS simulation_id,
        STRING_AGG(DISTINCT e.code, ', ' ORDER BY e.code) AS liste_epcis
      FROM simulations s
      LEFT JOIN scenarios sc ON s.scenario_id = sc.id
      LEFT JOIN epci_scenarios es ON sc.id = es.scenario_id
      LEFT JOIN epcis e ON es.epci_code = e.code
      GROUP BY s.id
    ),
    simulation_exports AS (
      SELECT
        s.id AS simulation_id,
        CASE WHEN COUNT(CASE WHEN ex.type = 'EXCEL' THEN 1 END) > 0 THEN true ELSE false END AS a_export_excel,
        CASE WHEN COUNT(CASE WHEN ex.type = 'POWERPOINT' THEN 1 END) > 0 THEN true ELSE false END AS a_export_powerpoint
      FROM simulations s
      LEFT JOIN exports ex ON s.id = ex.simulation_id
      GROUP BY s.id
    ),
    base_epci_per_simulation AS (
      SELECT
        s.id AS simulation_id,
        e.code AS base_epci_code
      FROM simulations s
      LEFT JOIN scenarios sc ON s.scenario_id = sc.id
      LEFT JOIN epci_scenarios es ON sc.id = es.scenario_id AND es."baseEpci" = true
      LEFT JOIN epcis e ON es.epci_code = e.code
    ),
    simulation_count_per_base_epci AS (
      SELECT
        s.user_id,
        beps.base_epci_code,
        COUNT(*) AS nb_simulations_base_epci
      FROM simulations s
      LEFT JOIN base_epci_per_simulation beps ON s.id = beps.simulation_id
      WHERE beps.base_epci_code IS NOT NULL
      GROUP BY s.user_id, beps.base_epci_code
    )
    SELECT
      u.firstname AS nom_utilisateur,
      u.lastname AS prenom_utilisateur,
      u.email,
      s.id AS simulation_id,
      s.name AS nom_simulation,
      GREATEST(s.created_at, s.updated_at) AS derniere_activite_simulation,
      COALESCE(se.liste_epcis, '') AS liste_epcis,
      sex.a_export_excel,
      sex.a_export_powerpoint,
      beps.base_epci_code AS epci_base,
      COALESCE(scpbe.nb_simulations_base_epci, 0) AS nb_simulations_pour_ce_base_epci
    FROM users u
    INNER JOIN simulations s ON u.id = s.user_id
    LEFT JOIN simulation_epcis se ON s.id = se.simulation_id
    LEFT JOIN simulation_exports sex ON s.id = sex.simulation_id
    LEFT JOIN base_epci_per_simulation beps ON s.id = beps.simulation_id
    LEFT JOIN simulation_count_per_base_epci scpbe ON u.id = scpbe.user_id AND beps.base_epci_code = scpbe.base_epci_code
    ORDER BY u.lastname, u.firstname, s.created_at DESC;
    `
  }
}
