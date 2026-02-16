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
) => {
  return results.reduce((acc, { data, epci }) => {
    if (!acc[epci.code]) {
      acc[epci.code] = {
        '2021': { basse: -Infinity, central: -Infinity, haute: -Infinity },
        '2030': { basse: -Infinity, central: -Infinity, haute: -Infinity },
        '2040': { basse: -Infinity, central: -Infinity, haute: -Infinity },
        '2050': { basse: -Infinity, central: -Infinity, haute: -Infinity },
        annualEvolution: {},
        name: epci.name,
      }
    }

    data.forEach((item) => {
      acc[epci.code][item.year] = {
        basse: Math.round(item.basse),
        central: Math.round(item.central),
        haute: Math.round(item.haute),
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
          basse: {
            percent: `${((Math.pow(endValue.basse / startValue.basse, 1 / (endYear - startYear)) - 1) * 100).toFixed(2)}%`,
            value: Math.round((endValue.basse - startValue.basse) / (endYear - startYear)),
          },
          central: {
            percent: `${((Math.pow(endValue.central / startValue.central, 1 / (endYear - startYear)) - 1) * 100).toFixed(2)}%`,
            value: Math.round((endValue.central - startValue.central) / (endYear - startYear)),
          },
          haute: {
            percent: `${((Math.pow(endValue.haute / startValue.haute, 1 / (endYear - startYear)) - 1) * 100).toFixed(2)}%`,
            value: Math.round((endValue.haute - startValue.haute) / (endYear - startYear)),
          },
        }
      }
    }

    return acc
  }, {} as TDemographicProjectionDataTable)
}

const createProjectionMenagesTableData = (
  results: Array<{ data: TDemographicEvolutionMenagesByEpci[]; epci: { code: string; name: string } }>,
  populationType?: string,
) => {
  return results.reduce((acc, { data, epci }) => {
    if (!acc[epci.code]) {
      acc[epci.code] = {
        '2021': { basse: -Infinity, central: -Infinity, haute: -Infinity },
        '2030': { basse: -Infinity, central: -Infinity, haute: -Infinity },
        '2040': { basse: -Infinity, central: -Infinity, haute: -Infinity },
        '2050': { basse: -Infinity, central: -Infinity, haute: -Infinity },
        annualEvolution: {},
        name: epci.name,
      }
    }
    const dataKeyPrefix = populationType === 'haute' ? 'ph' : populationType === 'central' ? 'central' : 'pb'
    data.forEach((item) => {
      acc[epci.code][item.year] = {
        basse: Math.round(item[`${dataKeyPrefix}B`]!),
        central: Math.round(item[`${dataKeyPrefix}C`]!),
        haute: Math.round(item[`${dataKeyPrefix}H`]!),
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
          basse: {
            percent: `${((Math.pow(endValue[`${dataKeyPrefix}B`]! / startValue[`${dataKeyPrefix}B`]!, 1 / (endYear - startYear)) - 1) * 100).toFixed(2)}%`,
            value: Math.round((endValue[`${dataKeyPrefix}B`]! - startValue[`${dataKeyPrefix}B`]!) / (endYear - startYear)),
          },
          central: {
            percent: `${((Math.pow(endValue[`${dataKeyPrefix}C`]! / startValue[`${dataKeyPrefix}C`]!, 1 / (endYear - startYear)) - 1) * 100).toFixed(2)}%`,
            value: Math.round((endValue[`${dataKeyPrefix}C`]! - startValue[`${dataKeyPrefix}C`]!) / (endYear - startYear)),
          },
          haute: {
            percent: `${((Math.pow(endValue[`${dataKeyPrefix}H`]! / startValue[`${dataKeyPrefix}H`]!, 1 / (endYear - startYear)) - 1) * 100).toFixed(2)}%`,
            value: Math.round((endValue[`${dataKeyPrefix}H`]! - startValue[`${dataKeyPrefix}H`]!) / (endYear - startYear)),
          },
        }
      }
    }

    return acc
  }, {} as TDemographicProjectionDataTable)
}

@Injectable()
export class DemographicEvolutionService {
  constructor(private readonly prismaService: PrismaService) {}

