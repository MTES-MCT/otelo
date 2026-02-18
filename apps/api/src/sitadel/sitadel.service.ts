import { Injectable } from '@nestjs/common'
import { TEpci } from '@shared'
import { PrismaService } from '~/db/prisma.service'

@Injectable()
export class SitadelService {
  constructor(private readonly prismaService: PrismaService) {}

  async getSitadel(epcis: TEpci[], millesime?: string) {
    const epciCodes = epcis.map((epci) => epci.code)
    const sitadelData = await this.prismaService.sitadel.findMany({
      orderBy: {
        year: 'asc',
      },
      select: {
        epciCode: true,
        authorizedHousingCount: true,
        startedHousingCount: true,
        year: true,
      },
      where: {
        epciCode: {
          in: epciCodes,
        },
        ...(millesime && { millesime }),
      },
    })

    return epcis.reduce((acc, epci) => {
      const data = sitadelData.filter((item) => item.epciCode === epci.code)
      acc[epci.code] = {
        name: epci.name,
        data,
      }
      return acc
    }, {})
  }
}
