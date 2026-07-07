import { Injectable } from '@nestjs/common'
import { TEpci } from '@shared'
import { PrismaService } from '~/db/prisma.service'
import { Prisma } from '~/generated/prisma/client'
import { TDemographicProjectionDataTable } from '~/schemas/data-visualisation/data-visualisation'
import {
  TDemographicEvolutionByEpci,
  TDemographicEvolutionMenagesByEpci,
  TDemographicEvolutionMenagesByEpciAndYear,
  TDemographicEvolutionMenagesByEpciRecord,
  TDemographicEvolutionPopulationByEpciAndYear,
  TDemographicEvolutionPopulationByEpciRecord,
  TDemographicMenagesMaxYearsByEpci,
  TDemographicPopulationMaxYearsByEpci,
} from '~/schemas/demographic-evolution/demographic-evolution'

const createProjectionPopulationTableData = (
  results: Array<{ data: TDemographicEvolutionByEpci[]; epci: { code: string; name: string } }>,
  years: number[],
) => {
  const defaultYearValues = Object.fromEntries(years.map((y) => [String(y), { basse: -Infinity, central: -Infinity, haute: -Infinity }]))
  return results.reduce((acc, { data, epci }) => {
    if (!acc[epci.code]) {
      acc[epci.code] = {
        ...defaultYearValues,
        annualEvolution: {},
        name: epci.name,
      } as TDemographicProjectionDataTable[string]
    }

    data.forEach((item) => {
      acc[epci.code][item.year] = {
        basse: item.basse === null ? null : Math.round(item.basse),
        central: item.central === null ? null : Math.round(item.central),
        haute: item.haute === null ? null : Math.round(item.haute),
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
          basse: annualEvolutionEntry(startValue.basse, endValue.basse, startYear, endYear),
          central: annualEvolutionEntry(startValue.central, endValue.central, startYear, endYear),
          haute: annualEvolutionEntry(startValue.haute, endValue.haute, startYear, endYear),
        }
      }
    }

    return acc
  }, {} as TDemographicProjectionDataTable)
}

// Calcule le taux de croissance annuel moyen et la variation annuelle entre deux
// années pour un scénario donné. Renvoie null quand une des bornes est absente
// (scénario indisponible pour l'EPCI, ex. population « basse »).
const annualEvolutionEntry = (
  startValue: number | null,
  endValue: number | null,
  startYear: number,
  endYear: number,
): { percent: string; value: number } | null => {
  if (startValue === null || endValue === null || startValue === 0) {
    return null
  }
  return {
    percent: `${((Math.pow(endValue / startValue, 1 / (endYear - startYear)) - 1) * 100).toFixed(2)}%`,
    value: Math.round((endValue - startValue) / (endYear - startYear)),
  }
}

const createProjectionMenagesTableData = (
  results: Array<{ data: TDemographicEvolutionMenagesByEpci[]; epci: { code: string; name: string } }>,
  years: number[],
  populationType?: string,
) => {
  const defaultYearValues = Object.fromEntries(years.map((y) => [String(y), { basse: -Infinity, central: -Infinity, haute: -Infinity }]))
  return results.reduce((acc, { data, epci }) => {
    if (!acc[epci.code]) {
      acc[epci.code] = {
        ...defaultYearValues,
        annualEvolution: {},
        name: epci.name,
      } as TDemographicProjectionDataTable[string]
    }
    const dataKeyPrefix = populationType === 'haute' ? 'ph' : populationType === 'central' ? 'central' : 'pb'
    const bKey = `${dataKeyPrefix}B` as const
    const cKey = `${dataKeyPrefix}C` as const
    const hKey = `${dataKeyPrefix}H` as const
    data.forEach((item) => {
      acc[epci.code][item.year] = {
        basse: item[bKey] == null ? null : Math.round(item[bKey]),
        central: item[cKey] == null ? null : Math.round(item[cKey]),
        haute: item[hKey] == null ? null : Math.round(item[hKey]),
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
          basse: annualEvolutionEntry(startValue[bKey] ?? null, endValue[bKey] ?? null, startYear, endYear),
          central: annualEvolutionEntry(startValue[cKey] ?? null, endValue[cKey] ?? null, startYear, endYear),
          haute: annualEvolutionEntry(startValue[hKey] ?? null, endValue[hKey] ?? null, startYear, endYear),
        }
      }
    }

    return acc
  }, {} as TDemographicProjectionDataTable)
}

