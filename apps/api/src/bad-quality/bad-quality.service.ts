import { Injectable } from '@nestjs/common'
import { TEpci } from '@shared'
import { PrismaService } from '~/db/prisma.service'

@Injectable()
export class BadQualityService {
  constructor(private readonly prismaService: PrismaService) {}

  async getBadQualityByEpci(epciCode: string, millesime?: string) {
    const badQuality = await this.prismaService.badQuality_Filocom.findFirst({
      where: { epciCode, ...(millesime && { millesime }) },
    })

    const filocom = (badQuality?.pppiLp ?? 0) + (badQuality?.pppiPo ?? 0)
    return {
      data: filocom,
    }
  }

  async getBadQuality(epcis: TEpci[], millesime?: string) {
    const results = await Promise.all(
      epcis.map(async (epci) => ({
        ...(await this.getBadQualityByEpci(epci.code, millesime)),
        epci,
      })),
    )

    return { badQuality: results }
  }
}
