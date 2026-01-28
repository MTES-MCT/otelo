import { BadRequestException, Injectable } from '@nestjs/common'
import * as Papa from 'papaparse'
import { z } from 'zod'
import { PrismaService } from '~/db/prisma.service'
import { DemographicEvolutionOmphaleCustom, Prisma } from '~/generated/prisma/client'
import {
  TCreateDemographicEvolutionCustomDto,
  TDemographicEvolutionOmphaleCustom,
  ZDemographicEvolutionCustomFile,
} from '~/schemas/demographic-evolution-custom/demographic-evolution-custom'

@Injectable()
export class DemographicEvolutionCustomService {
  constructor(private readonly prisma: PrismaService) {}

  async upsert(userId: string, data: TCreateDemographicEvolutionCustomDto) {
    // Check if a record already exists
    const existing = await this.prisma.demographicEvolutionOmphaleCustom.findFirst({
      where: {
        epciCode: data.epciCode,
        scenarioId: data.scenarioId || null,
      },
    })

    if (existing) {
      // Update existing record
      return this.prisma.demographicEvolutionOmphaleCustom.update({
        where: { id: existing.id },
        data: {
          data: data.data,
          userId,
          updatedAt: new Date(),
        },
      })
    }

    // Create new record
    return this.prisma.demographicEvolutionOmphaleCustom.create({
      data: {
        data: data.data,
        userId,
        epciCode: data.epciCode,
        scenarioId: data.scenarioId,
      },
    })
  }

  async hasUserAccessTo(id: string, userId: string): Promise<boolean> {
    return !!(await this.prisma.demographicEvolutionOmphaleCustom.findFirst({
      where: { id, userId },
    }))
  }

  async findManyAndRecalibrate(userId: string, ids: string[]) {
    const condition = Prisma.sql`AND id IN (${Prisma.join(ids)})
          AND deoc.user_id = ${userId}`
    return this.findAndRecalibrate(condition)
  }

  async findFirstByScenarioAndEpci(scenarioId: string, epciCode: string) {
    const condition = Prisma.sql`AND deoc.scenario_id = ${scenarioId} AND deoc.epci_code = ${epciCode}`
    const results = await this.findAndRecalibrate(condition)

    // There should be only one result, given a scenarioId and epciCode
    if (results.length > 1) {
      throw new BadRequestException('More than one record found')
    }
    return results[0]
  }

  /**
   * Recalibrate values to 2021
   * @param sqlCondition
   */
  async findAndRecalibrate(sqlCondition: Prisma.Sql) {
    return this.prisma.$queryRaw<Array<TDemographicEvolutionOmphaleCustom>>`
      WITH
        raw_data AS (
          SELECT 
            deoc.*,
            deo.central_c AS reference_insee_2021,
            elem ->> 'value' AS reference_custom_2021
          FROM demographic_evolution_omphale_custom deoc
          LEFT JOIN demographic_evolution_omphale deo ON deoc.epci_code = deo.epci_code AND deo.year = 2021,
          LATERAL jsonb_array_elements(deoc.data) AS elem
          WHERE elem ->> 'year' = '2021'
          ${sqlCondition}
        )
      SELECT
        rd.id,
        rd.epci_code AS "epciCode",
        rd.scenario_id AS "scenarioId",
        jsonb_agg(
          jsonb_set(
            element, '{value}',
            to_jsonb(
              ROUND((element ->> 'value')::numeric / rd.reference_custom_2021::numeric * rd.reference_insee_2021::numeric)
            )
          )
        ) AS data,
        rd.user_id AS "userId",
        rd.created_at AS "createdAt",
        rd.updated_at AS "updatedAt"
      FROM raw_data rd,
      LATERAL jsonb_array_elements(data) AS element
      GROUP BY rd.id, rd.epci_code, rd.scenario_id, rd.user_id, rd.created_at, rd.updated_at
    `
  }

  async delete(id: string, userId: string) {
    return this.prisma.demographicEvolutionOmphaleCustom.delete({
      where: { id, userId },
    })
  }

  async parseUploadedFile(buffer: Buffer, mimetype: string): Promise<DemographicEvolutionOmphaleCustom['data']> {
    if (!['text/csv', 'application/csv'].includes(mimetype)) {
      throw new BadRequestException('Unsupported file format. Please use CSV or Excel files.')
    }
    const text = buffer.toString('utf-8')

    // Parse CSV using Papaparse
    const parseResult = Papa.parse(text, {
      header: true,
      dynamicTyping: true,
      skipEmptyLines: true,
    })

    if (parseResult.errors.length > 0) {
      throw new BadRequestException(`CSV parsing errors: ${parseResult.errors.map((e) => e.message).join(', ')}`)
    }

    const data = parseResult.data as Record<string, unknown>[]

    // Validate CSV structure using Zod
    try {
      // First validate that the CSV has the expected structure
      ZDemographicEvolutionCustomFile.parse(data)
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errorMessage = error.issues.map((err) => err.message).join(', ')
        throw new BadRequestException(`Invalid CSV format: ${errorMessage}`)
      }
      throw error
    }

    // Extract MENAGES columns and calculate sums
    const yearData: Array<{ year: number; value: number }> = []
    const headers = Object.keys(data[0])

    // Find all MENAGES_{YEAR} columns
    const menagesColumns = headers.filter((header) => header.startsWith('MENAGES_'))

    for (const column of menagesColumns) {
      // Extract year from column name (MENAGES_2018 -> 2018)
      const yearMatch = column.match(/MENAGES_(\d{4})/)
      if (!yearMatch) continue

      const year = parseInt(yearMatch[1], 10)

      // Sum all values in this column
      let sum = 0
      for (const row of data) {
        const value = row[column]
        if (typeof value === 'number' && !isNaN(value)) {
          sum += value
        }
      }

      // Only include columns where sum is not zero
      if (sum !== 0) {
        yearData.push({ year, value: sum })
      }
    }

    // Sort by year
    yearData.sort((a, b) => a.year - b.year)

    return yearData
  }
}
