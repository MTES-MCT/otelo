import { Injectable } from '@nestjs/common'
import { TEpci } from '@shared'
import { PrismaService } from '~/db/prisma.service'

@Injectable()
export class PhysicalInadequationService {
  constructor(private readonly prismaService: PrismaService) {}

  async getPhysicalInadequationByEpci(epciCode: string, millesime?: string) {
    const physicalInadequation = await this.prismaService.physicalInadequation_Filo.findFirst({
      where: { epciCode, ...(millesime && { millesime }) },
    })

    return { data: (physicalInadequation?.suroccLourdeLp ?? 0) + (physicalInadequation?.suroccLourdePo ?? 0) }
  }

  async getPhysicalInadequation(epcis: TEpci[], millesime?: string) {
    const results = await Promise.all(
      epcis.map(async (epci) => ({
        ...(await this.getPhysicalInadequationByEpci(epci.code, millesime)),
        epci,
      })),
    )

    return { physicalInadequation: results }
  }
}
