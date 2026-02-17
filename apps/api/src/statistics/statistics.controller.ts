import { Controller, Get, Header, Res } from '@nestjs/common'
import dayjs from 'dayjs'
import { Response } from 'express'
import * as Papa from 'papaparse'
import { AccessControl } from '~/common/decorators/control-access.decorator'
import { Role } from '~/generated/prisma/enums'
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
}
