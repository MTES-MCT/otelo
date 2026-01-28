import { Controller, Get, HttpCode, HttpStatus, Param, Res } from '@nestjs/common'
import { Response } from 'express'
import { AccessControl } from '~/common/decorators/control-access.decorator'
import { ExportExcelService } from '~/export-excel/export-excel.service'
import { Prisma, Role } from '~/generated/prisma/client'

@Controller('export-excel')
export class ExportExcelController {
  constructor(private readonly exportExcelService: ExportExcelService) {}

  @AccessControl({
    entity: Prisma.ModelName.Simulation,
    paramName: 'simulationId',
    roles: [Role.ADMIN, Role.USER],
  })
  @Get(':simulationId')
  @HttpCode(HttpStatus.OK)
  async exportScenario(@Param('simulationId') simulationId: string, @Res() res: Response) {
    const { workbook, simulation } = await this.exportExcelService.exportScenario(simulationId)
    await this.exportExcelService.markAsExported(simulationId)
    const buffer = await workbook.xlsx.writeBuffer()

    const mainEpciCode = simulation.scenario.epciScenarios.find((e) => e.baseEpci)?.epciCode
    const filename = `Votre scenario Otelo - ${simulation.epcis.find((e) => e.code === mainEpciCode)?.name} - ${simulation.name}.xlsx`

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
    res.setHeader('Content-Disposition', `attachment; filename=${filename}`)
    res.send(buffer)
  }
}
