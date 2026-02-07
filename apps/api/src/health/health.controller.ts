import { Controller, Get } from '@nestjs/common'
import { AllowAnonymous } from '@thallesp/nestjs-better-auth'

@Controller('health')
export class HealthController {
  @AllowAnonymous()
  @Get()
  health() {
    return 'API is up!'
  }
}
