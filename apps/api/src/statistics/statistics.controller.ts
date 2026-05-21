import { Controller, ForbiddenException, Get, Header, Query, Res } from '@nestjs/common'
import dayjs from 'dayjs'
import { Response } from 'express'
import * as Papa from 'papaparse'
import { User } from '~/common/decorators/authenticated-user'
import { AccessControl } from '~/common/decorators/control-access.decorator'
import { Role } from '~/generated/prisma/enums'
import { TUser } from '~/schemas/users/user'
import { StatisticsService } from './statistics.service'

@Controller('statistics')
export class StatisticsController {
  constructor(private readonly statisticsService: StatisticsService) {}

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

  @AccessControl({ roles: [Role.ADMIN] })
  @Get('/users')
  @Header('Content-Type', 'text/csv')
  async getUserStats(@Res() res: Response) {
    const data = await this.statisticsService.getUserStats()

    const dateStr = dayjs().format('DD-MM-YYYY')
    const filename = `export-utilisateur-${dateStr}.csv`

    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`)

    const csvData = Papa.unparse(data, {
      header: true,
      delimiter: ';',
    })

    res.send(csvData)
  }

  @AccessControl({ roles: [Role.ADMIN] })
  @Get('/template')
  @Header('Content-Type', 'text/csv')
  async getTemplateStats(@Res() res: Response) {
    const data = await this.statisticsService.getTemplateStatistics()

    const dateStr = dayjs().format('DD-MM-YYYY')
    const filename = `export-template-${dateStr}.csv`

    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`)

    const csvData = Papa.unparse(data, {
      header: true,
      delimiter: ';',
    })

    res.send(csvData)
  }

  @AccessControl({ roles: [Role.ADMIN] })
  @Get('/results')
  @Header('Content-Type', 'text/csv')
  async getResultsStats(@Res() res: Response) {
    const data = await this.statisticsService.getResultsStats()

    const dateStr = dayjs().format('DD-MM-YYYY')
    const filename = `export-resultats-${dateStr}.csv`

    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`)

    const csvData = Papa.unparse(data, {
      header: true,
      delimiter: ';',
    })

    res.send(csvData)
  }

  @AccessControl({ roles: [Role.ADMIN] })
  @Get('/simulations')
  @Header('Content-Type', 'text/csv')
  async getSimulationsStats(@Res() res: Response) {
    const data = await this.statisticsService.getSimulationsStats()

    const dateStr = dayjs().format('DD-MM-YYYY')
    const filename = `export-scenarios-${dateStr}.csv`

    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`)

    const csvData = Papa.unparse(data, {
      header: true,
      delimiter: ';',
    })

    res.send(csvData)
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
  @Header('Content-Type', 'text/csv')
  async getPilotageCsv(
    @User() user: TUser,
    @Res() res: Response,
    @Query('region') region?: string,
    @Query('department') department?: string,
  ) {
    this.assertPilotageAccess(user)
    const data = await this.statisticsService.getPilotageCsvData(this.resolveRegion(user, region), department)

    const dateStr = dayjs().format('DD-MM-YYYY')
    const filename = `export-pilotage-${dateStr}.csv`

    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`)

    const csvData = Papa.unparse(data, {
      header: true,
      delimiter: ';',
    })

    res.send(csvData)
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