  async getDemographicEvolution(epciCodes: string, years?: number[]): Promise<TDemographicEvolutionMenagesByEpciRecord> {
    const epcisArray = epciCodes.split(',')
    const whereCond: Prisma.Sql = Prisma.sql`WHERE epci_code IN (${Prisma.join(epcisArray)})${years && years.length > 0 ? Prisma.sql` AND year IN (${Prisma.join(years)})` : Prisma.empty}`

    const projections = await this.prismaService.$queryRaw<
      Array<{
        epci_code: string
        year: number
        centralB: number
        centralC: number
        centralH: number
        phB: number
        phC: number
        phH: number
        pbB: number
        pbC: number
        pbH: number
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
        if (key !== 'year') {
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

    Object.values(groupedByEpci).forEach(({ data }) => {
      data.forEach((item) => {
        const existing = allYearsMap.get(item.year)
        if (existing) {
          existing.centralB += item.centralB
          existing.centralC += item.centralC
          existing.centralH += item.centralH
          existing.phB += item.phB
          existing.phC += item.phC
          existing.phH += item.phH
          existing.pbB += item.pbB
          existing.pbC += item.pbC
          existing.pbH += item.pbH
        } else {
          allYearsMap.set(item.year, {
            centralB: item.centralB,
            centralC: item.centralC,
            centralH: item.centralH,
            phB: item.phB,
            phC: item.phC,
            phH: item.phH,
            pbB: item.pbB,
            pbC: item.pbC,
            pbH: item.pbH,
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

  async getDemographicEvolutionPopulationByEpci(epciCodes: string, years?: number[]): Promise<TDemographicEvolutionPopulationByEpciRecord> {
    const epcisArray = epciCodes.split(',')
    const whereCond: Prisma.Sql = Prisma.sql`WHERE epci_code IN (${Prisma.join(epcisArray)})${years && years.length > 0 ? Prisma.sql` AND year IN (${Prisma.join(years)})` : Prisma.empty}`

    const projections = await this.prismaService.$queryRaw<
      Array<{
        epci_code: string
        year: number
        central: number
        haute: number
        basse: number
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
        if (key !== 'year') {
          const numValue = Number(value)
          acc[epci_code].metadata.min = Math.min(acc[epci_code].metadata.min, numValue)
          acc[epci_code].metadata.max = Math.max(acc[epci_code].metadata.max, numValue)
        }
      })

      return acc
    }, {} as TDemographicEvolutionPopulationByEpciRecord)

    // Compute 'all' key: sum values across all EPCIs for each year
    const allYearsMap = new Map<number, { central: number; haute: number; basse: number }>()

    Object.values(groupedByEpci).forEach(({ data }) => {
      data.forEach((item) => {
        const existing = allYearsMap.get(item.year)
        if (existing) {
          existing.central += item.central
          existing.haute += item.haute
          existing.basse += item.basse
        } else {
          allYearsMap.set(item.year, {
            central: item.central,
            haute: item.haute,
            basse: item.basse,
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

  async getDemographicEvolutionPopulation(epcis: TEpci[]) {
    const results = await Promise.all(
      epcis.map(async (epci) => ({
        data: await this.getDemographicEvolutionPopulationByEpci(epci.code),
        epci,
      })),
    )

    return results.reduce(
      (acc, { data, epci }) => ({
        ...acc,
        [epci.code]: { ...data, name: epci.name },
      }),
      {},
    )
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
        if (item.central > maxYearsValues.central.value) maxYearsValues.central = { value: item.central, year: item.year }
        if (item.haute > maxYearsValues.haute.value) maxYearsValues.haute = { value: item.haute, year: item.year }
        if (item.basse > maxYearsValues.basse.value) maxYearsValues.basse = { value: item.basse, year: item.year }
      })

      acc[epci.code] = maxYearsValues
      return acc
    }, {} as TDemographicPopulationMaxYearsByEpci)
  }

  async getDemographicEvolutionPopulationAndYear(epcis: TEpci[]) {
    const results: TDemographicEvolutionPopulationByEpciAndYear[] = await Promise.all(
      epcis.map(async (epci) => {
        const data = await this.getDemographicEvolutionPopulationByEpci(epci.code)
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
        const data = await this.getDemographicEvolutionPopulationByEpci(epci.code, [2021, 2030, 2040, 2050])
        return {
          data: data[epci.code]?.data || [],
          metadata: data[epci.code]?.metadata || {},
          epci,
        }
      }),
    )

    const tableData = createProjectionPopulationTableData(tableResults)

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
        if (item.centralB > maxYearsValues.centralB.value) maxYearsValues.centralB = { value: item.centralB, year: item.year }
        if (item.centralC > maxYearsValues.centralC.value) maxYearsValues.centralC = { value: item.centralC, year: item.year }
        if (item.centralH > maxYearsValues.centralH.value) maxYearsValues.centralH = { value: item.centralH, year: item.year }
        if (item.phB > maxYearsValues.phB.value) maxYearsValues.phB = { value: item.phB, year: item.year }
        if (item.phC > maxYearsValues.phC.value) maxYearsValues.phC = { value: item.phC, year: item.year }
        if (item.phH > maxYearsValues.phH.value) maxYearsValues.phH = { value: item.phH, year: item.year }
        if (item.pbB > maxYearsValues.pbB.value) maxYearsValues.pbB = { value: item.pbB, year: item.year }
        if (item.pbC > maxYearsValues.pbC.value) maxYearsValues.pbC = { value: item.pbC, year: item.year }
        if (item.pbH > maxYearsValues.pbH.value) maxYearsValues.pbH = { value: item.pbH, year: item.year }
      })

      acc[epci.code] = maxYearsValues
      return acc
    }, {} as TDemographicMenagesMaxYearsByEpci)
  }

  async getDemographicEvolutionOmphaleAndYear(epcis: TEpci[], populationType?: string) {
    const results = await Promise.all(
      epcis.map(async (epci) => {
        const data = await this.getDemographicEvolution(epci.code)
        return {
          data: data[epci.code]?.data || [],
          metadata: data[epci.code]?.metadata || {},
          epci,
        }
      }),
    )
    const tableResults = await Promise.all(
      epcis.map(async (epci) => {
        const data = await this.getDemographicEvolution(epci.code, [2021, 2030, 2040, 2050])
        return {
          data: data[epci.code]?.data || [],
          metadata: data[epci.code]?.metadata || {},
          epci,
        }
      }),
    )

    const maxYears = this.getDemographicEvolutionMenagesMaxYearsByEpci(results)

    const tableData = createProjectionMenagesTableData(tableResults, populationType)

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
}