@Injectable()
export class DemographicEvolutionService {
  constructor(private readonly prismaService: PrismaService) {}

  async getDemographicEvolution(epciCodes: string, millesime: string, years?: number[]): Promise<TDemographicEvolutionMenagesByEpciRecord> {
    const epcisArray = epciCodes.split(',')
    const whereCond: Prisma.Sql = Prisma.sql`WHERE epci_code IN (${Prisma.join(epcisArray)})${years && years.length > 0 ? Prisma.sql` AND year IN (${Prisma.join(years)})` : Prisma.empty}${Prisma.sql` AND millesime = ${millesime}`}`

    const projections = await this.prismaService.$queryRaw<
      Array<{
        epci_code: string
        year: number
        centralB: number | null
        centralC: number | null
        centralH: number | null
        phB: number | null
        phC: number | null
        phH: number | null
        pbB: number | null
        pbC: number | null
        pbH: number | null
      }>
    >`
      SELECT 
        epci_code,
        year,
        ROUND(central_b) as "centralB",
        ROUND(central_c) as "centralC",
        ROUND(central_h) as "centralH",
        ROUND(ph_b) as "phB",
        ROUND(ph_c) as "phC",
        ROUND(ph_h) as "phH",
        ROUND(pb_b) as "pbB",
        ROUND(pb_c) as "pbC",
        ROUND(pb_h) as "pbH"
      FROM demographic_evolution_omphale
      ${whereCond}
      ORDER BY epci_code, year ASC
    `

    const groupedByEpci = projections.reduce((acc, projection) => {
      const { epci_code, ...data } = projection

      if (!acc[epci_code]) {
        acc[epci_code] = {
          data: [],
          metadata: { max: -Infinity, min: Infinity },
        }
      }

      acc[epci_code].data.push(data)

      Object.entries(data).forEach(([key, value]) => {
        if (key !== 'year' && value !== null) {
          const numValue = Number(value)
          acc[epci_code].metadata.min = Math.min(acc[epci_code].metadata.min, numValue)
          acc[epci_code].metadata.max = Math.max(acc[epci_code].metadata.max, numValue)
        }
      })

      return acc
    }, {} as TDemographicEvolutionMenagesByEpciRecord)

    // Compute 'all' key: sum values across all EPCIs for each year
    const allYearsMap = new Map<
      number,
      { centralB: number; centralC: number; centralH: number; phB: number; phC: number; phH: number; pbB: number; pbC: number; pbH: number }
    >()

    ;(Object.values(groupedByEpci) as Array<{ data: TDemographicEvolutionMenagesByEpci[] }>).forEach(({ data }) => {
      data.forEach((item) => {
        const existing = allYearsMap.get(item.year)
        if (existing) {
          existing.centralB += item.centralB ?? 0
          existing.centralC += item.centralC ?? 0
          existing.centralH += item.centralH ?? 0
          existing.phB += item.phB ?? 0
          existing.phC += item.phC ?? 0
          existing.phH += item.phH ?? 0
          existing.pbB += item.pbB ?? 0
          existing.pbC += item.pbC ?? 0
          existing.pbH += item.pbH ?? 0
        } else {
          allYearsMap.set(item.year, {
            centralB: item.centralB ?? 0,
            centralC: item.centralC ?? 0,
            centralH: item.centralH ?? 0,
            phB: item.phB ?? 0,
            phC: item.phC ?? 0,
            phH: item.phH ?? 0,
            pbB: item.pbB ?? 0,
            pbC: item.pbC ?? 0,
            pbH: item.pbH ?? 0,
          })
        }
      })
    })

    const allData = Array.from(allYearsMap.entries())
      .sort(([a], [b]) => a - b)
      .map(([year, values]) => ({ year, ...values }))

    let allMin = Infinity
    let allMax = -Infinity
    allData.forEach((item) => {
      Object.entries(item).forEach(([key, value]) => {
        if (key !== 'year') {
          allMin = Math.min(allMin, value)
          allMax = Math.max(allMax, value)
        }
      })
    })

    groupedByEpci['all'] = {
      data: allData,
      metadata: { max: allMax, min: allMin },
    }

    return groupedByEpci
  }

