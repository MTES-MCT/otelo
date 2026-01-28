import { Controller, Get, HttpCode, HttpStatus } from '@nestjs/common'
import { AccessControl } from '~/common/decorators/control-access.decorator'
import { CronService } from '~/cron/cron.service'
import { Role } from '~/generated/prisma/enums'

@Controller('cron')
export class CronController {
  constructor(private readonly cronService: CronService) {}

  @Get('synchro')
  @AccessControl({
    roles: [Role.ADMIN],
  })
  @HttpCode(HttpStatus.OK)
  synchroDS() {
    return this.cronService.handleUserAccessUpdate()
  }
}
