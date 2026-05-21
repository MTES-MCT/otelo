import { Injectable } from '@nestjs/common'
import { TEpci } from '@shared'
import { PrismaService } from '~/db/prisma.service'
import { VacancyAccommodation } from '~/generated/prisma/client'
import { TVacancyAccommodationDataTable, TVacancyAccommodationEvolution } from '~/schemas/data-visualisation/data-visualisation'

const createTableData = (results: TVacancyAccommodationEvolution[]): TVacancyAccommodationDataTable => {
  return results.reduce((acc, { data, epci }) => {
    if (!acc[epci.code]) {
      acc[epci.code] = {
        annualEvolution: {},
        name: epci.name,
      }
    }

    data.forEach((item) => {
      acc[epci.code][item.year] = {
        nbLogVac2Less: Math.round(item.nbLogVac2Less),
        nbLogVac2More: Math.round(item.nbLogVac2More),
        propLogVac2Less: `${(item.propLogVac2Less * 100).toFixed(2)}%`,
        propLogVac2More: `${(item.propLogVac2More * 100).toFixed(2)}%`,
        nbTotal: item.nbTotal,
      }
    })

    const years = data.map((item) => item.year).sort((a, b) => a - b)

    for (let i = 0; i < years.length - 1; i++) {
      const startYear = years[i]
      const endYear = years[i + 1]
      const startValue = data.find((item) => item.year === startYear)
      const endValue = data.find((item) => item.year === endYear)

      if (startValue && endValue) {
        acc[epci.code].annualEvolution![`${startYear}-${endYear}`] = {
          nbLogVac2Less: {
            percent: `${((Math.pow(endValue.nbLogVac2Less / startValue.nbLogVac2Less, 1 / (endYear - startYear)) - 1) * 100).toFixed(2)}%`,
            value: Math.round((endValue.nbLogVac2Less - startValue.nbLogVac2Less) / (endYear - startYear)),
          },
          nbLogVac2More: {
            percent: `${((Math.pow(endValue.nbLogVac2More / startValue.nbLogVac2More, 1 / (endYear - startYear)) - 1) * 100).toFixed(2)}%`,
            value: Math.round((endValue.nbLogVac2More - startValue.nbLogVac2More) / (endYear - startYear)),
          },
        }
      }
    }

    return acc
  }, {} as TVacancyAccommodationDataTable)
}

@Injectable()
export class VacancyService {
  constructor(private readonly prismaService: PrismaService) {}

  async getNewestVacancy(epcisCodes: string[], millesime?: string): Promise<VacancyAccommodation[]> {
    const targetYear = Number(millesime)
    const hasTargetYear = Number.isFinite(targetYear)

    const targetYearData = await this.prismaService.vacancyAccommodation.findMany({
      where: {
        epciCode: { in: epcisCodes },
        ...(hasTargetYear ? { year: targetYear } : {}),
      },
      orderBy: [{ epciCode: 'asc' }, { year: 'desc' }],
    })

    const foundEpcis = new Set(targetYearData.map((item) => item.epciCode))
    const missingEpcis = epcisCodes.filter((code) => !foundEpcis.has(code))

    if (!missingEpcis.length) {
      return targetYearData
    }

    const fallbackRows = await this.prismaService.vacancyAccommodation.findMany({
      where: { epciCode: { in: missingEpcis } },
      orderBy: [{ epciCode: 'asc' }, { year: 'desc' }],
    })

    const fallbackByEpci = new Map<string, VacancyAccommodation>()
    for (const row of fallbackRows) {
      if (!fallbackByEpci.has(row.epciCode)) {
        fallbackByEpci.set(row.epciCode, row)
      }
    }

    return [...targetYearData, ...Array.from(fallbackByEpci.values())]
  }

  async getVacancyByEpci(epciCode: string, years?: number[]) {
    const whereCond = years ? { epciCode, year: { in: years } } : { epciCode }
    const data = await this.prismaService.vacancyAccommodation.findMany({
      select: {
        year: true,
        nbLogVac2Less: true,
        nbLogVac2More: true,
        propLogVac2Less: true,
        propLogVac2More: true,
        nbTotal: true,
      },
      where: whereCond,
    })

    const { max, min } = data.reduce(
      (acc, projection) => {
        Object.entries(projection).forEach(([key, value]) => {
          if (key !== 'year' && key !== 'nbTotal') {
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
      data,
      metadata: { max, min },
    }
  }

  async getVacancy(epcis: TEpci[]) {
    const results = await Promise.all(
      epcis.map(async (epci) => ({
        ...(await this.getVacancyByEpci(epci.code, [2014, 2019, 2024])),
        epci,
      })),
    )

    const tableData = createTableData(results)
    return {
      linearChart: results.reduce(
        (acc, { data, epci, metadata }) => ({
          ...acc,
          [epci.code]: { data, epci, metadata },
        }),
        {},
      ),
      tableData,
    }
  }
}
