import { Injectable } from '@nestjs/common'
import { TEpci } from '@shared'
import { PrismaService } from '~/db/prisma.service'

@Injectable()
export class FinancialInadequationService {
  constructor(private readonly prismaService: PrismaService) {}

  async getFinancialInadequationByEpci(epciCode: string, millesime?: string) {
    const financialInadequation = await this.prismaService.financialInadequation.findFirst({
      where: { epciCode, ...(millesime && { millesime }) },
    })
    return { data: financialInadequation?.nbAllPlus30ParcLocatifPrive ?? 0 }
  }

  async getFinancialInadequation(epcis: TEpci[], millesime?: string) {
    const results = await Promise.all(
      epcis.map(async (epci) => ({
        ...(await this.getFinancialInadequationByEpci(epci.code, millesime)),
        epci,
      })),
    )

    return { financialInadequation: results }
  }
}
