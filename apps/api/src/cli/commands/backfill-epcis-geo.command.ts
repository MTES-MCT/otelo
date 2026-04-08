import { Injectable } from '@nestjs/common'
import { PrismaService } from '~/db/prisma.service'

interface GeoEpci {
  code: string
  nom: string
  codesDepartements: string[]
  codesRegions: string[]
  population: number
}

interface GeoDepartement {
  code: string
  nom: string
  codeRegion: string
}

const BATCH_SIZE = 50

@Injectable()
export class BackfillEpcisGeoCommand {
  private departmentCache = new Map<string, GeoDepartement>()

  constructor(private readonly prisma: PrismaService) {}

  async execute(options: { dryRun: boolean }): Promise<void> {
    const epcis = await this.prisma.epci.findMany({
      select: { code: true, name: true },
      orderBy: { code: 'asc' },
    })

    console.log(`Found ${epcis.length} EPCIs to process (batches of ${BATCH_SIZE})`)

    // Pre-fetch all departments to populate cache
    await this.prefetchDepartments()

    let updated = 0
    let errors = 0

    for (let i = 0; i < epcis.length; i += BATCH_SIZE) {
      const batch = epcis.slice(i, i + BATCH_SIZE)
      const batchNum = Math.floor(i / BATCH_SIZE) + 1
      const totalBatches = Math.ceil(epcis.length / BATCH_SIZE)
      console.log(`\nBatch ${batchNum}/${totalBatches} (${batch.length} EPCIs)`)

      const results = await Promise.all(
        batch.map(async (epci) => {
          try {
            const geoData = await this.fetchEpciGeo(epci.code)
            if (!geoData || geoData.codesDepartements.length === 0) {
              return { epci, status: 'error' as const, message: 'no geo data found' }
            }

            const deptCode = geoData.codesDepartements[0]
            const dept = this.departmentCache.get(deptCode)

            if (!dept) {
              return { epci, status: 'error' as const, message: `department ${deptCode} not found in cache` }
            }

            return { epci, status: 'ok' as const, dept }
          } catch (error) {
            return { epci, status: 'error' as const, message: error instanceof Error ? error.message : String(error) }
          }
        }),
      )

      // Process results: log and write to DB
      for (const result of results) {
        if (result.status === 'error') {
          console.log(`  ⚠ ${result.epci.code} (${result.epci.name}): ${result.message}`)
          errors++
          continue
        }

        const { epci, dept } = result

        if (options.dryRun) {
          console.log(`  ✓ ${epci.code} (${epci.name}) → ${dept.code} ${dept.nom}`)
        } else {
          await this.prisma.epci.update({
            where: { code: epci.code },
            data: {
              departmentCode: dept.code,
              departmentName: dept.nom,
            },
          })
          console.log(`  ✓ ${epci.code} → ${dept.code} ${dept.nom}`)
        }
        updated++
      }
    }

    console.log(`\nDone: ${updated} updated, ${errors} errors`)
    if (options.dryRun) {
      console.log('(dry-run mode — no changes written to database)')
    }
  }

  private async prefetchDepartments(): Promise<void> {
    console.log('Pre-fetching all departments...')
    try {
      const res = await fetch('https://geo.api.gouv.fr/departements')
      if (!res.ok) {
        console.log('  ⚠ Failed to fetch departments list, will resolve individually')
        return
      }
      const departments: GeoDepartement[] = await res.json()
      for (const dept of departments) {
        this.departmentCache.set(dept.code, dept)
      }
      console.log(`  ✓ Cached ${departments.length} departments`)
    } catch {
      console.log('  ⚠ Failed to fetch departments list, will resolve individually')
    }
  }

  private async fetchEpciGeo(code: string): Promise<GeoEpci | null> {
    try {
      const res = await fetch(`https://geo.api.gouv.fr/epcis/${code}`)
      if (!res.ok) return null
      return res.json()
    } catch {
      return null
    }
  }
}
