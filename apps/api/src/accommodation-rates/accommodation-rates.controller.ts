import { Controller, Get, Query } from '@nestjs/common'
import { AccommodationRatesService } from '~/accommodation-rates/accommodation-rates.service'
import { AccessControl } from '~/common/decorators/control-access.decorator'
import { Role } from '~/generated/prisma/enums'
import { TEpcisAccommodationRates } from '@shared'

@Controller('accommodation-rates')
export class AccommodationRatesController {
  constructor(private readonly accommodationRatesService: AccommodationRatesService) {}

  @AccessControl({ roles: [Role.ADMIN, Role.USER] })
  @Get()
  async getAccommodationRates(@Query() { epcis }: { epcis: string }): Promise<TEpcisAccommodationRates> {
    return this.accommodationRatesService.getAccommodationRates(epcis)
  }
}
