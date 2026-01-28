import { Injectable } from '@nestjs/common'
import { PrismaService } from '~/db/prisma.service'
import { TEpci } from '@shared'

@Injectable()
export class SitadelService {
  constructor(private readonly prismaService: PrismaService) {}

  async getSitadel(epcis: TEpci[]) {
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
