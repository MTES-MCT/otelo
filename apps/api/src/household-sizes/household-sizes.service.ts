import { Injectable } from '@nestjs/common'
import { PrismaService } from '~/db/prisma.service'
import { THouseholdSizesChart, THouseholdSizesDataResults } from '~/schemas/data-visualisation/data-visualisation'
import { TEpci } from '@shared'

@Injectable()
export class HouseholdSizesService {
  constructor(private readonly prismaService: PrismaService) {}

  async getHouseholdSizesByEpci(epciCode: string): Promise<Omit<THouseholdSizesDataResults, 'epci'>> {
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
      },
    })

    const { max, min } = data.reduce(
      (acc, projection) => {
        Object.entries(projection).forEach(([key, value]) => {
          if (key !== 'year' && value !== null) {
            const numValue = Math.round(value)
            acc.min = Math.min(acc.min, numValue)
            acc.max = Math.max(acc.max, numValue)
          }
        })
        return acc
      },
      { max: -Infinity, min: Infinity },
    )

    return {
      data: data.map((item) => ({
        ...item,
        centralB: Number(item.centralB.toFixed(2)),
        centralC: Number(item.centralC.toFixed(2)),
        centralH: Number(item.centralH.toFixed(2)),
        phB: Number(item.phB.toFixed(2)),
        phC: Number(item.phC.toFixed(2)),
        phH: Number(item.phH.toFixed(2)),
        pbB: Number(item.pbB.toFixed(2)),
        pbC: Number(item.pbC.toFixed(2)),
        pbH: Number(item.pbH.toFixed(2)),
      })),
      metadata: {
        max,
        min,
      },
    }
  }

  async getHouseholdSizes(epcis: TEpci[]): Promise<THouseholdSizesChart> {
    const results = await Promise.all(
      epcis.map(async (epci) => ({
        ...(await this.getHouseholdSizesByEpci(epci.code)),
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
