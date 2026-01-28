import { Controller, Get, Param } from '@nestjs/common'
import { AccessControl } from '~/common/decorators/control-access.decorator'
import { Prisma, Role } from '~/generated/prisma/client'
import { ResultsService } from '~/results/results.service'

@Controller('simulations')
export class ResultsController {
  constructor(private readonly resultsService: ResultsService) {}

  @AccessControl({
    entity: Prisma.ModelName.Simulation,
    paramName: 'simulationId',
    roles: [Role.USER, Role.ADMIN],
  })
  @Get(':simulationId/results')
  async getResults(@Param('simulationId') simulationId: string) {
    return this.resultsService.getGroupedResults(simulationId)
  }
}