  async getDemographicEvolutionPopulationByEpci(
    epciCodes: string,
    millesime: string,
    years?: number[],
  ): Promise<TDemographicEvolutionPopulationByEpciRecord> {
    const epcisArray = epciCodes.split(',')
    const whereCond: Prisma.Sql = Prisma.sql`WHERE epci_code IN (${Prisma.join(epcisArray)})${years && years.length > 0 ? Prisma.sql` AND year IN (${Prisma.join(years)})` : Prisma.empty}${Prisma.sql` AND millesime = ${millesime}`}`

    const projections = await this.prismaService.$queryRaw<
      Array<{
        epci_code: string
        year: number
        central: number | null
        haute: number | null
        basse: number | null
      }>
    >`
        SELECT 
          epci_code,
          year,
          ROUND(central) as "central",
          ROUND(haute) as "haute",
          ROUND(basse) as "basse"
        FROM demographic_evolution_population
        ${whereCond}
        ORDER BY epci_code, year ASC
      `

    const groupedByEpci = projections.reduce((acc, projection) => {
      const { epci_code, ...data } = projection

      if (!acc[epci_code]) {
        acc[epci_code] = {
          data: [],
          metadata: { max: -Infinity, min: Infinity },
        }
      }

      acc[epci_code].data.push(data)

      Object.entries(data).forEach(([key, value]) => {
        if (key !== 'year' && value !== null) {
          const numValue = Number(value)
          acc[epci_code].metadata.min = Math.min(acc[epci_code].metadata.min, numValue)
          acc[epci_code].metadata.max = Math.max(acc[epci_code].metadata.max, numValue)
        }
      })

      return acc
    }, {} as TDemographicEvolutionPopulationByEpciRecord)

    // Compute 'all' key: sum values across all EPCIs for each year
    const allYearsMap = new Map<number, { central: number; haute: number; basse: number }>()

    ;(Object.values(groupedByEpci) as Array<{ data: TDemographicEvolutionByEpci[] }>).forEach(({ data }) => {
      data.forEach((item) => {
        const existing = allYearsMap.get(item.year)
        if (existing) {
          existing.central += item.central ?? 0
          existing.haute += item.haute ?? 0
          existing.basse += item.basse ?? 0
        } else {
          allYearsMap.set(item.year, {
            central: item.central ?? 0,
            haute: item.haute ?? 0,
            basse: item.basse ?? 0,
          })
        }
      })
    })

    const allData = Array.from(allYearsMap.entries())
      .sort(([a], [b]) => a - b)
      .map(([year, values]) => ({ year, ...values }))

    let allMin = Infinity
    let allMax = -Infinity
    allData.forEach((item) => {
      Object.entries(item).forEach(([key, value]) => {
        if (key !== 'year') {
          allMin = Math.min(allMin, value as number)
          allMax = Math.max(allMax, value as number)
        }
      })
    })

    groupedByEpci['all'] = {
      data: allData,
      metadata: { max: allMax, min: allMin },
    }

    return groupedByEpci
  }

  getDemographicEvolutionPopulationMaxYearsByEpci(
    demographicEvolutionPopulationByEpci: TDemographicEvolutionPopulationByEpciAndYear[],
  ): TDemographicPopulationMaxYearsByEpci {
    return demographicEvolutionPopulationByEpci.reduce((acc, { data, epci }) => {
      const maxYearsValues = {
        central: { value: -Infinity, year: 0 },
        haute: { value: -Infinity, year: 0 },
        basse: { value: -Infinity, year: 0 },
      }

      data.forEach((item) => {
        if (item.central !== null && item.central > maxYearsValues.central.value)
          maxYearsValues.central = { value: item.central, year: item.year }
        if (item.haute !== null && item.haute > maxYearsValues.haute.value) maxYearsValues.haute = { value: item.haute, year: item.year }
        if (item.basse !== null && item.basse > maxYearsValues.basse.value) maxYearsValues.basse = { value: item.basse, year: item.year }
      })

      acc[epci.code] = maxYearsValues
      return acc
    }, {} as TDemographicPopulationMaxYearsByEpci)
  }

  async getDemographicEvolutionPopulationAndYear(epcis: TEpci[], millesime: string) {
    const baseYear = Number(millesime)
    const years = [baseYear, 2030, 2040, 2050]
    const results: TDemographicEvolutionPopulationByEpciAndYear[] = await Promise.all(
      epcis.map(async (epci) => {
        const data = await this.getDemographicEvolutionPopulationByEpci(epci.code, millesime)
        return {
          data: data[epci.code]?.data || [],
          metadata: data[epci.code]?.metadata || {},
          epci,
        }
      }),
    )

    const maxYears = this.getDemographicEvolutionPopulationMaxYearsByEpci(results)

    const tableResults = await Promise.all(
      epcis.map(async (epci) => {
        const data = await this.getDemographicEvolutionPopulationByEpci(epci.code, millesime, years)
        return {
          data: data[epci.code]?.data || [],
          metadata: data[epci.code]?.metadata || {},
          epci,
        }
      }),
    )

    const tableData = createProjectionPopulationTableData(tableResults, years)

    return {
      linearChart: results.reduce(
        (acc, { data, metadata, epci }) => ({
          ...acc,
          [epci.code]: { data, metadata, epci },
        }),
        {},
      ),
      tableData,
      maxYears,
    }
  }

