import { Controller, ForbiddenException, Get, Query, Res } from '@nestjs/common'
import dayjs from 'dayjs'
import { Response } from 'express'
import { User } from '~/common/decorators/authenticated-user'
import { AccessControl } from '~/common/decorators/control-access.decorator'
import { sendCsv } from '~/common/utils/csv'
import { resolveDateRange } from '~/common/utils/date-range'
import { Role } from '~/generated/prisma/enums'
import { TUser } from '~/schemas/users/user'
import { AudienceStatisticsService } from './audience-statistics.service'
import { StatisticsService } from './statistics.service'

@Controller('statistics')
export class StatisticsController {
  constructor(
    private readonly statisticsService: StatisticsService,
    private readonly audienceStatisticsService: AudienceStatisticsService,
  ) {}

  /** Compteurs transverses de la coquille d'administration (pastilles + vue d'ensemble). */
  @AccessControl({ roles: [Role.ADMIN] })
  @Get('/overview')
  async getAdminOverview() {
    return this.statisticsService.getAdminOverview()
  }

  /**
   * Usage mesuré en base : connexions, temps connecté, partage.
   * Complémentaire de Matomo, qui mesure le comportement mais ne peut pas fournir
   * de chiffre officiel (bloqueurs de traqueurs, pas de rattachement à un organisme).
   */
  @AccessControl({ roles: [Role.ADMIN] })
  @Get('/audience')
  async getAudienceStatistics(@Query('from') from?: string, @Query('to') to?: string) {
    return this.audienceStatisticsService.getAudienceStatistics(resolveDateRange(from, to))
  }

  /** Journal des modifications de simulations, paginé. */
  @AccessControl({ roles: [Role.ADMIN] })
  @Get('/simulation-changes')
  async getSimulationChanges(
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('page') page?: string,
    @Query('action') action?: string,
    @Query('search') search?: string,
  ) {
    return this.audienceStatisticsService.getSimulationChanges(resolveDateRange(from, to), {
      action: action || undefined,
      page: Math.max(1, Number.parseInt(page ?? '1', 10) || 1),
      pageSize: 25,
      search: search || undefined,
    })
  }

  /** Entonnoir d'activation et rétention par cohorte d'inscription. */
  @AccessControl({ roles: [Role.ADMIN] })
  @Get('/activation')
  async getActivationStatistics(@Query('from') from?: string, @Query('to') to?: string) {
    return this.audienceStatisticsService.getActivationStatistics(resolveDateRange(from, to))
  }

  @AccessControl({ roles: [Role.ADMIN] })
  @Get()
  async getStatistics() {
    const [totalScenarios, averageScenariosPerUser, activeEpcisCount, exportedStats, usersWithExportedScenarios] = await Promise.all([
      this.statisticsService.getTotalScenariosCount(),
      this.statisticsService.getAverageScenariosPerUser(),
      this.statisticsService.getActiveEpcisCount(),
      this.statisticsService.getExportedScenariosStatistics(),
      this.statisticsService.getUsersWithExportedScenariosCount(),
    ])

    return {
      totalScenarios,
      averageScenariosPerUser,
      activeEpcisCount,
      totalHousingNeedsSum: exportedStats.totalHousingNeedsSum,
      totalStockSum: exportedStats.totalStockSum,
      totalVacantSum: exportedStats.totalVacantSum,
      usersWithExportedScenarios,
    }
  }

  /*
   * Les quatre exports ci-dessous portent sur l'historique complet : leurs requêtes
   * agrègent par utilisateur ou par scénario sur plusieurs CTE, sans axe temporel
   * exploitable. Ils passent par `sendCsv` pour le BOM UTF-8 (sans lui, Excel casse
   * les accents), mais n'acceptent pas de période — contrairement aux jeux de données
   * de `statistics/exports/:dataset`.
   */

  @AccessControl({ roles: [Role.ADMIN] })
  @Get('/users')
  async getUserStats(@Res() res: Response) {
    const data = await this.statisticsService.getUserStats()

    sendCsv(res, data, `export-utilisateur-${dayjs().format('DD-MM-YYYY')}.csv`)
  }

  @AccessControl({ roles: [Role.ADMIN] })
  @Get('/template')
  async getTemplateStats(@Res() res: Response) {
    const data = await this.statisticsService.getTemplateStatistics()

    sendCsv(res, data, `export-template-${dayjs().format('DD-MM-YYYY')}.csv`)
  }

  @AccessControl({ roles: [Role.ADMIN] })
  @Get('/results')
  async getResultsStats(@Res() res: Response) {
    const data = await this.statisticsService.getResultsStats()

    sendCsv(res, data, `export-resultats-${dayjs().format('DD-MM-YYYY')}.csv`)
  }

  @AccessControl({ roles: [Role.ADMIN] })
  @Get('/simulations')
  async getSimulationsStats(@Res() res: Response) {
    const data = await this.statisticsService.getSimulationsStats()

    sendCsv(res, data, `export-scenarios-${dayjs().format('DD-MM-YYYY')}.csv`)
  }

  @Get('/pilotage')
  async getPilotageData(@User() user: TUser, @Query('region') region?: string, @Query('department') department?: string) {
    this.assertPilotageAccess(user)
    return this.statisticsService.getPilotageData(this.resolveRegion(user, region), department)
  }

  @Get('/pilotage/epcis-coverage')
  async getEpcisCoverage(
    @User() user: TUser,
    @Query('region') region?: string,
    @Query('department') department?: string,
    @Query('typology') typology?: string,
  ) {
    this.assertPilotageAccess(user)
    return this.statisticsService.getEpcisCoverage(this.resolveRegion(user, region), department, typology)
  }

  @AccessControl({ roles: [Role.ADMIN] })
  @Get('/pilotage/scenarios-list')
  async getPilotageScenariosList(
    @Query('userId') userId?: string,
    @Query('territoire') territoire?: string,
    @Query('typology') typology?: string,
  ) {
    return this.statisticsService.getPilotageScenariosList(userId, territoire, typology)
  }

  @Get('/pilotage/export')
  async getPilotageCsv(
    @User() user: TUser,
    @Res() res: Response,
    @Query('region') region?: string,
    @Query('department') department?: string,
  ) {
    this.assertPilotageAccess(user)
    const data = await this.statisticsService.getPilotageCsvData(this.resolveRegion(user, region), department)

    sendCsv(res, data, `export-pilotage-${dayjs().format('DD-MM-YYYY')}.csv`)
  }

  private assertPilotageAccess(user: TUser): void {
    if (user.role !== Role.ADMIN && user.type !== 'DREAL') {
      throw new ForbiddenException('Accès réservé aux administrateurs et aux DREAL')
    }
  }

  private resolveRegion(user: TUser, requestedRegion?: string): string | undefined {
    if (user.type === 'DREAL') {
      return user.region ?? undefined
    }
    return requestedRegion
  }
}
