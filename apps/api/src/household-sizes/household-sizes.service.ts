import { Injectable } from '@nestjs/common'
import { TEpci } from '@shared'
import { PrismaService } from '~/db/prisma.service'
import { THouseholdSizesChart, THouseholdSizesDataResults } from '~/schemas/data-visualisation/data-visualisation'

@Injectable()
export class HouseholdSizesService {
  constructor(private readonly prismaService: PrismaService) {}

  async getHouseholdSizesByEpci(epciCode: string, millesime?: string): Promise<Omit<THouseholdSizesDataResults, 'epci'>> {
    const data = await this.prismaService.householdSizes.findMany({
      select: {
        year: true,
        centralB: true,
        centralC: true,
        centralH: true,
        phB: true,
        phC: true,
        phH: true,
        pbB: true,
        pbC: true,
        pbH: true,
      },
      where: {
        epciCode,
        ...(millesime && { millesime }),
      },
    })

    const { max, min } = data.reduce(
      (acc, projection) => {
        Object.entries(projection).forEach(([key, value]) => {
          if (key !== 'year' && value !== null) {
            acc.min = Math.min(acc.min, value)
            acc.max = Math.max(acc.max, value)
          }
        })
        return acc
      },
      { max: -Infinity, min: Infinity },
    )

    return {
      data: data.map((item) => ({
        ...item,
        centralB: Number(item.centralB.toFixed(3)),
        centralC: Number(item.centralC.toFixed(3)),
        centralH: Number(item.centralH.toFixed(3)),
        phB: Number(item.phB.toFixed(3)),
        phC: Number(item.phC.toFixed(3)),
        phH: Number(item.phH.toFixed(3)),
        pbB: Number(item.pbB.toFixed(3)),
        pbC: Number(item.pbC.toFixed(3)),
        pbH: Number(item.pbH.toFixed(3)),
      })),
      metadata: {
        max,
        min,
      },
    }
  }

  async getHouseholdSizes(epcis: TEpci[], millesime?: string): Promise<THouseholdSizesChart> {
    const results = await Promise.all(
      epcis.map(async (epci) => ({
        ...(await this.getHouseholdSizesByEpci(epci.code, millesime)),
        epci,
      })),
    )

    return {
      linearChart: results.reduce(
        (acc, { data, epci, metadata }) => ({
          ...acc,
          [epci.code]: { data, epci, metadata },
        }),
        {},
      ),
    }
  }
}
