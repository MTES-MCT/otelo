import { Injectable } from '@nestjs/common'
import { TEpci } from '@shared'
import { PrismaService } from '~/db/prisma.service'

@Injectable()
export class PhysicalInadequationService {
  constructor(private readonly prismaService: PrismaService) {}

  async getPhysicalInadequationByEpci(epciCode: string) {
    const physicalInadequation = await this.prismaService.physicalInadequation_Filo.findFirst({
      where: { epciCode },
    })

    return { data: (physicalInadequation?.suroccLourdeLp ?? 0) + (physicalInadequation?.suroccLourdePo ?? 0) }
  }

  async getPhysicalInadequation(epcis: TEpci[]) {
    const results = await Promise.all(
      epcis.map(async (epci) => ({
        ...(await this.getPhysicalInadequationByEpci(epci.code)),
        epci,
      })),
    )

    return { physicalInadequation: results }
  }
}
