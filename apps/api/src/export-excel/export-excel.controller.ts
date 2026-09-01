import { Controller, Get, HttpCode, HttpStatus, Param, Res } from '@nestjs/common'
import { Throttle } from '@nestjs/throttler'
import { Response } from 'express'
import { AccessControl } from '~/common/decorators/control-access.decorator'
import { buildContentDisposition } from '~/common/utils/content-disposition'
import { ExportExcelService } from '~/export-excel/export-excel.service'
import { buildExportFilename } from '~/export-excel/helpers/export-filename'
import { Prisma, Role } from '~/generated/prisma/client'

@Controller('export-excel')
export class ExportExcelController {
  constructor(private readonly exportExcelService: ExportExcelService) {}

  @AccessControl({
    entity: Prisma.ModelName.Simulation,
    paramName: 'simulationId',
    roles: [Role.ADMIN, Role.USER],
  })
  @Throttle({ default: { ttl: 60_000, limit: 10 } })
  @Get(':simulationId')
  @HttpCode(HttpStatus.OK)
  async exportScenario(@Param('simulationId') simulationId: string, @Res() res: Response) {
    const { workbook, simulation } = await this.exportExcelService.exportScenario(simulationId)
    await this.exportExcelService.markAsExported(simulationId)
    const buffer = await workbook.xlsx.writeBuffer()

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
    res.setHeader('Content-Disposition', buildContentDisposition(buildExportFilename(simulation)))
    res.send(buffer)
  }
}