  getDemographicEvolutionMenagesMaxYearsByEpci(
    demographicEvolutionMenagesByEpci: TDemographicEvolutionMenagesByEpciAndYear[],
  ): TDemographicMenagesMaxYearsByEpci {
    return demographicEvolutionMenagesByEpci.reduce((acc, { data, epci }) => {
      const maxYearsValues = {
        centralB: { value: -Infinity, year: 0 },
        centralC: { value: -Infinity, year: 0 },
        centralH: { value: -Infinity, year: 0 },
        phB: { value: -Infinity, year: 0 },
        phC: { value: -Infinity, year: 0 },
        phH: { value: -Infinity, year: 0 },
        pbB: { value: -Infinity, year: 0 },
        pbC: { value: -Infinity, year: 0 },
        pbH: { value: -Infinity, year: 0 },
      }

      data.forEach((item) => {
        if (item.centralB !== null && item.centralB > maxYearsValues.centralB.value)
          maxYearsValues.centralB = { value: item.centralB, year: item.year }
        if (item.centralC !== null && item.centralC > maxYearsValues.centralC.value)
          maxYearsValues.centralC = { value: item.centralC, year: item.year }
        if (item.centralH !== null && item.centralH > maxYearsValues.centralH.value)
          maxYearsValues.centralH = { value: item.centralH, year: item.year }
        if (item.phB !== null && item.phB > maxYearsValues.phB.value) maxYearsValues.phB = { value: item.phB, year: item.year }
        if (item.phC !== null && item.phC > maxYearsValues.phC.value) maxYearsValues.phC = { value: item.phC, year: item.year }
        if (item.phH !== null && item.phH > maxYearsValues.phH.value) maxYearsValues.phH = { value: item.phH, year: item.year }
        if (item.pbB !== null && item.pbB > maxYearsValues.pbB.value) maxYearsValues.pbB = { value: item.pbB, year: item.year }
        if (item.pbC !== null && item.pbC > maxYearsValues.pbC.value) maxYearsValues.pbC = { value: item.pbC, year: item.year }
        if (item.pbH !== null && item.pbH > maxYearsValues.pbH.value) maxYearsValues.pbH = { value: item.pbH, year: item.year }
      })

      acc[epci.code] = maxYearsValues
      return acc
    }, {} as TDemographicMenagesMaxYearsByEpci)
  }

  async getDemographicEvolutionOmphaleAndYear(epcis: TEpci[], millesime: string, populationType?: string) {
    const baseYear = Number(millesime)
    const years = [baseYear, 2030, 2040, 2050]
    const results = await Promise.all(
      epcis.map(async (epci) => {
        const data = await this.getDemographicEvolution(epci.code, millesime)
        return {
          data: data[epci.code]?.data || [],
          metadata: data[epci.code]?.metadata || {},
          epci,
        }
      }),
    )
    const tableResults = await Promise.all(
      epcis.map(async (epci) => {
        const data = await this.getDemographicEvolution(epci.code, millesime, years)
        return {
          data: data[epci.code]?.data || [],
          metadata: data[epci.code]?.metadata || {},
          epci,
        }
      }),
    )

    const maxYears = this.getDemographicEvolutionMenagesMaxYearsByEpci(results)

    const tableData = createProjectionMenagesTableData(tableResults, years, populationType)

    return {
      linearChart: results.reduce(
        (acc, { data, metadata, epci }) => ({
          ...acc,
          [epci.code]: { data, metadata, epci },
        }),
        {},
      ),
      tableData,
      maxYears,
    }
  }

  async getEpcisWithoutInseeProjection(epciCodes: string): Promise<string[]> {
    const epcisArray = epciCodes.split(',')
    const epcis = await this.prismaService.epci.findMany({
      where: {
        code: { in: epcisArray },
        noInseeProjection: true,
      },
      select: { code: true },
    })
    return epcis.map((e) => e.code)
  }
}
