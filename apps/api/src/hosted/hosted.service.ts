import { Injectable } from '@nestjs/common'
import { TEpci } from '@shared'
import { PrismaService } from '~/db/prisma.service'

@Injectable()
export class HostedService {
  constructor(private readonly prismaService: PrismaService) {}

  async getHostedByEpci(epciCode: string, millesime?: string) {
    const [hostedFilocom, hostedSne] = await Promise.all([
      this.prismaService.hostedFilocom.findFirst({
        where: {
          epciCode,
          ...(millesime && { millesime }),
        },
      }),
      this.prismaService.hostedSne.findFirst({
        where: {
          epciCode,
          ...(millesime && { millesime }),
        },
      }),
    ])
    const { value: filocom } = hostedFilocom ?? { value: 0 }
    const sne = Object.entries(hostedSne ?? {})
      .filter(([key]) => key !== 'epciCode')
      .reduce((sum, [_, value]) => sum + (value as number), 0)
    return {
      data: {
        filocom,
        sne,
        total: filocom + sne,
      },
    }
  }

  async getHosted(epcis: TEpci[], millesime?: string) {
    const results = await Promise.all(
      epcis.map(async (epci) => ({
        ...(await this.getHostedByEpci(epci.code, millesime)),
        epci,
      })),
    )
    return { hosted: results }
  }
}
