import { Injectable } from '@nestjs/common'
import { PrismaService } from '~/db/prisma.service'
import { TEpci } from '@shared'

@Injectable()
export class BadQualityService {
  constructor(private readonly prismaService: PrismaService) {}

  async getBadQualityByEpci(epciCode: string) {
    const badQuality = await this.prismaService.badQuality_Filocom.findFirst({
      where: { epciCode },
    })

    const filocom = (badQuality?.pppiLp ?? 0) + (badQuality?.pppiPo ?? 0)
    return {
      data: filocom,
    }
  }

  async getBadQuality(epcis: TEpci[]) {
    const results = await Promise.all(
      epcis.map(async (epci) => ({
        ...(await this.getBadQualityByEpci(epci.code)),
        epci,
      })),
    )

    return { badQuality: results }
  }
}
