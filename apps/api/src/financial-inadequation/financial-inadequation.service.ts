import { Injectable } from '@nestjs/common'
import { PrismaService } from '~/db/prisma.service'
import { TEpci } from '@shared'

@Injectable()
export class FinancialInadequationService {
  constructor(private readonly prismaService: PrismaService) {}

  async getFinancialInadequationByEpci(epciCode: string) {
    const financialInadequation = await this.prismaService.financialInadequation.findFirst({
      where: { epciCode },
    })
    return { data: financialInadequation?.nbAllPlus30ParcLocatifPrive ?? 0 }
  }

  async getFinancialInadequation(epcis: TEpci[]) {
    const results = await Promise.all(
      epcis.map(async (epci) => ({
        ...(await this.getFinancialInadequationByEpci(epci.code)),
        epci,
      })),
    )

    return { financialInadequation: results }
  }
}
